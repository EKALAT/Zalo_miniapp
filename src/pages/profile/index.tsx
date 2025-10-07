import ProfileActions from "./actions";
import { useEffect } from "react";
import { autoLoginAndUpsert } from "@/services/auth";
import UserCard from "./user-card";
import { useAuth } from "@/hooks";

export default function ProfilePage() {
  const { refreshUser } = useAuth();

  useEffect(() => {
    // Tự động đăng nhập/lấy thông tin khi vào trang
    autoLoginAndUpsert().catch(() => { });
  }, []);

  // Refresh user data when page becomes visible (when user comes back from other pages)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh user data
        refreshUser();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshUser]);

  return (
    <div className="min-h-full bg-section p-4 space-y-2.5">
      <UserCard />
      <ProfileActions />
      {/* Watermark */}
      <div className="relative">
        <div className="pointer-events-none select-none text-center text-xs md:text-sm text-gray-300 tracking-widest uppercase">
          developed by PHOMMASENG EKALAT
        </div>
      </div>
    </div>
  );
}
