import { OrderHistoryIcon, PackageIcon, ProfileIcon } from "@/components/vectors";
import { useToBeImplemented } from "@/hooks";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getUserInfo, getPhoneNumber } from "zmp-sdk";

export default function ProfileActions() {
  const toBeImplemented = useToBeImplemented();
  const login = async () => {
    try {
      const user = await getUserInfo({ avatarType: "normal" });
      let phone: string | undefined;
      try {
        const pn = await getPhoneNumber();
        phone = pn.number;
      } catch { }

      if (!isSupabaseConfigured) {
        alert("Thiếu cấu hình Supabase (.env)");
        return;
      }

      await supabase.from("users").upsert(
        [
          {
            id: user.userInfo.id,
            name: user.userInfo.name,
            avatar: user.userInfo.avatar,
            phone: phone,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "id" }
      );
      alert("Đăng nhập thành công");
    } catch (e) {
      console.error(e);
      alert("Đăng nhập thất bại");
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 flex justify-center gap-6 border-[0.5px] border-black/15">
      {[
        {
          label: "Thông tin tài khoản",
          icon: ProfileIcon,
          onClick: toBeImplemented,
        },
        // Đăng nhập được đưa lên ô trên, không hiển thị ở đây
        {
          label: "Theo dõi đơn hàng",
          icon: PackageIcon,
          onClick: toBeImplemented,
        },
        {
          label: "Lịch sử mua hàng",
          icon: OrderHistoryIcon,
          onClick: toBeImplemented,
        },
      ].map((action) => (
        <div
          key={action.label}
          className="flex flex-col gap-2 items-center cursor-pointer"
          onClick={action.onClick}
        >
          <div className="w-10 h-10 rounded-full bg-[#EBEFF7] flex items-center justify-center">
            <action.icon active />
          </div>
          <div className="text-2xs text-center">{action.label}</div>
        </div>
      ))}
    </div>
  );
}
