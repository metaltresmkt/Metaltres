-- Restoring missing columns required by the triggers
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS followup_count int DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS loss_reason text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_message_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_outbound_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS sla_breach_count int DEFAULT 0;

-- 1. fn_check_followup_exhausted
CREATE OR REPLACE FUNCTION public.fn_check_followup_exhausted()
RETURNS trigger AS $$
DECLARE 
  v_max_attempts int; 
  v_perdido_id uuid; 
BEGIN 
  IF NEW.followup_count = OLD.followup_count THEN 
    RETURN NEW; 
  END IF; 
  
  SELECT followup_max_attempts INTO v_max_attempts 
  FROM public.ai_config 
  WHERE loja_id = NEW.loja_id LIMIT 1; 
  
  IF v_max_attempts IS NULL OR NEW.followup_count < v_max_attempts THEN 
    RETURN NEW; 
  END IF; 
  
  SELECT id INTO v_perdido_id 
  FROM public.funnel_stages 
  WHERE loja_id = NEW.loja_id AND name = 'Perdido' LIMIT 1; 
  
  IF v_perdido_id IS NOT NULL AND (NEW.stage_id IS DISTINCT FROM v_perdido_id) THEN 
    NEW.stage_id := v_perdido_id; 
    NEW.loss_reason := 'Tentativas de follow-up esgotadas'; 
  END IF; 
  
  RETURN NEW; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_followup_exhausted ON public.leads;
CREATE TRIGGER trg_followup_exhausted
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.fn_check_followup_exhausted();

-- 2. fn_update_lead_last_message
CREATE OR REPLACE FUNCTION public.fn_update_lead_last_message()
RETURNS trigger AS $$
BEGIN
  IF NEW.lead_id IS NOT NULL AND NEW.direction = 'inbound' THEN
    UPDATE public.leads
      SET last_message_at = NEW.created_at
      WHERE id = NEW.lead_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_lead_last_message ON public.chat_messages;
CREATE TRIGGER trg_update_lead_last_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_lead_last_message();

-- 3. fn_update_lead_last_outbound
CREATE OR REPLACE FUNCTION public.fn_update_lead_last_outbound()
RETURNS trigger AS $$
BEGIN
  IF NEW.lead_id IS NOT NULL AND NEW.direction = 'outbound' THEN
    UPDATE public.leads
      SET last_outbound_at = NEW.created_at
      WHERE id = NEW.lead_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_lead_last_outbound ON public.chat_messages;
CREATE TRIGGER trg_update_lead_last_outbound
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_lead_last_outbound();

-- 4. handle_chat_message_master_logic
CREATE OR REPLACE FUNCTION public.handle_chat_message_master_logic()
RETURNS trigger AS $$
DECLARE
    json_data JSONB;
    v_ai_enabled boolean;
    v_global_active boolean;
    v_ref_loja_id UUID;
    v_ref_lead_id UUID;
    v_lead_phone TEXT;
    v_clinic_phone TEXT;
    v_stage_id UUID;
    v_sla_minutes integer;
    v_business_hours jsonb;
    v_last_msg_at timestamptz;
    v_last_out_at timestamptz;
    v_is_handoff boolean := false;
BEGIN
    -- [A] LIMPEZA E FORMATAÃ‡ÃƒO DE JSON
    IF (NEW.message IS NOT NULL) THEN
        IF jsonb_typeof(NEW.message) = 'string' THEN
            BEGIN
                json_data := (NEW.message#>>'{}')::jsonb;
                NEW.message := json_data;
            EXCEPTION WHEN OTHERS THEN
                json_data := NEW.message;
            END;
        ELSE
            json_data := NEW.message;
        END IF;

        IF NEW.sender IS NULL OR NEW.sender = 'system' THEN
            DECLARE
                msg_role TEXT := COALESCE(json_data->>'role', json_data->>'type');
            BEGIN
                IF (msg_role = 'user' OR msg_role = 'human') THEN
                    NEW.sender := 'human';
                    NEW.direction := 'inbound';
                ELSIF (msg_role IN ('ai', 'assistant', 'bot')) THEN
                    NEW.sender := 'ai';
                    NEW.direction := 'outbound';
                ELSE
                    NEW.sender := 'system';
                    NEW.direction := 'outbound';
                END IF;
            END;
        END IF;

        -- Detecta se a mensagem da IA Ã© um handoff (transbordo)
        IF NEW.sender = 'ai' AND json_data IS NOT NULL THEN
            IF json_data->>'content' ILIKE '%transferir%atendente%'
               OR json_data->>'content' ILIKE '%gatilho:%'
               OR json_data->>'content' ILIKE '%handoff%' THEN
                v_is_handoff := true;
            END IF;
        END IF;
    END IF;

    -- [B] DESCOBERTA DE CLÃNICA
    IF NEW.loja_id IS NULL AND NEW.session_id IS NOT NULL THEN
        SELECT loja_id INTO v_ref_loja_id FROM public.chat_messages WHERE session_id = NEW.session_id AND loja_id IS NOT NULL LIMIT 1;
        IF v_ref_loja_id IS NULL THEN
            SELECT loja_id INTO v_ref_loja_id FROM public.whatsapp_instances WHERE starts_with(NEW.session_id, phone_number) LIMIT 1;
        END IF;
        NEW.loja_id := v_ref_loja_id;
    END IF;

    -- [C] CAPTURA/CRIAÃ‡ÃƒO DE LEAD
    IF NEW.loja_id IS NOT NULL AND (NEW.lead_id IS NULL OR NEW.phone IS NULL) THEN
        SELECT phone_number INTO v_clinic_phone FROM public.whatsapp_instances WHERE loja_id = NEW.loja_id LIMIT 1;

        v_lead_phone := NEW.phone;

        IF (v_lead_phone IS NULL OR v_lead_phone = '') AND NEW.session_id IS NOT NULL THEN
            IF v_clinic_phone IS NOT NULL
               AND starts_with(NEW.session_id, v_clinic_phone)
               AND length(NEW.session_id) > length(v_clinic_phone) THEN
                v_lead_phone := substr(NEW.session_id, length(v_clinic_phone) + 1);
            ELSIF NEW.session_id <> COALESCE(v_clinic_phone, '') THEN
                v_lead_phone := NEW.session_id;
            END IF;
        END IF;

        IF v_lead_phone IS NOT NULL AND v_lead_phone <> '' AND v_lead_phone <> COALESCE(v_clinic_phone, '') THEN
            SELECT id INTO v_ref_lead_id FROM public.leads WHERE loja_id = NEW.loja_id AND phone = v_lead_phone LIMIT 1;
            IF v_ref_lead_id IS NULL THEN
                SELECT id INTO v_stage_id FROM public.funnel_stages 
                WHERE loja_id = NEW.loja_id 
                ORDER BY position ASC LIMIT 1;

                SELECT id INTO v_stage_id FROM public.funnel_stages 
                WHERE loja_id = NEW.loja_id 
                  AND (LOWER(name) LIKE '%whatsapp%' OR LOWER(name) LIKE '%contato%')
                ORDER BY position ASC LIMIT 1;

                INSERT INTO public.leads (loja_id, name, phone, source, stage_id)
                VALUES (NEW.loja_id, 'Lead ' || v_lead_phone, v_lead_phone, 'whatsapp', v_stage_id)
                RETURNING id INTO v_ref_lead_id;
            END IF;
            NEW.lead_id := COALESCE(NEW.lead_id, v_ref_lead_id);
            NEW.phone := COALESCE(NEW.phone, v_lead_phone);
        END IF;

        -- [C2] FALLBACK: se session_id = clinic phone (sem lead phone extraÃ­vel),
        -- busca o lead mais recente ativo desta clÃ­nica
        IF NEW.lead_id IS NULL AND NEW.loja_id IS NOT NULL THEN
            SELECT id, phone INTO v_ref_lead_id, v_lead_phone 
            FROM public.leads 
            WHERE loja_id = NEW.loja_id 
              AND ai_enabled = false
            ORDER BY updated_at DESC 
            LIMIT 1;
            
            IF v_ref_lead_id IS NOT NULL THEN
                NEW.lead_id := v_ref_lead_id;
                NEW.phone := v_lead_phone;
            END IF;
        END IF;
    END IF;

    IF NEW.direction IS NULL THEN
        NEW.direction := 'outbound';
    END IF;

    -- [D] CONTROLE DE TRANSBORDO
    IF NEW.sender = 'ai' AND NEW.loja_id IS NOT NULL THEN
        SELECT auto_schedule INTO v_global_active FROM public.ai_config WHERE loja_id = NEW.loja_id;
        IF v_global_active = false THEN
            NEW.metadata := COALESCE(NEW.metadata, '{}'::jsonb) || jsonb_build_object('ai_blocked', true, 'block_reason', 'global_off');
        END IF;

        IF NEW.lead_id IS NOT NULL THEN
            SELECT ai_enabled INTO v_ai_enabled FROM public.leads WHERE id = NEW.lead_id;
            IF v_ai_enabled = false THEN
                NEW.metadata := COALESCE(NEW.metadata, '{}'::jsonb) || jsonb_build_object('ai_blocked', true, 'block_reason', 'handoff_active');
            END IF;
        END IF;
    END IF;

    -- [E] AUTO-PAUSE IA, BUMP DO LEAD E SLA BREACH
    IF NEW.lead_id IS NOT NULL THEN
        IF NEW.sender = 'human' AND NEW.direction = 'outbound' THEN
            -- Atendente humano respondeu â†’ pausa IA e marca outbound
            UPDATE public.leads SET ai_enabled = false, last_outbound_at = now(), updated_at = now() WHERE id = NEW.lead_id;
        ELSIF NEW.direction = 'outbound' THEN
            -- Resposta outbound (IA ou sistema)
            IF v_is_handoff THEN
                UPDATE public.leads SET ai_enabled = false, updated_at = now() WHERE id = NEW.lead_id;
            ELSE
                SELECT sla_minutes, business_hours INTO v_sla_minutes, v_business_hours
                FROM public.ai_config WHERE loja_id = NEW.loja_id;

                IF v_sla_minutes IS NOT NULL AND v_sla_minutes > 0 THEN
                    SELECT last_message_at, last_outbound_at 
                    INTO v_last_msg_at, v_last_out_at
                    FROM public.leads WHERE id = NEW.lead_id;

                    IF v_last_msg_at IS NOT NULL 
                       AND (v_last_out_at IS NULL OR v_last_msg_at > v_last_out_at)
                       AND (EXTRACT(EPOCH FROM (now() - v_last_msg_at)) / 60) > v_sla_minutes THEN
                        UPDATE public.leads 
                        SET sla_breach_count = sla_breach_count + 1, 
                            last_outbound_at = now(), 
                            updated_at = now() 
                        WHERE id = NEW.lead_id;
                    ELSE
                        UPDATE public.leads SET last_outbound_at = now(), updated_at = now() WHERE id = NEW.lead_id;
                    END IF;
                ELSE
                    UPDATE public.leads SET last_outbound_at = now(), updated_at = now() WHERE id = NEW.lead_id;
                END IF;
            END IF;
        ELSIF NEW.sender = 'human' AND NEW.direction = 'inbound' THEN
            UPDATE public.leads SET last_message_at = now(), updated_at = now() WHERE id = NEW.lead_id;
        ELSE
            UPDATE public.leads SET updated_at = now() WHERE id = NEW.lead_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_chat_message_master_logic ON public.chat_messages;
CREATE TRIGGER tr_chat_message_master_logic
BEFORE INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_chat_message_master_logic();

-- 5. handle_new_clinic
CREATE OR REPLACE FUNCTION public.handle_new_clinic()
RETURNS trigger AS $$
BEGIN
    -- Criar configuraÃ§Ã£o de IA padrÃ£o
    INSERT INTO public.ai_config (loja_id)
    VALUES (NEW.id)
    ON CONFLICT (loja_id) DO NOTHING;

    -- Criar instÃ¢ncia de WhatsApp padrÃ£o
    INSERT INTO public.whatsapp_instances (loja_id, api_url, api_token)
    VALUES (NEW.id, '', '')
    ON CONFLICT (loja_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_clinic_created ON public.lojas;
CREATE TRIGGER on_clinic_created
AFTER INSERT ON public.lojas
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_clinic();

-- 6. update_ai_config_phone
CREATE OR REPLACE FUNCTION public.update_ai_config_phone()
RETURNS trigger AS $$
BEGIN
  UPDATE public.ai_config
  SET phone = NEW.phone_number
  WHERE loja_id = NEW.loja_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_update_ai_config_phone ON public.whatsapp_instances;
CREATE TRIGGER tr_update_ai_config_phone
AFTER INSERT OR UPDATE OF phone_number ON public.whatsapp_instances
FOR EACH ROW
EXECUTE FUNCTION public.update_ai_config_phone();
