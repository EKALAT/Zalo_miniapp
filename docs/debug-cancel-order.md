# Debug: Tính năng hủy đơn hàng

## Vấn đề hiện tại
- Bảng `order_cancel_simple` đã có sẵn
- Chưa có thông báo hủy đơn thành công

## Các bước debug

### 1. Kiểm tra Console Logs
Mở Developer Tools (F12) và kiểm tra Console khi thực hiện hủy đơn hàng:

```javascript
// Các log cần tìm:
✅ Order cancelled successfully: [data]
✅ Cancellation history added successfully: [data]
✅ Cancellation details saved successfully: [data]
// hoặc
❌ Failed to save cancellation details: [error]
```

### 2. Kiểm tra Network Tab
Trong Developer Tools > Network, kiểm tra các request đến Supabase:
- `orders` table update
- `order_status_history` table insert
- `order_cancel_simple` table insert

### 3. Kiểm tra Snackbar
Thông báo success sẽ hiển thị:
```
✅ Đã gửi yêu cầu hủy đơn hàng thành công! Thông tin đã được lưu vào hệ thống.
```

### 4. Test với bảng order_cancel_simple
Code hiện tại sẽ thử insert với các field:
- `order_id`
- `user_id` 
- `order_number`

Nếu fail, sẽ thử với chỉ:
- `order_id`
- `user_id`

### 5. Kiểm tra Database
Chạy query để kiểm tra dữ liệu:

```sql
-- Kiểm tra đơn hàng đã hủy
SELECT * FROM orders WHERE status = 'cancelled' ORDER BY updated_at DESC LIMIT 5;

-- Kiểm tra lịch sử hủy
SELECT * FROM order_status_history WHERE status = 'cancelled' ORDER BY created_at DESC LIMIT 5;

-- Kiểm tra bảng order_cancel_simple
SELECT * FROM order_cancel_simple ORDER BY created_at DESC LIMIT 5;
```

## Troubleshooting

### Nếu không có thông báo success:
1. Kiểm tra `useSnackbar` hook có hoạt động không
2. Kiểm tra console có lỗi JavaScript không
3. Kiểm tra network request có thành công không

### Nếu không lưu được vào order_cancel_simple:
1. Kiểm tra cấu trúc bảng có đúng không
2. Kiểm tra RLS policies
3. Kiểm tra permissions

### Nếu đơn hàng không biến mất khỏi danh sách:
1. Kiểm tra filter logic trong `getUserOrdersWithItems`
2. Kiểm tra refresh logic sau khi hủy
