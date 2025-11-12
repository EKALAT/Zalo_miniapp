import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "zmp-ui";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks";

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, loading, user, loggedIn, error, refreshUser } = useAuth();

    useEffect(() => {
        if (loggedIn && user) {
            navigate("/profile", { replace: true });
        }
    }, [loggedIn, navigate, user]);

    const handleLogin = useCallback(async () => {
        try {
            const profile = await login();
            if (profile) {
                toast.success("Đăng nhập thành công!");
                await refreshUser();
                navigate("/profile", { replace: true });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Đăng nhập thất bại";
            toast.error(message);
        }
    }, [login, navigate, refreshUser]);

    return (
        <div className="min-h-full bg-white px-4 py-10">
            <div className="mx-auto max-w-md space-y-6">
                <header className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold">Đăng nhập với Zalo</h1>
                    <p className="text-sm text-gray-500">
                        Cấp quyền cho mini app để chúng tôi có thể đồng bộ hồ sơ của bạn từ Zalo.
                    </p>
                </header>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-700">
                    <p className="font-medium">Thông tin sẽ được đồng bộ:</p>
                    <ul className="mt-2 list-disc list-inside space-y-1">
                        <li>ID tài khoản Zalo</li>
                        <li>Tên hiển thị và ảnh đại diện</li>
                        <li>Số điện thoại (nếu bạn cho phép mini app truy cập)</li>
                    </ul>
                    <p className="mt-3 text-xs text-blue-500">
                        Dữ liệu được lưu trữ an toàn tại Supabase và chỉ dùng cho trải nghiệm trong ứng dụng.
                    </p>
                </div>

                <Button fullWidth size="large" loading={loading} onClick={handleLogin}>
                    Đăng nhập với Zalo
                </Button>

                {error && (
                    <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

