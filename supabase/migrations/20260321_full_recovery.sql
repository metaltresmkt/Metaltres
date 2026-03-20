-- ============================================
-- REUPERAÇÃO TOTAL DE ESQUEMA - METALTRES
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CLINICS: Add notification group
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clinics' AND column_name='notification_group_id') THEN
    ALTER TABLE public.clinics ADD COLUMN notification_group_id text;
  END IF;
END $$;

-- 2. AI_CONFIG: Comprehensive features
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_config' AND column_name='name') THEN
    ALTER TABLE public.ai_config ADD COLUMN name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_config' AND column_name='prompt') THEN
    ALTER TABLE public.ai_config ADD COLUMN prompt text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_config' AND column_name='phone') THEN
    ALTER TABLE public.ai_config ADD COLUMN phone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_config' AND column_name='confirm_enabled') THEN
    ALTER TABLE public.ai_config ADD COLUMN confirm_enabled boolean DEFAULT false;
    ALTER TABLE public.ai_config ADD COLUMN confirm_message text DEFAULT 'Confirmado! Te vejo em breve.';
    ALTER TABLE public.ai_config ADD COLUMN confirm_lead_time int DEFAULT 60;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_config' AND column_name='followup_enabled') THEN
    ALTER TABLE public.ai_config ADD COLUMN followup_enabled boolean DEFAULT false;
    ALTER TABLE public.ai_config ADD COLUMN followup_message text DEFAULT 'Olá {cliente}! Alguma dúvida sobre nossa proposta?';
    ALTER TABLE public.ai_config ADD COLUMN followup_delay int DEFAULT 1440; -- 24h
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_config' AND column_name='handoff_enabled') THEN
    ALTER TABLE public.ai_config ADD COLUMN handoff_enabled boolean DEFAULT false;
    ALTER TABLE public.ai_config ADD COLUMN sla_minutes int DEFAULT 30;
    ALTER TABLE public.ai_config ADD COLUMN business_hours jsonb DEFAULT '{"start": "08:00", "end": "18:00", "days": [1,2,3,4,5]}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_config' AND column_name='default_ticket_value') THEN
    ALTER TABLE public.ai_config ADD COLUMN default_ticket_value numeric DEFAULT 0;
  END IF;
END $$;

-- 3. LEADS: Automation & Tracking
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='ai_enabled') THEN
    ALTER TABLE public.leads ADD COLUMN ai_enabled boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='last_message_at') THEN
    ALTER TABLE public.leads ADD COLUMN last_message_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='last_outbound_at') THEN
    ALTER TABLE public.leads ADD COLUMN last_outbound_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='last_message_preview') THEN
    ALTER TABLE public.leads ADD COLUMN last_message_preview text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='last_message_by') THEN
    ALTER TABLE public.leads ADD COLUMN last_message_by text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='sla_breach_count') THEN
    ALTER TABLE public.leads ADD COLUMN sla_breach_count int DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='converted_patient_id') THEN
    ALTER TABLE public.leads ADD COLUMN converted_patient_id uuid REFERENCES public.customers(id);
  END IF;
END $$;

-- 4. CHAT_MESSAGES: Session & JSON
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_messages' AND column_name='session_id') THEN
    ALTER TABLE public.chat_messages ADD COLUMN session_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_messages' AND column_name='message') THEN
    ALTER TABLE public.chat_messages ADD COLUMN message jsonb DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_messages' AND column_name='patient_id') THEN
    ALTER TABLE public.chat_messages ADD COLUMN patient_id uuid REFERENCES public.customers(id);
  END IF;
END $$;

-- 5. PRODUCTS: Inventory metadata
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='sku') THEN
    ALTER TABLE public.products ADD COLUMN sku text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='current_stock') THEN
    ALTER TABLE public.products ADD COLUMN current_stock numeric DEFAULT 0;
    ALTER TABLE public.products ADD COLUMN min_stock numeric DEFAULT 0;
  END IF;
END $$;

-- 6. NEW TABLES: Inventory, Automation, Appointments
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('in', 'out')),
  quantity numeric NOT NULL,
  reason text NOT NULL CHECK (reason IN ('purchase', 'sale', 'adjustment', 'production_usage', 'return')),
  reference_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.automation_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('followup', 'handoff', 'sla_breach')),
  status text NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  date date NOT NULL,
  time time NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'realizado', 'cancelado', 'faltou')),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ia')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. SECURITY (RLS)
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='inventory_all') THEN
    CREATE POLICY "inventory_all" ON public.inventory_movements FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='automation_all') THEN
    CREATE POLICY "automation_all" ON public.automation_logs FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='appointments_all') THEN
    CREATE POLICY "appointments_all" ON public.appointments FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));
  END IF;
END $$;

-- 8. TRIGGERS: Inventory and Tracking

-- Update Stock Function
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'in' THEN
      UPDATE public.products SET current_stock = current_stock + NEW.quantity WHERE id = NEW.product_id;
    ELSE
      UPDATE public.products SET current_stock = current_stock - NEW.quantity WHERE id = NEW.product_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_product_stock ON public.inventory_movements;
CREATE TRIGGER tr_update_product_stock
AFTER INSERT ON public.inventory_movements
FOR EACH ROW EXECUTE FUNCTION update_product_stock();

-- Lead Timestamp Function
CREATE OR REPLACE FUNCTION update_lead_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.direction = 'inbound' THEN
    UPDATE public.leads SET 
      last_message_at = NEW.created_at,
      last_message_preview = substring(NEW.content from 1 for 100),
      last_message_by = 'cliente',
      updated_at = now()
    WHERE id = NEW.lead_id;
  ELSE
    UPDATE public.leads SET 
      last_outbound_at = NEW.created_at,
      last_message_preview = substring(NEW.content from 1 for 100),
      last_message_by = NEW.sender,
      updated_at = now()
    WHERE id = NEW.lead_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_lead_timestamps ON public.chat_messages;
CREATE TRIGGER tr_update_lead_timestamps
AFTER INSERT ON public.chat_messages
FOR EACH ROW WHEN (NEW.lead_id IS NOT NULL) EXECUTE FUNCTION update_lead_timestamps();
