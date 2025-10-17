# Debug: Không lưu được vào order_cancel_simple

## Cấu trúc bảng order_cancel_simple (từ hình ảnh)
- `id` (uuid) - Auto generated
- `user_name` (text)
- `order_number` (text)
- `reason` (text)
- `created_at` (timestamptz) - Auto generated

## Cách debug

### 1. Mở Developer Tools
- F12 > Console tab

### 2. Thực hiện hủy đơn hàng
1. Vào "Theo dõi đơn hàng"
2. Tìm đơn hàng có nút "Gửi yêu cầu hủy"
3. Nhấn nút → Modal hiện ra
4. Nhập lý do hủy (ít nhất 10 ký tự)
5. Nhấn "Gửi yêu cầu hủy"

### 3. Kiểm tra Console Logs
Tìm log này:
```
💾 Saving to order_cancel_simple with data: {
  user_name: "Tên người dùng",
  order_number: "ORD1234567890", 
  reason: "Lý do hủy"
}
```

### 4. Kiểm tra kết quả
- Nếu thành công: `✅ Cancellation details saved successfully: [data]`
- Nếu lỗi: `❌ Failed to save cancellation details: [error]`

### 5. Kiểm tra Database
Chạy query:
```sql
SELECT * FROM order_cancel_simple ORDER BY created_at DESC LIMIT 5;
```

### 6. Các lỗi có thể gặp

#### Lỗi RLS (Row Level Security)
```
Error: new row violates row-level security policy
```
**Giải pháp:** Tắt RLS hoặc tạo policy cho bảng `order_cancel_simple`

#### Lỗi Permission
```
Error: permission denied for table order_cancel_simple
```
**Giải pháp:** Kiểm tra quyền truy cập bảng

#### Lỗi Column không tồn tại
```
Error: column "_id" does not exist
```
**Giải pháp:** Đã sửa rồi, không dùng `_id` nữa

### 7. Test trực tiếp với Supabase
Thử insert trực tiếp:
```sql
INSERT INTO order_cancel_simple (user_name, order_number, reason) 
VALUES ('Test User', 'ORD1234567890', 'Test reason');
```

### 8. Kiểm tra RLS Policy
```sql
-- Kiểm tra RLS có bật không
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'order_cancel_simple';

-- Tắt RLS nếu cần
ALTER TABLE order_cancel_simple DISABLE ROW LEVEL SECURITY;
```
