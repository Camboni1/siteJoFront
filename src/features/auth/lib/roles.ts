import type { AuthUser, UserRole } from "@/features/auth/types/auth.types";

export const ROLE_LABELS: Record<UserRole, string> = {
    ROLE_ADMIN: "Administrateur",
    ROLE_EMPLOYEE: "Employé",
    ROLE_CUSTOMER: "Client",
};

export function isStaff(user: AuthUser | null) {
    return user?.role === "ROLE_EMPLOYEE" || user?.role === "ROLE_ADMIN";
}
