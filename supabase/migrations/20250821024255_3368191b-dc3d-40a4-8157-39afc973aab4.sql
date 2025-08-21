-- Fix security vulnerability: Remove ability to view orders with NULL user_id
-- This prevents users from accessing anonymous orders containing sensitive payment data

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

-- Create a more secure policy that only allows users to view their own orders
CREATE POLICY "Users can view their own orders" ON public.orders
FOR SELECT 
USING (auth.uid() = user_id);

-- Also ensure that orders must have a valid user_id by updating the column to be NOT NULL
-- First, let's check if there are any existing NULL user_id records
DO $$
BEGIN
  -- Count orders with NULL user_id
  IF (SELECT COUNT(*) FROM public.orders WHERE user_id IS NULL) > 0 THEN
    RAISE NOTICE 'Found % orders with NULL user_id that need to be addressed', 
                 (SELECT COUNT(*) FROM public.orders WHERE user_id IS NULL);
  END IF;
END $$;

-- For future orders, we should ensure user_id is always set
-- But we won't make it NOT NULL yet in case there are existing NULL records