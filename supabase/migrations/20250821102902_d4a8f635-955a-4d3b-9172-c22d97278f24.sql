
-- Allow guest orders by making user_id nullable
ALTER TABLE public.orders
ALTER COLUMN user_id DROP NOT NULL;

-- Optional: ensure updated_at auto-updates on updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_orders_updated_at'
  ) THEN
    CREATE TRIGGER set_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
