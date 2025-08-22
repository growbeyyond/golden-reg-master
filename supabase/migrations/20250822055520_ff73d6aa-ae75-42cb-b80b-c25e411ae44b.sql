-- Drop Razorpay specific columns from orders table
ALTER TABLE public.orders DROP COLUMN IF EXISTS razorpay_order_id;
ALTER TABLE public.orders DROP COLUMN IF EXISTS razorpay_payment_id;

-- Add new columns for manual payment system
ALTER TABLE public.orders 
ADD COLUMN payment_method TEXT DEFAULT 'upi',
ADD COLUMN payment_proof_url TEXT,
ADD COLUMN ticket_qr_code TEXT,
ADD COLUMN check_in_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_checked_in BOOLEAN DEFAULT false;

-- Update status enum to include new statuses
ALTER TABLE public.orders 
ALTER COLUMN status SET DEFAULT 'pending_payment';

-- Create tickets table for QR code management
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  qr_code TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tickets table
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for tickets table
CREATE POLICY "Users can view their own tickets" 
ON public.tickets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = tickets.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Service can insert tickets" 
ON public.tickets 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service can update tickets" 
ON public.tickets 
FOR UPDATE 
USING (true);

-- Create trigger for ticket updated_at
CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();