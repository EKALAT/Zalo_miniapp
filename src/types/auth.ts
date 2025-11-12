export interface ZaloUserProfile {
    id: string;
    name?: string;
    avatar?: string;
    phone?: string;
    default_address?: string;
    updated_at?: string;
}

export interface UpdateProfileRequest {
    id: string;
    name?: string;
    avatar?: string;
    phone?: string;
    default_address?: string;
}

export interface AuthState {
    user: ZaloUserProfile | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    error?: string;
}

