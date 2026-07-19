import { apiFetch } from "@/lib/api";
import type {
    AdminUser,
    CreateUserRequest,
    UpdateUserRequest,
} from "@/features/users/types/user.types";

export function getUsers() {
    return apiFetch<AdminUser[]>("/api/v1/admin/users", {
        method: "GET",
    });
}

export function getUser(id: string) {
    return apiFetch<AdminUser>(`/api/v1/admin/users/${id}`, {
        method: "GET",
    });
}

export function createUser(data: CreateUserRequest) {
    return apiFetch<AdminUser>("/api/v1/admin/users", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function updateUser(id: string, data: UpdateUserRequest) {
    return apiFetch<AdminUser>(`/api/v1/admin/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export function updateUserEnabled(id: string, enabled: boolean) {
    return apiFetch<AdminUser>(`/api/v1/admin/users/${id}/enabled`, {
        method: "PATCH",
        body: JSON.stringify({ enabled }),
    });
}

export function updateUserPassword(id: string, password: string) {
    return apiFetch<AdminUser>(`/api/v1/admin/users/${id}/password`, {
        method: "PATCH",
        body: JSON.stringify({ password }),
    });
}
