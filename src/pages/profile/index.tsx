import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProfileActions from "./actions";
import UserCard from "./user-card";
import { useAuth } from "@/hooks";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { refreshUser, loggedIn, loading } = useAuth();

  useEffect(() => {
    refreshUser().catch(() => { });
  }, [refreshUser]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshUser().catch(() => { });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refreshUser]);

  if (loading) {
    return (
      <div className="min-h-full bg-section p-6 flex items-center justify-center">
        <div className="rounded-xl bg-white px-4 py-3 text-sm text-gray-600 shadow">
          Đang tải hồ sơ Zalo...
        </div>
      </div>
    );
  }

  if (!loggedIn && !loading) {
    return (
      <div className="min-h-full bg-section p-6">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-6 text-center shadow">
          <h1 className="text-lg font-semibold">Bạn chưa đăng nhập</h1>
          <p className="mt-2 text-sm text-gray-500">
            Hãy đăng nhập bằng tài khoản Zalo để đồng bộ thông tin mua sắm và lịch sử đơn hàng.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-section p-4 space-y-2.5">
      <UserCard />
      <ProfileActions />
      <div className="relative">
        <div className="pointer-events-none select-none text-center text-xs md:text-sm text-gray-300 tracking-widest uppercase">
          developed by PHOMMASENG EKALAT
        </div>
      </div>
    </div>
  );
}
