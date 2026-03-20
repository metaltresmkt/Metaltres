-- ============================================
-- SCHEMA METALTRES — SISTEMA PARA LOJA DE TELAS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CORE
CREATE TABLE public.clinics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  cnpj text,
  phone text,
  address text,
  logo_url text,
  primary_color text DEFAULT '#0d9488',
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('gestor', 'vendedor', 'producao')),
  full_name text NOT NULL,
  email text NOT NULL,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. NEGÓCIO
CREATE TABLE public.sellers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('atendendo', 'pausa', 'offline')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  cpf_cnpj text,
  address text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.funnel_stages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  position int NOT NULL DEFAULT 0,
  color text DEFAULT 'bg-slate-500',
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  source text DEFAULT 'manual',
  stage_id uuid REFERENCES public.funnel_stages(id) ON DELETE SET NULL,
  estimated_value numeric DEFAULT 0,
  notes text,
  converted_customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. PRODUTOS E ORÇAMENTOS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  unit_price numeric NOT NULL DEFAULT 0,
  unit_type text DEFAULT 'm2' CHECK (unit_type IN ('m2', 'linear', 'unit')),
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES public.sellers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'cancelado', 'em_producao')),
  total_amount numeric DEFAULT 0,
  notes text,
  valid_until date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.quote_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  width numeric,
  height numeric,
  quantity int NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  subtotal numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. PRODUÇÃO E FINANCEIRO
CREATE TABLE public.production_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  quote_id uuid UNIQUE REFERENCES public.quotes(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'corte', 'montagem', 'qualidade', 'pronto', 'entregue')),
  priority text DEFAULT 'normal' CHECK (priority IN ('baixa', 'normal', 'urgente')),
  start_date date,
  delivery_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.financial_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('receita', 'despesa')),
  category text,
  amount numeric NOT NULL DEFAULT 0,
  description text,
  payment_method text CHECK (payment_method IN ('pix', 'cartao', 'dinheiro')),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente', 'cancelado')),
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. INTEGRAÇÕES
CREATE TABLE public.whatsapp_instances (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL UNIQUE REFERENCES public.clinics(id) ON DELETE CASCADE,
  api_url text NOT NULL,
  api_token text NOT NULL,
  phone_number text,
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'qr_pending')),
  connected_at timestamptz
);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender text NOT NULL DEFAULT 'system' CHECK (sender IN ('user', 'ai', 'system')),
  content text NOT NULL,
  phone text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_config (
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
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinics_select" ON public.clinics FOR SELECT USING (id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "users_all" ON public.users FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "sellers_all" ON public.sellers FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "customers_all" ON public.customers FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "leads_all" ON public.leads FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "funnel_stages_all" ON public.funnel_stages FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "products_all" ON public.products FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "quotes_all" ON public.quotes FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "quote_items_all" ON public.quote_items FOR ALL USING (quote_id IN (SELECT id FROM public.quotes WHERE clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid())));
CREATE POLICY "production_orders_all" ON public.production_orders FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "financial_all" ON public.financial_transactions FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()) AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'gestor'));
CREATE POLICY "whatsapp_all" ON public.whatsapp_instances FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "chat_messages_all" ON public.chat_messages FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "ai_config_all" ON public.ai_config FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));
