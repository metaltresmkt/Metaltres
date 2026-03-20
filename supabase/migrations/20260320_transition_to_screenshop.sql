-- Refactor Medical System to Screen Shop System

-- 1. Rename Clinics to Shops (Internal name remains clinics for SaaS compatibility if needed, but let's rename for clarity if the user wants a full transition)
-- However, to avoid breaking everything at once, I'll create ALIASES or new tables if necessary.
-- The user said "vamos trocar por esse repositorio", implying a fresh start or full pivot.

-- Let's rename for a cleaner "Loja de Telas" context.
ALTER TABLE IF EXISTS public.patients RENAME TO customers;
ALTER TABLE IF EXISTS public.doctors RENAME TO sellers;

-- 2. Add Screen Shop specific tables
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  unit_price numeric NOT NULL DEFAULT 0,
  unit_type text DEFAULT 'm2' CHECK (unit_type IN ('m2', 'linear', 'unit')),
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quotes (
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

CREATE TABLE IF NOT EXISTS public.quote_items (
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

CREATE TABLE IF NOT EXISTS public.production_orders (
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

-- RLS for new tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_all" ON public.products FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "quotes_all" ON public.quotes FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "quote_items_all" ON public.quote_items FOR ALL USING (quote_id IN (SELECT id FROM public.quotes WHERE clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid())));
CREATE POLICY "production_orders_all" ON public.production_orders FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));

-- Update AI Prompts
UPDATE public.ai_config SET bio_text = 'Olá! Sou a assistente IA da Metaltres. Estou aqui para ajudá-lo com orçamentos de telas, dúvidas sobre produtos e acompanhamento de pedidos.';
