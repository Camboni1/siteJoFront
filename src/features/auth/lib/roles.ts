import type { AuthUser } from "@/features/auth/types/auth.types";

export function isStaff(user: AuthUser | null) {
    return user?.role === "ROLE_EMPLOYEE" || user?.role === "ROLE_ADMIN";
}
