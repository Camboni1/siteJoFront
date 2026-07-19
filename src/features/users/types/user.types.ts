import type { UserRole } from "@/features/auth/types/auth.types";

export type AdminUser = {
    id: string;
    createdAt: string;
    updatedAt: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    enabled: boolean;
};

export type CreateUserRequest = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: UserRole;
    enabled: boolean;
};

export type UpdateUserRequest = {
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    enabled: boolean;
};
