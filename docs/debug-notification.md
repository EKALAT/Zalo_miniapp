# Debug: Thông báo không hiển thị

## Cách debug thông báo

### 1. Mở Developer Tools
- F12 > Console tab

### 2. Thực hiện hủy đơn hàng
1. Vào "Theo dõi đơn hàng"
2. Tìm đơn hàng có nút "Gửi yêu cầu hủy" (chỉ đơn hàng "pending")
3. Nhấn nút → Modal hiện ra
4. Nhập lý do hủy (ít nhất 10 ký tự)
5. Nhấn "Gửi yêu cầu hủy"

### 3. Kiểm tra Console Logs
Tìm các log sau:

#### Nếu thành công:
```
📢 Showing success notification...
🔍 openSnackbar function: function
✅ openSnackbar called successfully
```

#### Nếu có lỗi:
```
🔍 Showing error notification...
✅ Error notification shown
```

### 4. Các vấn đề có thể gặp

#### Vấn đề 1: openSnackbar không phải function
```
🔍 openSnackbar function: undefined
```
**Giải pháp:** Kiểm tra import `useSnackbar` từ `zmp-ui`

#### Vấn đề 2: openSnackbar throw error
```
❌ Error calling openSnackbar: [error]
```
**Giải pháp:** Kiểm tra zmp-ui version và setup

#### Vấn đề 3: Không có log nào
```
// Không thấy log "📢 Showing success notification..."
```
**Giải pháp:** Kiểm tra code có chạy đến phần này không

### 5. Test thông báo đơn giản
Thêm code này vào component để test:

```javascript
// Test thông báo ngay khi component load
useEffect(() => {
    console.log('🧪 Testing notification...');
    openSnackbar({
        text: 'Test notification',
        type: 'success'
    });
}, []);
```

### 6. Kiểm tra zmp-ui setup
Đảm bảo trong `app.tsx` hoặc `main.tsx` có:
```javascript
import { ZMPRouter, AnimationRoutes, SnackbarProvider } from 'zmp-ui';

// Wrap app với SnackbarProvider
<SnackbarProvider>
    <ZMPRouter>
        <AnimationRoutes>
            // Your routes
        </AnimationRoutes>
    </ZMPRouter>
</SnackbarProvider>
```

### 7. Alternative: Sử dụng alert
Nếu snackbar không hoạt động, có thể dùng alert tạm thời:

```javascript
// Thay thế openSnackbar bằng alert
alert('✅ Đã gửi yêu cầu hủy đơn hàng thành công!');
```
