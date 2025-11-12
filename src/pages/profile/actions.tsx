import { OrderHistoryIcon, PackageIcon, ProfileIcon } from "@/components/vectors";
import { useNavigate } from "react-router-dom";

export default function ProfileActions() {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl p-4 border border-black/10 shadow-sm">
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Thông tin tài khoản",
            icon: ProfileIcon,
            onClick: () => navigate("/profile/account-info"),
            bg: "from-indigo-50 to-blue-50",
            ring: "ring-indigo-100",
          },
          {
            label: "Theo dõi đơn hàng",
            icon: PackageIcon,
            onClick: () => navigate("/profile/order-tracking"),
            bg: "from-emerald-50 to-green-50",
            ring: "ring-emerald-100",
          },
          {
            label: "Lịch sử mua hàng",
            icon: OrderHistoryIcon,
            onClick: () => navigate("/profile/order-history"),
            bg: "from-amber-50 to-yellow-50",
            ring: "ring-amber-100",
          },
        ].map((action) => (
          <div
            key={action.label}
            className={`group cursor-pointer rounded-lg px-3 py-3 bg-gradient-to-br ${action.bg} ring-1 ${action.ring} transition transform hover:-translate-y-0.5 active:translate-y-0`}
            onClick={action.onClick}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-sm">
                <action.icon active />
              </div>
              <div className="text-2xs text-center font-medium text-gray-700 leading-tight">
                {action.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
