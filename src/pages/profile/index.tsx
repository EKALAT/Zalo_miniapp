import ProfileActions from "./actions";
import FollowOA from "./follow-oa";
import LoginButton from "./login-button";
import { useEffect } from "react";
import { autoLoginAndUpsert } from "@/services/auth";
import UserCard from "./user-card";

export default function ProfilePage() {
  useEffect(() => {
    // Tự động đăng nhập/lấy thông tin khi vào trang
    autoLoginAndUpsert().catch(() => { });
  }, []);
  return (
    <div className="min-h-full bg-section p-4 space-y-2.5">
      <LoginButton />
      <UserCard />
      <ProfileActions />
      <FollowOA />
    </div>
  );
}
