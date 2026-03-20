-- Add stock columns to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sku text,
ADD COLUMN IF NOT EXISTS current_stock numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stock numeric DEFAULT 0;

-- Create inventory movements table
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('in', 'out')),
  quantity numeric NOT NULL,
  reason text NOT NULL CHECK (reason IN ('purchase', 'sale', 'adjustment', 'production_usage', 'return')),
  reference_id uuid, -- Link to quote_id or production_order_id
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "inventory_movements_all" ON public.inventory_movements 
FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));

-- Create trigger to update current_stock in products when a movement is recorded
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'in' THEN
    UPDATE public.products 
    SET current_stock = current_stock + NEW.quantity 
    WHERE id = NEW.product_id;
  ELSIF NEW.type = 'out' THEN
    UPDATE public.products 
    SET current_stock = current_stock - NEW.quantity 
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_product_stock
AFTER INSERT ON public.inventory_movements
FOR EACH ROW EXECUTE FUNCTION update_product_stock();
