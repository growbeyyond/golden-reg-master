-- Create Razorpay orders table for tracking Razorpay payment orders
CREATE TABLE IF NOT EXISTS public.razorpay_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  manual_order_id UUID NOT NULL REFERENCES public.orders(id),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.razorpay_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for razorpay_orders
CREATE POLICY "Razorpay orders are viewable by authenticated users" 
ON public.razorpay_orders 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage razorpay orders" 
ON public.razorpay_orders 
FOR ALL 
USING (auth.role() = 'service_role');

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_razorpay_orders_updated_at
BEFORE UPDATE ON public.razorpay_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();