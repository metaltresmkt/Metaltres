-- Function to handle automated business flows when a quote status changes
CREATE OR REPLACE FUNCTION public.handle_quote_status_change()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- 1. When a quote is marked as 'aprovado'
    IF (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'aprovado') THEN
        
        -- A. Create Production Order (if not already existing)
        INSERT INTO public.production_orders (clinic_id, quote_id, status, priority)
        VALUES (NEW.clinic_id, NEW.id, 'aguardando', 'normal')
        ON CONFLICT (quote_id) DO NOTHING;

        -- B. Create Financial Transaction (Pending Revenue)
        INSERT INTO public.financial_transactions (clinic_id, quote_id, customer_id, type, category, amount, status, description)
        VALUES (NEW.clinic_id, NEW.id, NEW.customer_id, 'receita', 'Venda', NEW.total_amount, 'pendente', 'Referente ao Orçamento #' || substring(NEW.id::text, 1, 8))
        ON CONFLICT DO NOTHING;

        -- C. Deduct Inventory Items
        FOR item IN SELECT * FROM public.quote_items WHERE quote_id = NEW.id LOOP
            INSERT INTO public.inventory_movements (clinic_id, product_id, type, quantity, reason, reference_id, notes)
            VALUES (NEW.clinic_id, item.product_id, 'out', item.quantity, 'sale', NEW.id, 'Pela aprovação do Orçamento #' || substring(NEW.id::text, 1, 8));
        END LOOP;

    -- 2. When an approved quote is cancelled or reverted (Optional, but good for consistency)
    ELSIF (OLD.status = 'aprovado' AND NEW.status IN ('cancelado', 'rascunho', 'rejeitado')) THEN
        -- A. Delete Production Order (only if not already in advanced stages)
        DELETE FROM public.production_orders 
        WHERE quote_id = NEW.id AND status = 'aguardando';

        -- B. Cancel Financial Transaction
        UPDATE public.financial_transactions 
        SET status = 'cancelado' 
        WHERE quote_id = NEW.id AND status = 'pendente';

        -- C. Reverse Inventory (if previously deducted)
        FOR item IN SELECT * FROM public.quote_items WHERE quote_id = NEW.id LOOP
            INSERT INTO public.inventory_movements (clinic_id, product_id, type, quantity, reason, reference_id, notes)
            VALUES (NEW.clinic_id, item.product_id, 'in', item.quantity, 'adjustment', NEW.id, 'Estorno por cancelamento/reversão do Orçamento #' || substring(NEW.id::text, 1, 8));
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for quote status changes
DROP TRIGGER IF EXISTS tr_on_quote_status_change ON public.quotes;
CREATE TRIGGER tr_on_quote_status_change
AFTER UPDATE OF status ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.handle_quote_status_change();
