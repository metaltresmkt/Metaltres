-- ============================================
-- RECOVERY - CONSOLIDATED MISSING SCHEMA
-- ============================================

-- 1. `chat_messages` fix
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS session_id text;
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);

-- 2. `ai_config` restoration
ALTER TABLE public.ai_config
  ADD COLUMN IF NOT EXISTS confirm_enabled     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirm_lead_time   int     NOT NULL DEFAULT 1440,
  ADD COLUMN IF NOT EXISTS confirm_message     text    DEFAULT 'Olá {cliente}! Seu orçamento foi recebido e estamos processando. Gostaria de confirmar algumas informações?',
  ADD COLUMN IF NOT EXISTS followup_enabled    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS followup_delay      int     NOT NULL DEFAULT 1440,
  ADD COLUMN IF NOT EXISTS followup_message    text    DEFAULT 'Olá {cliente}, percebi que ainda não finalizamos seu atendimento. Gostaria de continuar de onde paramos?',
  ADD COLUMN IF NOT EXISTS handoff_rules       jsonb   NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS handoff_enabled     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS handoff_message     text    DEFAULT 'Entendido! Estou transferindo seu atendimento para um de nossos especialistas da Metaltres. Por favor, aguarde um momento.',
  ADD COLUMN IF NOT EXISTS handoff_triggers    text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sla_minutes         int     NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS business_hours      jsonb   NOT NULL DEFAULT '{"start":"08:00","end":"18:00","days":[1,2,3,4,5]}'::jsonb;

-- 3. `leads` automation tracking
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS followup_sent_at     timestamptz,
  ADD COLUMN IF NOT EXISTS followup_count       int  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS handoff_triggered_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirm_sent_at      timestamptz,
  ADD COLUMN IF NOT EXISTS last_message_at      timestamptz,
  ADD COLUMN IF NOT EXISTS last_outbound_at     timestamptz;

-- 4. `automation_logs` table
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id    uuid        NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  lead_id      uuid        REFERENCES public.leads(id) ON DELETE SET NULL,
  type         text        NOT NULL CHECK (type IN ('followup', 'handoff', 'confirm')),
  rule_id      text,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  status       text        NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'skipped')),
  message_sent text,
  metadata     jsonb       DEFAULT '{}'::jsonb
);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_logs' AND policyname = 'automation_logs_all') THEN
        CREATE POLICY automation_logs_all ON public.automation_logs
        FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));
    END IF;
END $$;

-- 5. `clinics` notification group
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS notification_group_id text;

-- 6. Triggers for `leads` logic
CREATE OR REPLACE FUNCTION public.fn_update_lead_last_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lead_id IS NOT NULL AND NEW.direction = 'inbound' THEN
    UPDATE public.leads SET last_message_at = NEW.created_at WHERE id = NEW.lead_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_lead_last_message ON public.chat_messages;
CREATE TRIGGER trg_update_lead_last_message AFTER INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.fn_update_lead_last_message();

CREATE OR REPLACE FUNCTION public.fn_update_lead_last_outbound()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lead_id IS NOT NULL AND NEW.direction = 'outbound' THEN
    UPDATE public.leads SET last_outbound_at = NEW.created_at WHERE id = NEW.lead_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_lead_last_outbound ON public.chat_messages;
CREATE TRIGGER trg_update_lead_last_outbound AFTER INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.fn_update_lead_last_outbound();
