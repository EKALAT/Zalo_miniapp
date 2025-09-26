-- =====================================================
-- Zalo Mini App Order Management Database Schema
-- =====================================================
-- This file contains all SQL commands to set up the complete database
-- Run this in your Supabase SQL Editor or PostgreSQL database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

-- Order status enum
CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'processing', 
  'shipped', 'delivered', 'cancelled', 'refunded'
);

-- Payment method enum
CREATE TYPE payment_method AS ENUM (
  'zalo_pay', 'cod', 'bank_transfer'
);

-- Payment status enum
CREATE TYPE payment_status AS ENUM (
  'pending', 'paid', 'failed', 'refunded'
);

-- Discount type enum
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_amount');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Orders table (Đơn hàng chính)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id),
  order_number VARCHAR(20) UNIQUE NOT NULL, -- Mã đơn hàng
  status order_status DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_fee DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  
  -- Thông tin giao hàng
  shipping_name TEXT NOT NULL,
  shipping_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_note TEXT,
  
  -- Thanh toán
  payment_method payment_method DEFAULT 'zalo_pay',
  payment_status payment_status DEFAULT 'pending',
  zalo_transaction_id TEXT, -- ID giao dịch từ Zalo Pay
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Order items table (Chi tiết đơn hàng)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL, -- Reference đến products từ mock data
  product_name TEXT NOT NULL, -- Snapshot tên sản phẩm
  product_image TEXT NOT NULL, -- Snapshot ảnh sản phẩm
  product_price DECIMAL(10,2) NOT NULL, -- Snapshot giá tại thời điểm đặt
  
  -- Variants đã chọn
  selected_size TEXT,
  selected_color TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  
  subtotal DECIMAL(10,2) NOT NULL, -- product_price * quantity
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order status history table (Lịch sử trạng thái)
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT -- Admin/system/user
);

-- Shipping tracking table (Theo dõi vận chuyển)
CREATE TABLE shipping_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  tracking_number TEXT,
  carrier TEXT, -- ViettelPost, GiaoHangNhanh, etc.
  status TEXT,
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  actual_delivery TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart items table (Giỏ hàng persistent)
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id),
  product_id INTEGER NOT NULL,
  selected_size TEXT,
  selected_color TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, product_id, selected_size, selected_color)
);

-- =====================================================
-- ADVANCED FEATURES TABLES
-- =====================================================

-- Product inventory table
CREATE TABLE product_inventory (
  product_id INTEGER PRIMARY KEY,
  stock_quantity INTEGER DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discounts table
CREATE TABLE discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE,
  type discount_type, -- 'percentage', 'fixed_amount'
  value DECIMAL(10,2),
  min_order_amount DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Orders indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Order status history indexes
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_status ON order_status_history(status);

-- Shipping tracking indexes
CREATE INDEX idx_shipping_tracking_order_id ON shipping_tracking(order_id);
CREATE INDEX idx_shipping_tracking_tracking_number ON shipping_tracking(tracking_number);

-- Cart items indexes
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- Product inventory indexes
CREATE INDEX idx_product_inventory_stock ON product_inventory(stock_quantity);
CREATE INDEX idx_product_inventory_low_stock ON product_inventory(low_stock_threshold);

-- Discounts indexes
CREATE INDEX idx_discounts_code ON discounts(code);
CREATE INDEX idx_discounts_active ON discounts(is_active);
CREATE INDEX idx_discounts_valid_period ON discounts(valid_from, valid_until);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to check product stock
CREATE OR REPLACE FUNCTION check_product_stock(
  p_product_id INTEGER,
  p_quantity INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (stock_quantity - reserved_quantity) >= p_quantity
    FROM product_inventory
    WHERE product_id = p_product_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to apply discount
CREATE OR REPLACE FUNCTION apply_discount(
  p_code VARCHAR(20),
  p_order_amount DECIMAL(10,2)
) RETURNS DECIMAL(10,2) AS $$
DECLARE
  discount_value DECIMAL(10,2) := 0;
BEGIN
  SELECT 
    CASE 
      WHEN type = 'percentage' THEN LEAST(p_order_amount * value / 100, max_discount_amount)
      ELSE LEAST(value, max_discount_amount)
    END
  INTO discount_value
  FROM discounts
  WHERE code = p_code
    AND is_active = true
    AND valid_from <= NOW()
    AND valid_until >= NOW()
    AND p_order_amount >= min_order_amount
    AND (usage_limit IS NULL OR used_count < usage_limit);
    
  RETURN COALESCE(discount_value, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(20) AS $$
DECLARE
  order_num VARCHAR(20);
  counter INTEGER;
BEGIN
  -- Get current date in YYYYMMDD format
  SELECT COUNT(*) + 1 INTO counter
  FROM orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Generate order number: ORD + YYYYMMDD + 4-digit counter
  order_num := 'ORD' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(counter::TEXT, 4, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Function to update order status with history
CREATE OR REPLACE FUNCTION update_order_status(
  p_order_id UUID,
  p_new_status order_status,
  p_note TEXT DEFAULT NULL,
  p_created_by TEXT DEFAULT 'system'
) RETURNS VOID AS $$
BEGIN
  -- Update order status
  UPDATE orders 
  SET status = p_new_status, updated_at = NOW()
  WHERE id = p_order_id;
  
  -- Add to history
  INSERT INTO order_status_history (order_id, status, note, created_by)
  VALUES (p_order_id, p_new_status, p_note, p_created_by);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate order totals
CREATE OR REPLACE FUNCTION calculate_order_totals(p_order_id UUID)
RETURNS TABLE(
  total_amount DECIMAL(10,2),
  item_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(subtotal) as total_amount,
    SUM(quantity) as item_count
  FROM order_items
  WHERE order_id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update order updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to orders table
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to cart_items table
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to product_inventory table
CREATE TRIGGER update_product_inventory_updated_at
  BEFORE UPDATE ON product_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- Daily order analytics view
CREATE VIEW order_analytics_daily AS
SELECT 
  DATE(created_at) as order_date,
  COUNT(*) as total_orders,
  SUM(final_amount) as total_revenue,
  AVG(final_amount) as avg_order_value,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
FROM orders 
WHERE status != 'cancelled'
GROUP BY DATE(created_at)
ORDER BY order_date DESC;

-- Product sales analytics view
CREATE VIEW product_sales_analytics AS
SELECT 
  oi.product_id,
  oi.product_name,
  SUM(oi.quantity) as total_sold,
  SUM(oi.subtotal) as total_revenue,
  COUNT(DISTINCT oi.order_id) as order_count,
  AVG(oi.quantity) as avg_quantity_per_order
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.status != 'cancelled'
GROUP BY oi.product_id, oi.product_name
ORDER BY total_revenue DESC;

-- User order summary view
CREATE VIEW user_order_summary AS
SELECT 
  user_id,
  COUNT(*) as total_orders,
  SUM(final_amount) as total_spent,
  AVG(final_amount) as avg_order_value,
  MAX(created_at) as last_order_date,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders
FROM orders
GROUP BY user_id;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own pending orders" ON orders
  FOR UPDATE USING (auth.uid()::text = user_id AND status = 'pending');

-- Order items policies
CREATE POLICY "Users can view order items of their orders" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create order items for their orders" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()::text
    )
  );

-- Order status history policies
CREATE POLICY "Users can view status history of their orders" ON order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_status_history.order_id 
      AND orders.user_id = auth.uid()::text
    )
  );

-- Shipping tracking policies
CREATE POLICY "Users can view tracking of their orders" ON shipping_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = shipping_tracking.order_id 
      AND orders.user_id = auth.uid()::text
    )
  );

-- Cart items policies
CREATE POLICY "Users can manage their own cart items" ON cart_items
  FOR ALL USING (auth.uid()::text = user_id);

-- Product inventory policies (read-only for users)
CREATE POLICY "Users can view product inventory" ON product_inventory
  FOR SELECT USING (true);

-- Discounts policies (read-only for users)
CREATE POLICY "Users can view active discounts" ON discounts
  FOR SELECT USING (is_active = true);

-- =====================================================
-- SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Insert sample discounts
INSERT INTO discounts (code, type, value, min_order_amount, max_discount_amount, usage_limit, valid_from, valid_until, is_active) VALUES
('WELCOME10', 'percentage', 10, 100000, 50000, 100, NOW(), NOW() + INTERVAL '1 year', true),
('SAVE50K', 'fixed_amount', 50000, 200000, 50000, 50, NOW(), NOW() + INTERVAL '6 months', true),
('NEWUSER', 'percentage', 15, 50000, 100000, 200, NOW(), NOW() + INTERVAL '3 months', true);

-- Insert sample product inventory
INSERT INTO product_inventory (product_id, stock_quantity, reserved_quantity, low_stock_threshold) VALUES
(1, 100, 0, 10),
(2, 150, 0, 15),
(3, 80, 0, 8),
(4, 120, 0, 12),
(5, 90, 0, 9),
(6, 200, 0, 20),
(7, 110, 0, 11),
(8, 180, 0, 18),
(9, 70, 0, 7),
(10, 130, 0, 13);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- Display completion message
DO $$
BEGIN
  RAISE NOTICE 'Database schema setup completed successfully!';
  RAISE NOTICE 'Tables created: orders, order_items, order_status_history, shipping_tracking, cart_items, product_inventory, discounts';
  RAISE NOTICE 'Functions created: check_product_stock, apply_discount, generate_order_number, update_order_status, calculate_order_totals';
  RAISE NOTICE 'Views created: order_analytics_daily, product_sales_analytics, user_order_summary';
  RAISE NOTICE 'RLS policies enabled for all tables';
  RAISE NOTICE 'Sample data inserted for discounts and product inventory';
END $$;
