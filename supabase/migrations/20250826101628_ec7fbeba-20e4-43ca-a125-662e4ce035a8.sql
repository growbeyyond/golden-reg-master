-- Fix RLS policies for razorpay_orders table - restrict access properly
DROP POLICY IF EXISTS "Razorpay orders are viewable by authenticated users" ON public.razorpay_orders;
DROP POLICY IF EXISTS "Service role can manage razorpay orders" ON public.razorpay_orders;

-- Only service role can access razorpay_orders (contains sensitive payment data)
CREATE POLICY "Service role can manage all razorpay orders" 
ON public.razorpay_orders 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- Add audit logging trigger for orders table
CREATE OR REPLACE FUNCTION public.audit_orders_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.audit_logs (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        user_id,
        timestamp
      ) VALUES (
        'orders',
        NEW.id,
        'status_change',
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status),
        auth.uid(),
        now()
      );
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit_logs table for tracking critical changes
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  user_id uuid,
  timestamp timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role'::text);

-- Create trigger for orders audit logging
DROP TRIGGER IF EXISTS audit_orders_trigger ON public.orders;
CREATE TRIGGER audit_orders_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_orders_changes();