import { useCallback, useEffect, useMemo, useState } from "react";
import { zaloUserService, AppUser } from "@/services/zalo-auth";
import { useAuthStatus, updateProfile as persistProfile } from "@/services/auth";
import type { UpdateProfileRequest } from "@/types/auth";

interface RefreshOptions {
    fallbackToAutoLogin?: boolean;
}

export function useZaloAuth() {
    const loggedIn = useAuthStatus();
    const [user, setUser] = useState<AppUser | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | undefined>();

    const refreshUser = useCallback(
        async ({ fallbackToAutoLogin = false }: RefreshOptions = {}) => {
            setIsLoading(true);
            try {
                if (!loggedIn) {
                    setUser(null);
                    setError(undefined);
                    return null;
                }

                const current = await zaloUserService.getCurrentUser();
                const needsBackfill =
                    !current?.name ||
                    !current?.avatar ||
                    !current?.phone;

                if (!needsBackfill && current) {
                    setUser(current);
                    setError(undefined);
                    return current;
                }

                if (fallbackToAutoLogin) {
                    const profile = await zaloUserService.login();
                    setUser(profile);
                    setError(undefined);
                    return profile;
                }

                setUser(current ?? null);
                setError(undefined);
                return current ?? null;
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định";
                setError(message);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [loggedIn]
    );

    const login = useCallback(async () => {
        setIsLoading(true);
        try {
            const profile = await zaloUserService.login();
            setUser(profile);
            setError(undefined);
            return profile;
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Đăng nhập thất bại";
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        await zaloUserService.logout();
        setUser(null);
        setError(undefined);
    }, []);

    const updateProfile = useCallback(
        async (payload: UpdateProfileRequest) => {
            if (!payload.id) {
                throw new Error("Thiếu ID người dùng để cập nhật hồ sơ");
            }
            const updated = await persistProfile(payload);
            setUser(updated);
            setError(undefined);
            return updated;
        },
        []
    );

    useEffect(() => {
        refreshUser({ fallbackToAutoLogin: true }).catch(() => { });
    }, [refreshUser]);

    useEffect(() => {
        const handler = () => {
            refreshUser().catch(() => { });
        };
        window.addEventListener("user-updated", handler as EventListener);
        return () => window.removeEventListener("user-updated", handler as EventListener);
    }, [refreshUser]);

    const value = useMemo(
        () => ({
            user,
            setUser,
            isLoading,
            isLoggedIn: loggedIn && !!user,
            sessionActive: loggedIn,
            login,
            logout,
            updateProfile,
            refreshUser,
            error,
        }),
        [error, isLoading, loggedIn, login, logout, refreshUser, updateProfile, user]
    );

    return value;
}

