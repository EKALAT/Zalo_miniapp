# Test: Logic hủy đơn hàng đã cập nhật

## Thay đổi chính
- **Chỉ cho phép hủy đơn hàng ở trạng thái "pending"**
- **Không hiển thị nút hủy cho các trạng thái khác**

## Quy tắc hủy đơn hàng mới

### ✅ Có thể hủy:
- `pending` (Đang chờ xử lý) - **Chỉ trạng thái này**

### ❌ Không thể hủy:
- `confirmed` (Đã xác nhận) - **Hiển thị badge "Đã xác nhận"**
- `processing` (Đang xử lý) - **Hiển thị badge "Đang xử lý"**
- `shipped` (Đã giao hàng) - **Hiển thị badge "Đã giao hàng"**
- `delivered` (Đã nhận hàng) - **Hiển thị badge "Đã nhận hàng"**
- `cancelled` (Đã hủy) - **Hiển thị badge "Đã hủy"**
- `refunded` (Đã hoàn tiền) - **Hiển thị badge "Đã hoàn tiền"**

## Cách test

### 1. Test với đơn hàng "pending"
- **Kết quả mong đợi:** Hiển thị nút "Gửi yêu cầu hủy"
- **Có thể hủy:** ✅

### 2. Test với đơn hàng "confirmed" (như trong hình)
- **Kết quả mong đợi:** Hiển thị badge "Đã xác nhận" (màu xanh)
- **Có thể hủy:** ❌
- **Không hiển thị nút hủy**

### 3. Test với các trạng thái khác
- **processing:** Badge "Đang xử lý" (màu tím)
- **shipped:** Badge "Đã giao hàng" (màu indigo)
- **delivered:** Badge "Đã nhận hàng" (màu xanh lá)
- **cancelled:** Badge "Đã hủy" (màu đỏ)
- **refunded:** Badge "Đã hoàn tiền" (màu cam)

## UI Changes

### Trước khi sửa:
```
[Đã xác nhận] [X Gửi yêu cầu hủy]  ← Nút hủy vẫn hiển thị
```

### Sau khi sửa:
```
[Đã xác nhận]  ← Chỉ hiển thị badge, không có nút hủy
```

## API Changes

### Trước khi sửa:
```javascript
// Cho phép hủy cả pending và confirmed
if (order.status === 'pending' || order.status === 'confirmed') {
    // Show cancel button
}
```

### Sau khi sửa:
```javascript
// Chỉ cho phép hủy pending
if (order.status === 'pending') {
    // Show cancel button
}
```

## Error Messages

Nếu cố gắng hủy đơn hàng không phải "pending":
```
"Không thể hủy đơn hàng ở trạng thái 'Đã xác nhận'. Chỉ có thể hủy đơn hàng đang chờ xử lý."
```
