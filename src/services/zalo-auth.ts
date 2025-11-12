// ✅ Import theo khuyến nghị mới
import {
    getUserInfo,
    getPhoneNumber,
    login as zmpLogin,
    authorize,
    getSetting,
    getUserID,
} from "zmp-sdk/apis";

import {
    autoLoginAndUpsert,
    getUserProfile,
    logout as authLogout,
    updateProfile,
    ZaloUserProfile,
} from "@/services/auth";

export type AppUser = ZaloUserProfile;

const USER_ID_KEY = "zma_user_id";

function getStoredUserId(): string | undefined {
    try {
        const id = localStorage.getItem(USER_ID_KEY);
        return id || undefined;
    } catch {
        return undefined;
    }
}

async function ensureUserId(): Promise<string> {
    // getUserID có thể trả về string hoặc object tùy phiên bản SDK
    const raw = (await getUserID()) as string | { id?: string } | { userID?: string };
    const uid = typeof raw === "string" ? raw : (raw as any).id || (raw as any).userID || "";
    if (!uid) throw new Error("getUserID returned empty id");
    try { localStorage.setItem(USER_ID_KEY, uid); } catch { }
    return uid;
}

export const zaloUserService = {
    // Đăng nhập + lấy thông tin
    async login(): Promise<AppUser | null> {
        let profile: AppUser | undefined;

        try {
            profile = await autoLoginAndUpsert();
            if (profile?.id) {
                try { localStorage.setItem(USER_ID_KEY, profile.id); } catch { }
            }
        } catch {
            // ignore here, we will attempt the manual flow below
        }

        const needsBackfill =
            !profile ||
            !profile.name ||
            !profile.avatar;

        if (!needsBackfill && profile) {
            return profile;
        }

        // Manual flow to request permissions and ensure data
        const id = profile?.id || (await ensureUserId());

        try {
            const { authSetting } = await getSetting();
            const hasUserInfo = !!authSetting?.["scope.userInfo"];

            if (!hasUserInfo) {
                await authorize({ scopes: ["scope.userInfo"] });
            }

            const { userInfo } = await getUserInfo({
                autoRequestPermission: true,
                avatarType: "normal",
            });

            try {
                await updateProfile({
                    id,
                    name: userInfo.name,
                    avatar: userInfo.avatar,
                } as Partial<AppUser>);
            } catch { }

            try { localStorage.setItem(USER_ID_KEY, id); } catch { }

            return {
                id,
                name: userInfo.name,
                avatar: userInfo.avatar,
            } as AppUser;
        } catch {
            try { localStorage.setItem(USER_ID_KEY, id); } catch { }
            return profile || {
                id,
                name: undefined,
                avatar: undefined,
            } as AppUser;
        }
    },

    async getCurrentUser(): Promise<AppUser | null> {
        const id = getStoredUserId();
        if (!id) return null;
        const user = await getUserProfile(id);
        return user || null;
    },

    async logout(): Promise<void> {
        authLogout();
        try { localStorage.removeItem(USER_ID_KEY); } catch { }
    },
    async updateUserProfile(updates: { name?: string; phone?: string; email?: string }): Promise<AppUser> {
        const id = getStoredUserId();
        if (!id) throw new Error("Not logged in");
        const payload: Partial<AppUser> = { id } as any;
        if (typeof updates.name !== "undefined") payload.name = updates.name || undefined;
        if (typeof updates.phone !== "undefined") payload.phone = updates.phone || undefined;
        // email không lưu trong schema -> bỏ qua
        const updated = await updateProfile(payload);
        return updated;
    },

    async requestPhoneNumber(): Promise<string | undefined> {
        // Khuyến nghị xin quyền trước cho rõ ràng
        try {
            await authorize({ scopes: ["scope.userPhonenumber"] });
        } catch {
            // Người dùng từ chối; vẫn thử gọi để SDK tự ném lỗi có mã
        }

        const pn = await getPhoneNumber(); // có thể ném lỗi nếu từ chối
        const phone = (pn.number || "").trim() || undefined;

        const id = getStoredUserId() || (await ensureUserId());
        if (id && phone) {
            try { await updateProfile({ id, phone }); } catch { }
        }
        return phone;
    },

    async requestUserAuthorization(): Promise<boolean> {
        try {
            // Đăng nhập SDK (nếu cần) — thường không bắt buộc để lấy userInfo
            await zmpLogin();
            return true;
        } catch {
            return false;
        }
    },
};