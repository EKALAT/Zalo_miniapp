# Test: Hủy đơn hàng - Đã sửa lỗi user_id

## Vấn đề đã sửa
1. ✅ **Lỗi `user_id` null**: Đã thêm `user_id: userId` vào insert
2. ✅ **Lỗi network refresh**: Đã thêm try-catch để không crash

## Cấu trúc bảng order_cancel_simple (cập nhật)
- `id` (uuid) - Auto generated
- `user_id` (text) - **NOT NULL** - User ID từ Zalo
- `user_name` (text) - Tên người dùng
- `order_number` (text) - Số đơn hàng
- `reason` (text) - Lý do hủy
- `created_at` (timestamptz) - Auto generated

## Cách test

### 1. Mở Developer Tools
- F12 > Console tab

### 2. Thực hiện hủy đơn hàng
1. Vào "Theo dõi đơn hàng"
2. Tìm đơn hàng có nút "Gửi yêu cầu hủy"
3. Nhấn nút → Modal hiện ra
4. Nhập lý do hủy (ít nhất 10 ký tự)
5. Nhấn "Gửi yêu cầu hủy"

### 3. Kiểm tra Console Logs
Sẽ thấy:
```
💾 Saving to order_cancel_simple with data: {
  user_id: "3368637342326461234",
  user_name: "Tên người dùng",
  order_number: "ORD1234567890",
  reason: "Lý do hủy"
}
✅ Cancellation details saved successfully: [data]
```

### 4. Kiểm tra Database
```sql
SELECT * FROM order_cancel_simple ORDER BY created_at DESC LIMIT 5;
```

Kết quả mong đợi:
- Có record mới với `user_id`, `user_name`, `order_number`, `reason`
- Không còn lỗi `null value in column "user_id"`

### 5. Kiểm tra Thông báo
- Thông báo success: "✅ Đã gửi yêu cầu hủy đơn hàng thành công! Thông tin đã được lưu vào hệ thống."
- Nếu có lỗi refresh: "⚠️ Could not refresh orders list" (nhưng vẫn thành công)

## Expected Data Format
```json
{
  "id": "uuid-auto-generated",
  "user_id": "3368637342326461234",
  "user_name": "Tên người dùng",
  "order_number": "ORD1234567890",
  "reason": "Lý do hủy đơn hàng",
  "created_at": "2025-10-17T09:12:03.752631+07:00"
}
```

## Troubleshooting

### Nếu vẫn lỗi user_id null:
- Kiểm tra `userId` có được truyền đúng không
- Kiểm tra bảng có cột `user_id` không

### Nếu lỗi network:
- Kiểm tra kết nối Supabase
- Kiểm tra RLS policies
- Lỗi này không ảnh hưởng đến việc lưu cancellation
