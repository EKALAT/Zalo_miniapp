import { useEffect, useState } from "react";
import { getUserInfo, getPhoneNumber } from "zmp-sdk";
import Button from "@/components/button";
import { useAuthStatus, logout, getUserProfile } from "@/services/auth";
import { useAuth } from "@/hooks";

export default function UserCard() {
    const { user, refreshUser, loading } = useAuth();
    const loggedIn = useAuthStatus();

    // Fallback to Zalo SDK if no database user
    const [fallbackName, setFallbackName] = useState<string | undefined>();
    const [fallbackAvatar, setFallbackAvatar] = useState<string | undefined>();
    const [fallbackPhone, setFallbackPhone] = useState<string | undefined>();

    useEffect(() => {
        if (!loggedIn) return;

        // If we have user from database, use it
        if (user) {
            return;
        }

        // Otherwise, get from Zalo SDK as fallback
        let mounted = true;
        (async () => {
            try {
                const ui = await getUserInfo({ avatarType: "normal" });
                if (!mounted) return;
                setFallbackName(ui.userInfo.name);
                setFallbackAvatar(ui.userInfo.avatar);
            } catch { }
            try {
                const pn = await getPhoneNumber();
                if (!mounted) return;
                setFallbackPhone(pn.number);
            } catch { }
        })();
        return () => {
            mounted = false;
        };
    }, [loggedIn, user]);

    useEffect(() => {
        if (!loggedIn) {
            setFallbackName(undefined);
            setFallbackAvatar(undefined);
            setFallbackPhone(undefined);
        }
    }, [loggedIn]);

    if (!loggedIn) return null;

    // Use database user if available, otherwise fallback to Zalo SDK
    const displayName = user?.name || fallbackName;
    const displayAvatar = user?.avatar || fallbackAvatar;
    const displayPhone = user?.phone || fallbackPhone;
    const displayAddress = user?.default_address;

    // Debug logging for phone number
    console.log('📱 User card phone display:', {
        userPhone: user?.phone,
        fallbackPhone: fallbackPhone,
        displayPhone: displayPhone,
        userExists: !!user
    });

    return (
        <div className="bg-white rounded-lg p-4 border-[0.5px] border-black/15">
            <div className="flex items-center gap-3 justify-between mb-3">
                <div className="flex items-center gap-3">
                    <img
                        src={displayAvatar}
                        alt={displayName || "avatar"}
                        className="w-12 h-12 rounded-full object-cover bg-secondary"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{displayName || "Người dùng"}</div>
                        {displayPhone && <div className="text-2xs text-subtitle">{displayPhone}</div>}
                    </div>
                </div>
                {loggedIn && (
                    <Button small onClick={logout}>Đăng xuất</Button>
                )}
            </div>

            {/* Display address if available */}
            {displayAddress && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                        <span className="text-blue-600">📍</span>
                        <div className="flex-1">
                            <div className="text-xs text-blue-700 font-medium">Địa chỉ mặc định:</div>
                            <div className="text-xs text-blue-600 mt-1">{displayAddress}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Show loading state */}
            {loading && (
                <div className="text-xs text-gray-500 mt-2">Đang tải thông tin...</div>
            )}

            {/* Show last updated time if available */}
            {user?.updated_at && (
                <div className="text-xs text-gray-400 mt-2">
                    Cập nhật: {new Date(user.updated_at).toLocaleString('vi-VN')}
                </div>
            )}
        </div>
    );
}


