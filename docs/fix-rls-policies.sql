-- =====================================================
-- Fix RLS Policies for Order Creation
-- =====================================================
-- This file fixes the Row Level Security policies to allow order creation
-- without requiring Supabase Auth authentication

-- =====================================================
-- DISABLE RLS FOR DEVELOPMENT (RECOMMENDED)
-- =====================================================

-- Disable RLS on orders table
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Disable RLS on order_items table
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Disable RLS on order_status_history table
ALTER TABLE order_status_history DISABLE ROW LEVEL SECURITY;

-- Disable RLS on shipping_tracking table
ALTER TABLE shipping_tracking DISABLE ROW LEVEL SECURITY;

-- Disable RLS on cart_items table
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- ALTERNATIVE: UPDATE POLICIES TO ALLOW ANON ACCESS
-- =====================================================

-- Uncomment the section below if you prefer to keep RLS enabled
-- but allow anonymous users to create orders

/*
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own pending orders" ON orders;

DROP POLICY IF EXISTS "Users can view order items of their orders" ON order_items;
DROP POLICY IF EXISTS "Users can create order items for their orders" ON order_items;

DROP POLICY IF EXISTS "Users can view status history of their orders" ON order_status_history;

DROP POLICY IF EXISTS "Users can view tracking of their orders" ON shipping_tracking;

DROP POLICY IF EXISTS "Users can manage their own cart items" ON cart_items;

-- Create new policies that allow anon access
CREATE POLICY "Allow anon to create orders" ON orders
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to view orders" ON orders
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Allow anon to update pending orders" ON orders
  FOR UPDATE TO anon
  USING (status = 'pending');

CREATE POLICY "Allow anon to create order items" ON order_items
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to view order items" ON order_items
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Allow anon to create order status history" ON order_status_history
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to view order status history" ON order_status_history
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Allow anon to create shipping tracking" ON shipping_tracking
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to view shipping tracking" ON shipping_tracking
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Allow anon to manage cart items" ON cart_items
  FOR ALL TO anon
  USING (true);
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('orders', 'order_items', 'order_status_history', 'shipping_tracking', 'cart_items')
ORDER BY tablename;

-- Check existing policies (if RLS is still enabled)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items', 'order_status_history', 'shipping_tracking', 'cart_items')
ORDER BY tablename, policyname;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'RLS policies updated successfully!';
  RAISE NOTICE 'Orders can now be created without authentication.';
  RAISE NOTICE 'Run the verification queries above to confirm changes.';
END $$;
