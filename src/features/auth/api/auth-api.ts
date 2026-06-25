import { apiFetch } from "@/lib/api";
import type {
    AuthUser,
    LoginRequest,
    RegisterRequest,
} from "@/features/auth/types/auth.types";

export function register(data: RegisterRequest) {
    return apiFetch<AuthUser>("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function login(data: LoginRequest) {
    return apiFetch<AuthUser>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function logout() {
    return apiFetch<void>("/api/v1/auth/logout", {
        method: "POST",
        skipJson: true,
    });
}

export function getMe() {
    return apiFetch<AuthUser>("/api/v1/auth/me", {
        method: "GET",
    });
}