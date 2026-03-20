-- Fix Leads table
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'client_id') THEN
    ALTER TABLE public.leads RENAME COLUMN client_id TO clinic_id;
  END IF;
END $$;

-- 5. INTEGRAÇÕES
CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL UNIQUE REFERENCES public.clinics(id) ON DELETE CASCADE,
  api_url text NOT NULL,
  api_token text NOT NULL,
  phone_number text,
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'qr_pending')),
  connected_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  role text NOT NULL DEFAULT 'assistant' CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  phone text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_config (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL UNIQUE REFERENCES public.clinics(id) ON DELETE CASCADE,
  tone int NOT NULL DEFAULT 70 CHECK (tone >= 0 AND tone <= 100),
  response_style text NOT NULL DEFAULT 'cordial' CHECK (response_style IN ('tecnica', 'objetiva', 'cordial')),
  response_speed text NOT NULL DEFAULT 'instantanea' CHECK (response_speed IN ('instantanea', 'cadenciada')),
  bio_text text DEFAULT 'Olá! Sou a assistente IA da Metaltres. Estou aqui para ajudá-lo com orçamentos de telas e dúvidas gerais.',
  auto_schedule boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. SECURITY (RLS)
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

-- Clean existing policies to avoid conflicts
DROP POLICY IF EXISTS "whatsapp_all" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "chat_messages_all" ON public.chat_messages;
DROP POLICY IF EXISTS "ai_config_all" ON public.ai_config;
DROP POLICY IF EXISTS "leads_all" ON public.leads;

-- Recreate policies
CREATE POLICY "leads_all" ON public.leads FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "whatsapp_all" ON public.whatsapp_instances FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "chat_messages_all" ON public.chat_messages FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "ai_config_all" ON public.ai_config FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));
