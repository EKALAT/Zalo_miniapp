# Tính năng hủy đơn hàng

## Tổng quan
Tính năng hủy đơn hàng cho phép khách hàng hủy các đơn hàng đang ở trạng thái "pending" (đang chờ xử lý) hoặc "confirmed" (đã xác nhận).

## Các thành phần đã triển khai

### 1. Component CancelOrderModal (`src/components/cancel-order-modal.tsx`)
- Modal popup để nhập lý do hủy đơn hàng
- Validation: lý do phải có ít nhất 10 ký tự
- Các lý do phổ biến có sẵn để chọn nhanh
- UI responsive và user-friendly

### 2. API Function (`src/services/orders.ts`)
- `cancelOrder(orderId, reason, userId)`: Hàm hủy đơn hàng
- Kiểm tra quyền sở hữu đơn hàng
- Validation trạng thái đơn hàng có thể hủy
- Cập nhật trạng thái và lưu lịch sử

### 3. UI Updates (`src/pages/profile/order-tracking.tsx`)
- Nút "Hủy đơn hàng" cho các đơn hàng có thể hủy
- Hiển thị trạng thái "Đã hủy" cho đơn hàng bị hủy
- Loading state khi đang xử lý hủy đơn hàng
- Refresh danh sách đơn hàng sau khi hủy thành công

## Quy tắc hủy đơn hàng

### Có thể hủy:
- Đơn hàng ở trạng thái "pending" (đang chờ xử lý)
- Đơn hàng ở trạng thái "confirmed" (đã xác nhận)

### Không thể hủy:
- Đơn hàng ở trạng thái "processing" (đang xử lý)
- Đơn hàng ở trạng thái "shipped" (đã giao hàng)
- Đơn hàng ở trạng thái "delivered" (đã nhận hàng)
- Đơn hàng ở trạng thái "cancelled" (đã hủy)
- Đơn hàng ở trạng thái "refunded" (đã hoàn tiền)

## Cách sử dụng

1. Vào trang "Theo dõi đơn hàng" từ Profile
2. Tìm đơn hàng có thể hủy (trạng thái "Đang chờ xử lý" hoặc "Đã xác nhận")
3. Nhấn nút "Hủy đơn hàng" (màu đỏ)
4. Nhập lý do hủy đơn hàng (tối thiểu 10 ký tự)
5. Nhấn "Xác nhận hủy"
6. Đơn hàng sẽ được cập nhật trạng thái thành "Đã hủy"

## Tính năng bảo mật

- Kiểm tra quyền sở hữu: Chỉ chủ đơn hàng mới có thể hủy
- Validation trạng thái: Chỉ cho phép hủy các đơn hàng phù hợp
- Ghi log lịch sử: Lưu lại lý do hủy và thời gian
- Error handling: Xử lý lỗi và hiển thị thông báo phù hợp

## Database Schema

Tính năng sử dụng các bảng sau:
- `orders`: Cập nhật trạng thái thành 'cancelled'
- `order_status_history`: Ghi lại lịch sử hủy đơn hàng
- `orders_cancelled`: Lưu thông tin chi tiết về việc hủy đơn hàng

### Bảng orders_cancelled
Lưu trữ thông tin chi tiết về việc hủy đơn hàng:
- `order_id`: ID của đơn hàng bị hủy
- `user_id`: ID của người dùng hủy đơn hàng
- `order_number`: Số đơn hàng
- `cancellation_reason`: Lý do hủy đơn hàng
- `cancelled_at`: Thời gian hủy đơn hàng
- `cancelled_by`: Người hủy (user/admin/system)
- `original_status`: Trạng thái gốc trước khi hủy
- `refund_required`: Có cần hoàn tiền hay không

### Tạo bảng orders_cancelled
Chạy file SQL: `docs/create_orders_cancelled_table.sql`

## UI/UX Features

- Modal responsive trên mobile
- Loading states và animations
- Validation real-time
- Thông báo thành công/lỗi
- Các lý do phổ biến để chọn nhanh
- Character counter cho textarea
