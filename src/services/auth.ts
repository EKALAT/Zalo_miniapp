import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getUserInfo, getPhoneNumber, login } from "zmp-sdk";
import { useEffect, useState } from "react";

export interface ZaloUserProfile {
    id: string;
    name?: string;
    avatar?: string;
    phone?: string;
}

async function verifyWithBackend(accessToken: string): Promise<Partial<ZaloUserProfile> | undefined> {
    const verifyUrl = import.meta.env.VITE_ZALO_VERIFY_ENDPOINT as string | undefined;
    if (!verifyUrl) return undefined;
    try {
        const res = await fetch(verifyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: accessToken }),
        });
        if (!res.ok) return undefined;
        return (await res.json()) as Partial<ZaloUserProfile>;
    } catch {
        return undefined;
    }
}

const LOGIN_KEY = "zma_logged_in";
const AUTH_EVENT = "zma-auth-change";

export function isLoggedIn(): boolean {
    try {
        return localStorage.getItem(LOGIN_KEY) === "1";
    } catch {
        return false;
    }
}

export function setLoggedIn(value: boolean) {
    try {
        if (value) localStorage.setItem(LOGIN_KEY, "1");
        else localStorage.removeItem(LOGIN_KEY);
        window.dispatchEvent(
            new CustomEvent(AUTH_EVENT, { detail: { loggedIn: value } })
        );
    } catch { }
}

export async function logout() {
    setLoggedIn(false);
}

export function useAuthStatus(): boolean {
    const [loggedIn, setLoggedInState] = useState<boolean>(isLoggedIn());
    useEffect(() => {
        const handler = () => setLoggedInState(isLoggedIn());
        window.addEventListener(AUTH_EVENT, handler as EventListener);
        return () => window.removeEventListener(AUTH_EVENT, handler as EventListener);
    }, []);
    return loggedIn;
}

export async function autoLoginAndUpsert(): Promise<ZaloUserProfile | undefined> {
    if (!isSupabaseConfigured) return undefined;

    const ui = await getUserInfo({ avatarType: "normal" });
    let phone: string | undefined;
    try {
        const pn = await getPhoneNumber();
        phone = pn.number;
    } catch { }

    let verified: Partial<ZaloUserProfile> | undefined;
    try {
        const t = await login();
        // @ts-ignore zmp-sdk typings may name the field differently across versions
        const token: string | undefined = (t && (t as any).token) || (t as any)?.accessToken;
        if (token) {
            verified = await verifyWithBackend(token);
        }
    } catch { }

    const profile: ZaloUserProfile = {
        id: ui.userInfo.id,
        name: verified?.name ?? ui.userInfo.name,
        avatar: verified?.avatar ?? ui.userInfo.avatar,
        phone: verified?.phone ?? phone,
    };

    await supabase.from("users").upsert(
        [
            {
                id: profile.id,
                name: profile.name,
                avatar: profile.avatar,
                phone: profile.phone,
                updated_at: new Date().toISOString(),
            },
        ],
        { onConflict: "id" }
    );

    setLoggedIn(true);
    return profile;
}


