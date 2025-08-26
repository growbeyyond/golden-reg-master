-- SECURITY FIX: Remove anonymous access to customer personal information
-- Drop the insecure policies that expose customer data
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert orders" ON orders; 
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;

-- Create secure policies that protect customer data
-- Only authenticated users can view their own orders
CREATE POLICY "Users can view their own orders only" ON orders
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Only service role can insert orders (for payment processing)
CREATE POLICY "Service role can insert orders" ON orders
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

-- Only authenticated users can update their own orders
CREATE POLICY "Users can update their own orders only" ON orders
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Keep the existing service role policy for backend operations
-- (This policy already exists and allows full access for edge functions)