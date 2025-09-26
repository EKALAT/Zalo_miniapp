-- =====================================================
-- Fix Foreign Key Constraint for Orders
-- =====================================================
-- This file fixes the foreign key constraint issue
-- by either removing the constraint or creating a default user

-- =====================================================
-- OPTION 1: REMOVE FOREIGN KEY CONSTRAINT (RECOMMENDED)
-- =====================================================

-- Drop the foreign key constraint on orders table
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- Drop the foreign key constraint on cart_items table  
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_fkey;

-- =====================================================
-- OPTION 2: CREATE DEFAULT USER (ALTERNATIVE)
-- =====================================================

-- Uncomment the section below if you prefer to keep foreign key constraints
-- and create a default user instead

/*
-- Insert a default user for anonymous orders
INSERT INTO users (id, name, avatar, phone, updated_at) 
VALUES (
  'temp_user', 
  'Khách hàng', 
  null, 
  null, 
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert more default users if needed
INSERT INTO users (id, name, avatar, phone, updated_at) 
VALUES (
  'anonymous_user', 
  'Người dùng ẩn danh', 
  null, 
  null, 
  NOW()
) ON CONFLICT (id) DO NOTHING;
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check foreign key constraints
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('orders', 'cart_items', 'order_items', 'order_status_history', 'shipping_tracking')
ORDER BY tc.table_name, tc.constraint_name;

-- Check if users table has any data
SELECT COUNT(*) as user_count FROM users;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Foreign key constraints updated successfully!';
  RAISE NOTICE 'Orders can now be created with any user_id value.';
  RAISE NOTICE 'Run the verification queries above to confirm changes.';
END $$;
