import { useEffect, useState } from "react";
import { getUserInfo, getPhoneNumber } from "zmp-sdk";
import Button from "@/components/button";
import { useAuthStatus, logout } from "@/services/auth";
import { useAuth } from "@/hooks";
import { formatDateTime } from "@/utils/format";

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
        <div className="bg-white rounded-xl p-4 border border-black/10 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <img
                        src={displayAvatar}
                        alt={displayName || "avatar"}
                        className="w-12 h-12 rounded-full object-cover bg-secondary ring-2 ring-primary/10"
                    />
                    <div className="min-w-0">
                        <div className="text-base font-semibold truncate">{displayName || "Người dùng"}</div>
                    </div>
                </div>
                {loggedIn && (<Button small onClick={logout}>Đăng xuất</Button>)}
            </div>

            {/* Contact blocks */}
            <div className="mt-1 grid grid-cols-1 gap-2">
                {/* Address */}
                <div className="flex items-start gap-2 p-3 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100/60">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-600 mt-0.5">
                        <path fillRule="evenodd" d="M11.54 22.35a.75.75 0 00.92 0c.3-.23.73-.58 1.22-1.03 1.48-1.31 3.53-3.3 5.1-5.5 1.6-2.24 2.72-4.7 2.72-6.82A8.5 8.5 0 0012 .5a8.5 8.5 0 00-8.5 8.5c0 2.12 1.12 4.58 2.72 6.82 1.57 2.2 3.62 4.19 5.1 5.5.49.45.92.8 1.22 1.03zm.46-9.6a3.25 3.25 0 100-6.5 3.25 3.25 0 000 6.5z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs text-blue-700 font-medium">Địa chỉ mặc định</div>
                        <div className="text-sm text-blue-800 mt-0.5 break-words">{displayAddress || 'Chưa có'}</div>
                    </div>
                </div>

                {/* Phone (single place) */}
                {displayPhone && (
                    <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-green-100/60">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-600">
                            <path d="M2.25 6.75c0-1.243 1.007-2.25 2.25-2.25h2.1c.93 0 1.744.59 2.06 1.47l.76 2.11a2.25 2.25 0 01-.52 2.34l-1.12 1.12a12.032 12.032 0 005.58 5.58l1.12-1.12a2.25 2.25 0 012.34-.52l2.11.76a2.25 2.25 0 011.47 2.06v2.1a2.25 2.25 0 01-2.25 2.25h-.75C8.1 22.5 1.5 15.9 1.5 7.5v-.75z" />
                        </svg>
                        <div className="text-sm font-medium text-green-800">{displayPhone}</div>
                    </div>
                )}
            </div>

            {/* Meta */}
            <div className="mt-2 text-2xs text-gray-500">
                {loading ? 'Đang tải thông tin...' : user?.updated_at ? `Cập nhật: ${formatDateTime(user.updated_at)}` : null}
            </div>
        </div>
    );
}



