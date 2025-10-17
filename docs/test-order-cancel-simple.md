# Test: Hủy đơn hàng với bảng order_cancel_simple

## Cấu trúc bảng order_cancel_simple
- `id` (uuid) - Auto generated
- `_id` (text) - User ID
- `user_name` (text) - Tên người dùng
- `order_number` (text) - Số đơn hàng
- `reason` (text) - Lý do hủy

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
🚀 Starting cancel order process...
📡 Calling cancelOrder API...
🔄 Updating order status...
✅ Order status updated successfully
✅ Cancellation history added successfully
✅ Cancellation details saved successfully
✅ cancelOrder API completed successfully
📢 Showing success notification...
🔄 Refreshing orders list...
✅ Orders list refreshed
🏁 Cancel process finished
```

### 4. Kiểm tra Database
Chạy query:
```sql
SELECT * FROM order_cancel_simple ORDER BY created_at DESC LIMIT 5;
```

Kết quả mong đợi:
- Có record mới với `_id`, `user_name`, `order_number`, `reason`
- `reason` chứa lý do hủy đơn hàng

### 5. Kiểm tra Thông báo
- Thông báo success: "✅ Đã gửi yêu cầu hủy đơn hàng thành công! Thông tin đã được lưu vào hệ thống."
- Đơn hàng biến mất khỏi danh sách

## Expected Data Format
```json
{
  "id": "uuid-auto-generated",
  "_id": "user_id_from_zalo",
  "user_name": "Tên người dùng",
  "order_number": "ORD1234567890",
  "reason": "Lý do hủy đơn hàng"
}
```
