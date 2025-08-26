-- Fix RLS policies for orders table to allow edge function access
-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;

-- Create new policies that allow service role and guest access
CREATE POLICY "Service role can manage all orders" ON orders
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert orders" ON orders
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own orders" ON orders
  FOR UPDATE 
  USING (auth.uid() = user_id OR user_id IS NULL);