# Hướng Dẫn Đăng Nhập Zalo Cho Ứng Dụng Test Shop

## 📋 Tổng Quan

Tài liệu này mô tả cách tích hợp luồng đăng nhập Zalo vào dự án **Test Shop** (Zalo Mini App). Sau khi hoàn tất, ứng dụng cho phép:

- ✅ Đăng nhập với tài khoản Zalo
- ✅ Lưu trữ thông tin người dùng (ID, tên, avatar, thời gian đăng nhập)
- ✅ Cập nhật thủ công tên và số điện thoại
- ✅ Hiển thị quyền cần cấp và xử lý các trạng thái lỗi phổ biến

## 🛠️ Cài Đặt Dependencies

Các gói cần thiết đã được cài sẵn trong dự án. Kiểm tra lại `package.json` để đảm bảo phiên bản tối thiểu:

```json
{
  "dependencies": {
    "zmp-sdk": "^2.41.0",
    "zmp-ui": "^1.11.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.0",
    "react-hot-toast": "^2.4.1",
    "jotai": "^2.10.0"
  }
}
```

Nếu thiếu, cài đặt bằng:

```bash
npm install zmp-sdk zmp-ui react react-dom react-router-dom react-hot-toast jotai
```

## 📁 Cấu Trúc Files Liên Quan

```
src/
├── components/
│   └── permission-info.tsx       # Thông báo yêu cầu cấp quyền scope.userInfo
├── hooks/
│   └── use-zalo-auth.ts          # Custom hook quản lý trạng thái đăng nhập
├── pages/
│   ├── login/
│   │   └── index.tsx             # Trang đăng nhập Zalo
│   └── profile/
│       └── index.tsx             # Trang hồ sơ có tích hợp auth
├── services/
│   └── zalo-auth.ts              # Service xử lý logic Zalo SDK + localStorage
├── types/
│   └── auth.ts                   # Định nghĩa kiểu dữ liệu người dùng
└── router.tsx                    # Định tuyến bổ sung /login
```

## 🔧 Triển Khai Chi Tiết

### 1. Định Nghĩa Kiểu Dữ Liệu (`src/types/auth.ts`)

```typescript
export interface ZaloUser {
  id: string;
  name?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  lastLogin?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  email?: string;
}
```

> Ngoài `ZaloUser`, file còn chứa `AuthState` và `LoginResponse` phục vụ mở rộng trong tương lai.

### 2. Service Zalo Auth (`src/services/zalo-auth.ts`)

- Bao bọc `zmp-sdk/apis` (`authorize`, `getUserInfo`, `getUserID`, `getPhoneNumber`)
- Lưu trạng thái đăng nhập và dữ liệu người dùng vào `localStorage`
- Cung cấp các hàm:

| Hàm                 | Mô tả                                                                 |
| ------------------- | ---------------------------------------------------------------------- |
| `login()`           | Quy trình đăng nhập, xin quyền, mock số điện thoại                    |
| `logout()`          | Xóa dữ liệu khỏi `localStorage`                                       |
| `getCurrentUser()`  | Lấy user hiện tại từ storage                                           |
| `updateUserInfo()`  | Cập nhật tên/số điện thoại và lưu lại                                  |
| `isLoggedIn()`      | Kiểm tra trạng thái đăng nhập                                          |

> ⚠️ Số điện thoại vẫn là mock (`getPhoneNumber` trả về token). Cần backend decode khi được Zalo duyệt.

### 3. Custom Hook (`src/hooks/use-zalo-auth.ts`)

Hook cung cấp giao diện React-friendly cho các thao tác auth:

- `user`, `isLoggedIn`, `isLoading`, `error`
- `login()`, `logout()`, `updateProfile()`, `refreshUser()`
- Tự khởi động kiểm tra trạng thái đăng nhập và đồng bộ `localStorage`

### 4. Component Yêu Cầu Quyền (`src/components/permission-info.tsx`)

Hiển thị thông báo khi người dùng chưa cấp `scope.userInfo`. Gọi lại `login()` để xin quyền bổ sung.

### 5. Trang Đăng Nhập (`src/pages/login/index.tsx`)

- Nếu người dùng đã đăng nhập, tự động chuyển sang `/profile`
- Nút “Đăng nhập với Zalo” gọi `login()` từ `useZaloAuth`
- Sử dụng `react-hot-toast` hiển thị thông báo thành công/thất bại
- Xử lý lỗi phổ biến: `-1401` (từ chối quyền), `-201` (từ chối đăng nhập)

### 6. Trang Hồ Sơ (`src/pages/profile/index.tsx`)

- Nếu chưa đăng nhập: hiển thị lời nhắc và nút chuyển tới `/login`
- Nếu đã đăng nhập:
  - Hiển thị avatar (hoặc ký tự đầu tiên tên), ID, lần đăng nhập cuối
  - Cập nhật tên & số điện thoại (lưu `localStorage`)
  - Nút làm mới / đăng xuất
  - Hiển thị `PermissionInfo` nếu thiếu tên/avatar
  - Phần “Thông tin kỹ thuật” giúp debug nhanh tình trạng dữ liệu
  - Các module sẵn có (điểm, hành động, follow OA) chỉ render sau khi đăng nhập

### 7. Router (`src/router.tsx`)

Thêm route độc lập cho trang đăng nhập:

```typescript
const router = createBrowserRouter(
  [
    {
      path: "/login",
      element: <LoginPage />,
    },
    {
      path: "/",
      element: <Layout />,
      children: [
        // ...
        {
          path: "/profile",
          element: <ProfilePage />,
          handle: {
            logo: true,
          },
        },
      ],
    },
  ],
  { basename: getBasePath() }
);
```

## 🚀 Cách Sử Dụng

### 1. Đăng Nhập

- Truy cập `/login`
- Nhấn **Đăng nhập với Zalo**
- Cấp quyền `scope.userInfo` để hiển thị tên & avatar
- Ứng dụng chuyển sang `/profile` sau khi đăng nhập thành công

### 2. Quản Lý Hồ Sơ

- Xem ID, tên, avatar, số điện thoại và lần đăng nhập gần nhất
- Chỉnh sửa tên/số điện thoại ➜ Lưu vào `localStorage`
- Làm mới dữ liệu với `refreshUser`
- Đăng xuất để xóa thông tin

### 3. Xử Lý Lỗi

- **Error -1401**: Người dùng từ chối cấp quyền `scope.userInfo`
- **Error -201**: Người dùng hủy đăng nhập
- Các lỗi khác: đọc `err.message` hoặc Console

## ⚠️ Lưu Ý Quan Trọng

### Quyền Truy Cập

- **User ID**: luôn khả dụng
- **Tên & Avatar**: yêu cầu `scope.userInfo`
- **Số điện thoại**: cần `scope.userPhonenumber` + server decode token + OA được duyệt

### Lưu Trữ

- Thông tin lưu tại `localStorage`
- `isLoggedIn()` dựa trên khóa `zalo_login_status`
- Dọn sạch dữ liệu khi đăng xuất

### Môi Trường

- Vận hành trong context Zalo Mini App (sử dụng `zmp-cli`, `vite`)
- Cần chạy trong simulator hoặc thiết bị thực để gọi được `zmp-sdk`

## 🔧 Troubleshooting

| Vấn đề                       | Cách xử lý                                                                 |
| ---------------------------- | -------------------------------------------------------------------------- |
| Không hiện tên/avatar        | Kiểm tra quyền `scope.userInfo`, thử lại đăng nhập                        |
| Số điện thoại luôn trống     | Doanh nghiệp chưa được duyệt hoặc chưa có backend decode token            |
| `getUserID` trả về rỗng      | Đảm bảo đang chạy trong môi trường Zalo hợp lệ                            |
| Toast không hiển thị         | Kiểm tra `Toaster` đã được mount trong `Layout` (`react-hot-toast`)       |

## 📱 Kết Quả Mong Đợi

- ✅ Trang `/login` tối ưu cho flow Zalo
- ✅ Trang `/profile` hiển thị đúng dữ liệu người dùng
- ✅ Lưu và cập nhật thông tin trong `localStorage`
- ✅ Hiển thị thông báo lỗi/thành công rõ ràng
- ✅ Tương thích với UI hiện tại của Test Shop

Chúc bạn triển khai thuận lợi! 🎉

