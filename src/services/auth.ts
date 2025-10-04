import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getUserInfo, getPhoneNumber, login } from "zmp-sdk";
import { useEffect, useState } from "react";

export interface ZaloUserProfile {
    id: string;
    name?: string;
    avatar?: string;
    phone?: string;
    default_address?: string;
    updated_at?: string;
}

export async function updateProfile(profile: Partial<ZaloUserProfile>): Promise<ZaloUserProfile> {
    if (!isSupabaseConfigured) {
        console.error("❌ Supabase not configured");
        throw new Error("Supabase not configured");
    }
    if (!profile.id) {
        console.error("❌ User ID is required to update profile");
        throw new Error("User ID is required to update profile");
    }

    console.log("💾 Updating profile in database:", profile);
    console.log("🔍 Supabase configured:", isSupabaseConfigured);
    console.log("🔗 Supabase client:", !!supabase);
    console.log("🔗 Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
    console.log("🔗 Supabase Key exists:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);

    // Prepare update data - always include all fields
    const updateData: any = {
        id: profile.id,
        updated_at: new Date().toISOString(),
    };

    // Always include name, phone, and default_address
    updateData.name = profile.name ? profile.name.trim() : null;
    updateData.avatar = profile.avatar ? profile.avatar.trim() : null;
    updateData.default_address = profile.default_address ? profile.default_address.trim() : null;

    // Handle phone number - always include it
    if (profile.phone !== undefined && profile.phone !== null) {
        updateData.phone = profile.phone.trim() || null;
    } else {
        updateData.phone = null;
    }

    console.log("📝 Prepared update data:", updateData);
    console.log("📱 Phone number details:", {
        original: profile.phone,
        processed: updateData.phone,
        isUndefined: profile.phone === undefined,
        isNull: profile.phone === null,
        isEmpty: profile.phone === '',
        type: typeof profile.phone,
        length: profile.phone ? profile.phone.length : 'N/A'
    });

    try {
        // First try to update existing record
        console.log("🔄 Attempting update...");
        const { data: updateResult, error: updateError } = await supabase
            .from("users")
            .update(updateData)
            .eq("id", profile.id)
            .select()
            .single();

        if (updateError) {
            console.error("⚠️ Update failed, trying upsert:", updateError);

            // If update fails, try upsert
            console.log("🔄 Attempting upsert...");
            const { data: upsertData, error: upsertError } = await supabase
                .from("users")
                .upsert({
                    id: profile.id,
                    ...updateData,
                }, {
                    onConflict: "id",
                    ignoreDuplicates: false
                })
                .select()
                .single();

            if (upsertError) {
                console.error("❌ Both update and upsert failed:", upsertError);
                console.error("❌ Error details:", {
                    message: upsertError.message,
                    details: upsertError.details,
                    hint: upsertError.hint,
                    code: upsertError.code
                });
                throw new Error(`Failed to save profile to database: ${upsertError.message}`);
            }

            console.log("✅ Profile upserted successfully:", upsertData);
            return upsertData as ZaloUserProfile;
        }

        console.log("✅ Profile updated successfully:", updateResult);
        return updateResult as ZaloUserProfile;
    } catch (error) {
        console.error("❌ Database operation failed:", error);
        throw error;
    }
}

export async function getUserProfile(userId: string): Promise<ZaloUserProfile | null> {
    if (!isSupabaseConfigured) {
        console.error("❌ Supabase not configured");
        return null;
    }

    console.log("📡 Fetching user profile for ID:", userId);
    console.log("🔍 Supabase configured:", isSupabaseConfigured);

    try {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();

        if (error) {
            console.error("❌ Supabase fetch error:", error);
            console.error("❌ Error details:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            return null;
        }

        console.log("✅ User profile fetched successfully:", data);
        return data;
    } catch (error) {
        console.error("❌ Exception during fetch:", error);
        return null;
    }
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
        default_address: verified?.default_address, // Include default_address from verified data
    };

    console.log("📱 AutoLogin phone details:", {
        verifiedPhone: verified?.phone,
        zaloPhone: phone,
        finalPhone: profile.phone,
        phoneType: typeof profile.phone,
        phoneLength: profile.phone ? profile.phone.length : 'N/A'
    });

    const upsertData = {
        id: profile.id,
        name: profile.name,
        avatar: profile.avatar,
        phone: profile.phone,
        default_address: profile.default_address,
        updated_at: new Date().toISOString(),
    };

    console.log("📱 Upsert data:", upsertData);

    const { data: upsertResult, error: upsertError } = await supabase.from("users").upsert(
        upsertData,
        { onConflict: "id" }
    );

    if (upsertError) {
        console.error("Failed to upsert user to database:", upsertError);
        throw new Error(`Failed to save user to database: ${upsertError.message}`);
    }

    console.log("User upserted to database successfully:", upsertResult);

    // Store user ID in localStorage for persistence
    localStorage.setItem("zma_user_id", profile.id);
    setLoggedIn(true);

    return profile;
}


