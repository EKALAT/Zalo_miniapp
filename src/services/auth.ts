import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getUserInfo, getPhoneNumber, login } from "zmp-sdk";
import { useEffect, useState } from "react";
import { ZaloUserProfile } from "@/types/auth";

export type { ZaloUserProfile, UpdateProfileRequest } from "@/types/auth";

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

    // Prepare update data - DO NOT overwrite with null unless explicitly provided
    const updateData: any = {
        id: profile.id,
        updated_at: new Date().toISOString(),
    };

    if (Object.prototype.hasOwnProperty.call(profile, 'name')) {
        updateData.name = profile.name ? profile.name.trim() : null;
    }
    if (Object.prototype.hasOwnProperty.call(profile, 'avatar')) {
        updateData.avatar = profile.avatar ? profile.avatar.trim() : null;
    }
    if (Object.prototype.hasOwnProperty.call(profile, 'default_address')) {
        updateData.default_address = profile.default_address ? profile.default_address.trim() : null;
    }
    if (Object.prototype.hasOwnProperty.call(profile, 'phone')) {
        updateData.phone = profile.phone ? profile.phone.trim() : null;
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
        // 0) Try RPC (if available) to avoid RLS quirks; ignore if function not defined
        try {
            const { data: rpcData, error: rpcError } = await supabase.rpc('save_user_profile', {
                _id: profile.id,
                _name: typeof updateData.name !== 'undefined' ? updateData.name : null,
                _phone: typeof updateData.phone !== 'undefined' ? updateData.phone : null,
                _default_address: typeof updateData.default_address !== 'undefined' ? updateData.default_address : null,
            });
            if (!rpcError && rpcData) {
                console.log("✅ Profile saved via RPC save_user_profile");
                return rpcData as ZaloUserProfile;
            }
            if (rpcError) {
                // If function not found or not permitted, fall through to normal path
                console.warn('RPC save_user_profile failed/absent, falling back:', rpcError.message);
            }
        } catch (e) {
            console.warn('RPC save_user_profile unreachable, falling back to direct upsert.');
        }

        // First try to update existing record (only provided fields)
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

// Focused helper: save phone and default_address reliably
export async function saveUserContact(
    userId: string,
    phone?: string,
    defaultAddress?: string
): Promise<ZaloUserProfile> {
    if (!isSupabaseConfigured) {
        throw new Error("Supabase not configured");
    }
    if (!userId) throw new Error("User ID is required");

    const payload = {
        id: userId,
        phone: typeof phone === 'string' ? phone.trim() || null : null,
        default_address: typeof defaultAddress === 'string' ? defaultAddress.trim() || null : null,
        updated_at: new Date().toISOString(),
    } as Record<string, unknown>;

    // Always include phone/default_address in payload to force DB update
    // This ensures that non-empty values get persisted instead of being skipped

    const { data, error } = await supabase
        .from("users")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to save contact: ${error.message}`);
    }
    return data as ZaloUserProfile;
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
    try {
        localStorage.removeItem("zma_user_id");
    } catch { }
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("user-updated"));
    }
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

    const ui = await getUserInfo({ avatarType: "normal", autoRequestPermission: true });
    let phone: string | undefined;
    try {
        const pn = await getPhoneNumber();
        phone = (pn as any)?.number || (pn as any)?.phoneNumber || (pn as any)?.phone || undefined;
        if (typeof phone === 'string') phone = phone.trim() || undefined;
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

    // Merge data with strong fallbacks (never undefined strings)
    // Try multiple SDK field names across versions
    const uiName = ((ui as any)?.userInfo?.name || (ui as any)?.userInfo?.displayName || '').trim();
    const uiAvatar = ((ui as any)?.userInfo?.avatar || (ui as any)?.userInfo?.avatarUrl || (ui as any)?.userInfo?.picture || '').trim();
    const baseName = uiName || undefined;
    const baseAvatar = uiAvatar || undefined;
    // Do not persist placeholder label to DB; keep undefined if SDK doesn't provide
    const mergedName = ((verified?.name || '').trim()) || baseName || undefined;
    const mergedAvatar = ((verified?.avatar || '').trim()) || baseAvatar || undefined;
    const mergedPhone = ((verified?.phone || '').trim()) || phone;
    const mergedAddress = (verified?.default_address || '').trim() || undefined;

    const profile: ZaloUserProfile = {
        id: ui.userInfo.id,
        name: mergedName,
        avatar: mergedAvatar,
        phone: mergedPhone,
        default_address: mergedAddress,
    };

    console.log("📱 AutoLogin phone details:", {
        verifiedPhone: verified?.phone,
        zaloPhone: phone,
        finalPhone: profile.phone,
        phoneType: typeof profile.phone,
        phoneLength: profile.phone ? profile.phone.length : 'N/A'
    });

    // Only include fields that are actually provided to avoid wiping existing DB values with null
    const upsertData: Record<string, unknown> = {
        id: profile.id,
        updated_at: new Date().toISOString(),
    };
    if (typeof profile.name !== 'undefined') upsertData.name = profile.name || null;
    if (typeof profile.avatar !== 'undefined') upsertData.avatar = profile.avatar || null;
    if (typeof profile.phone !== 'undefined') upsertData.phone = profile.phone || null;
    if (typeof profile.default_address !== 'undefined') upsertData.default_address = profile.default_address || null;

    console.log("📱 Upsert data (omit undefined):", upsertData);

    const { data: upsertResult, error: upsertError } = await supabase
        .from("users")
        .upsert(upsertData, { onConflict: "id" })
        .select()
        .single();

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


