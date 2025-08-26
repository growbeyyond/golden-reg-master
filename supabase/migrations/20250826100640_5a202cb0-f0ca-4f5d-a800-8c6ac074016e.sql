-- SECURITY FIX: Implement comprehensive security improvements

-- Fix razorpay_orders RLS policies (remove access for authenticated users)
DROP POLICY IF EXISTS "Razorpay orders are viewable by authenticated users" ON razorpay_orders;

-- Only service role can manage razorpay_orders 
CREATE POLICY "Service role can manage razorpay orders" ON razorpay_orders
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Fix tickets RLS policies (remove overly permissive policies)
DROP POLICY IF EXISTS "Service can insert tickets" ON tickets;
DROP POLICY IF EXISTS "Service can update tickets" ON tickets;

-- Only service role can insert/update tickets
CREATE POLICY "Service role can insert tickets" ON tickets
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update tickets" ON tickets
  FOR UPDATE 
  USING (auth.role() = 'service_role');

-- Create minimal roles system for staff operations
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS issues)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles (admins can manage, users can view their own)
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT 
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" ON user_roles
  FOR INSERT 
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" ON user_roles
  FOR UPDATE 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON user_roles
  FOR DELETE 
  USING (public.has_role(auth.uid(), 'admin'));