import { useEffect, useState } from "react";
import { getUserInfo, getPhoneNumber } from "zmp-sdk";
import Button from "@/components/button";
import { useAuthStatus, logout } from "@/services/auth";

export default function UserCard() {
    const [name, setName] = useState<string | undefined>();
    const [avatar, setAvatar] = useState<string | undefined>();
    const [phone, setPhone] = useState<string | undefined>();

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const ui = await getUserInfo({ avatarType: "normal" });
                if (!mounted) return;
                setName(ui.userInfo.name);
                setAvatar(ui.userInfo.avatar);
            } catch { }
            try {
                const pn = await getPhoneNumber();
                if (!mounted) return;
                setPhone(pn.number);
            } catch { }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const loggedIn = useAuthStatus();
    useEffect(() => {
        if (!loggedIn) {
            setName(undefined);
            setAvatar(undefined);
            setPhone(undefined);
        }
    }, [loggedIn]);
    if (!loggedIn) return null;

    return (
        <div className="bg-white rounded-lg p-4 border-[0.5px] border-black/15 flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
                <img
                    src={avatar}
                    alt={name || "avatar"}
                    className="w-12 h-12 rounded-full object-cover bg-secondary"
                />
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{name || "Người dùng"}</div>
                    {phone && <div className="text-2xs text-subtitle">{phone}</div>}
                </div>
            </div>
            {loggedIn && (
                <Button small onClick={logout}>Đăng xuất</Button>
            )}
        </div>
    );
}


