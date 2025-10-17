# Test Thông báo hủy đơn hàng

## Cách test thông báo

### 1. Mở Developer Tools
- Nhấn F12 hoặc chuột phải > Inspect
- Chuyển sang tab "Console"

### 2. Thực hiện hủy đơn hàng
1. Vào trang "Theo dõi đơn hàng"
2. Tìm đơn hàng có nút "Gửi yêu cầu hủy"
3. Nhấn nút đó
4. Nhập lý do hủy (ít nhất 10 ký tự)
5. Nhấn "Gửi yêu cầu hủy"

### 3. Kiểm tra Console Logs
Bạn sẽ thấy các log sau theo thứ tự:

```
🚀 Starting cancel order process... {selectedOrderId: "...", reason: "...", userId: "..."}
📡 Calling cancelOrder API...
🔄 Updating order status: {orderId: "...", status: "cancelled", note: "..."}
✅ Order status updated successfully: [...]
✅ Cancellation history added successfully: [...]
✅ Cancellation details saved successfully: [...] (hoặc error nếu bảng không phù hợp)
✅ cancelOrder API completed successfully
📢 Showing success notification...
🔄 Refreshing orders list...
✅ Orders list refreshed
🏁 Cancel process finished
```

### 4. Kiểm tra Thông báo
- Thông báo success sẽ hiển thị: "✅ Đã gửi yêu cầu hủy đơn hàng thành công! Thông tin đã được lưu vào hệ thống."
- Thông báo sẽ xuất hiện ở góc màn hình (thường là trên cùng)

### 5. Nếu không có thông báo
Kiểm tra:
1. Console có lỗi JavaScript không?
2. `useSnackbar` hook có được import đúng không?
3. Có lỗi network request không?

### 6. Test với bảng order_cancel_simple
Nếu có lỗi khi lưu vào `order_cancel_simple`, code sẽ:
1. Thử với `order_id`, `user_id`, `order_number`
2. Nếu fail, thử với chỉ `order_id`, `user_id`
3. Log chi tiết lỗi để debug

## Expected Results
- ✅ Thông báo success hiển thị
- ✅ Đơn hàng biến mất khỏi danh sách
- ✅ Dữ liệu được lưu vào database
- ✅ Console logs chi tiết
