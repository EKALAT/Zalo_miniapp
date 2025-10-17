# Test Case: Tính năng hủy đơn hàng

## Test Case 1: Hủy đơn hàng thành công

### Mô tả
Test việc hủy đơn hàng với lý do hợp lệ và kiểm tra dữ liệu được lưu vào database.

### Các bước thực hiện
1. Đăng nhập vào hệ thống
2. Vào trang "Theo dõi đơn hàng"
3. Tìm đơn hàng có trạng thái "pending" hoặc "confirmed"
4. Nhấn nút "Gửi yêu cầu hủy"
5. Nhập lý do hủy đơn hàng (tối thiểu 10 ký tự)
6. Nhấn "Gửi yêu cầu hủy"

### Kết quả mong đợi
- Modal hiển thị thông báo "✅ Đã gửi yêu cầu hủy đơn hàng thành công! Thông tin đã được lưu vào hệ thống."
- Đơn hàng biến mất khỏi danh sách (vì đã chuyển sang trạng thái cancelled)
- Dữ liệu được lưu vào bảng `orders_cancelled` với các thông tin:
  - `order_id`: ID của đơn hàng
  - `user_id`: ID của người dùng
  - `order_number`: Số đơn hàng
  - `cancellation_reason`: Lý do hủy
  - `cancelled_at`: Thời gian hủy
  - `cancelled_by`: "user"
  - `original_status`: Trạng thái gốc
  - `refund_required`: true/false tùy theo payment_status

## Test Case 2: Validation lý do hủy

### Mô tả
Test validation khi nhập lý do hủy không hợp lệ.

### Các bước thực hiện
1. Mở modal hủy đơn hàng
2. Nhập lý do dưới 10 ký tự
3. Nhấn "Gửi yêu cầu hủy"

### Kết quả mong đợi
- Hiển thị thông báo lỗi: "Lý do hủy đơn hàng phải có ít nhất 10 ký tự"
- Nút "Gửi yêu cầu hủy" bị disable

## Test Case 3: Hủy đơn hàng không thể hủy

### Mô tả
Test việc cố gắng hủy đơn hàng ở trạng thái không cho phép.

### Các bước thực hiện
1. Tìm đơn hàng có trạng thái "processing", "shipped", "delivered", "cancelled", "refunded"
2. Kiểm tra UI

### Kết quả mong đợi
- Không hiển thị nút "Gửi yêu cầu hủy"
- Hiển thị trạng thái tương ứng với icon và màu sắc phù hợp

## Test Case 4: Kiểm tra database

### Mô tả
Kiểm tra dữ liệu được lưu vào database sau khi hủy đơn hàng.

### SQL Query để kiểm tra
```sql
-- Kiểm tra đơn hàng đã bị hủy
SELECT * FROM orders WHERE id = 'ORDER_ID_HERE' AND status = 'cancelled';

-- Kiểm tra thông tin hủy đơn hàng
SELECT * FROM orders_cancelled WHERE order_id = 'ORDER_ID_HERE';

-- Kiểm tra lịch sử trạng thái
SELECT * FROM order_status_history WHERE order_id = 'ORDER_ID_HERE' AND status = 'cancelled';
```

### Kết quả mong đợi
- Đơn hàng có trạng thái 'cancelled'
- Có record trong bảng `orders_cancelled` với đầy đủ thông tin
- Có record trong bảng `order_status_history` với note chứa lý do hủy
