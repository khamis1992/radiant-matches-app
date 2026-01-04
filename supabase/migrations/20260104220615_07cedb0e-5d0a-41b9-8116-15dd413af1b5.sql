-- Decrement product inventory when a product order is created

CREATE OR REPLACE FUNCTION public.decrement_product_inventory_on_order()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  item jsonb;
  v_product_id uuid;
  v_qty int;
  v_inventory int;
BEGIN
  -- Expect NEW.items to be a JSON array of { product_id, quantity, ... }
  FOR item IN
    SELECT * FROM jsonb_array_elements(COALESCE(NEW.items::jsonb, '[]'::jsonb))
  LOOP
    v_product_id := NULLIF(item->>'product_id', '')::uuid;
    v_qty := COALESCE(NULLIF(item->>'quantity', '')::int, 0);

    IF v_product_id IS NULL OR v_qty <= 0 THEN
      CONTINUE;
    END IF;

    -- Lock the product row for consistent inventory updates
    SELECT p.inventory_count::int
    INTO v_inventory
    FROM public.products p
    WHERE p.id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: %', v_product_id USING ERRCODE = 'P0001';
    END IF;

    -- If inventory_count is NULL, treat as untracked/unlimited stock
    IF v_inventory IS NULL THEN
      CONTINUE;
    END IF;

    IF v_inventory < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for product % (have %, need %)', v_product_id, v_inventory, v_qty
        USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.products
    SET inventory_count = v_inventory - v_qty,
        updated_at = now()
    WHERE id = v_product_id;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_orders_decrement_inventory ON public.product_orders;

CREATE TRIGGER trg_product_orders_decrement_inventory
BEFORE INSERT ON public.product_orders
FOR EACH ROW
EXECUTE FUNCTION public.decrement_product_inventory_on_order();
