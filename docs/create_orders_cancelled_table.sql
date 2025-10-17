-- Tạo bảng orders_cancelled để lưu thông tin hủy đơn hàng
CREATE TABLE IF NOT EXISTS orders_cancelled (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    order_number TEXT NOT NULL,
    cancellation_reason TEXT NOT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_by TEXT NOT NULL DEFAULT 'user',
    original_status TEXT NOT NULL,
    refund_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo index để tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_orders_cancelled_user_id ON orders_cancelled(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_cancelled_order_id ON orders_cancelled(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_cancelled_cancelled_at ON orders_cancelled(cancelled_at);

-- Tạo RLS policy (nếu cần)
ALTER TABLE orders_cancelled ENABLE ROW LEVEL SECURITY;

-- Policy cho phép user chỉ xem đơn hàng hủy của chính họ
CREATE POLICY "Users can view their own cancelled orders" ON orders_cancelled
    FOR SELECT USING (user_id = auth.uid()::text);

-- Policy cho phép user tạo record hủy đơn hàng của chính họ
CREATE POLICY "Users can create their own cancelled orders" ON orders_cancelled
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Comment cho bảng
COMMENT ON TABLE orders_cancelled IS 'Bảng lưu thông tin chi tiết về việc hủy đơn hàng';
COMMENT ON COLUMN orders_cancelled.order_id IS 'ID của đơn hàng bị hủy';
COMMENT ON COLUMN orders_cancelled.user_id IS 'ID của người dùng hủy đơn hàng';
COMMENT ON COLUMN orders_cancelled.order_number IS 'Số đơn hàng';
COMMENT ON COLUMN orders_cancelled.cancellation_reason IS 'Lý do hủy đơn hàng';
COMMENT ON COLUMN orders_cancelled.cancelled_at IS 'Thời gian hủy đơn hàng';
COMMENT ON COLUMN orders_cancelled.cancelled_by IS 'Người hủy (user/admin/system)';
COMMENT ON COLUMN orders_cancelled.original_status IS 'Trạng thái gốc của đơn hàng trước khi hủy';
COMMENT ON COLUMN orders_cancelled.refund_required IS 'Có cần hoàn tiền hay không';
