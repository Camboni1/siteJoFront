import type { UserRole } from "@/features/auth/types/auth.types";
import { ROLE_LABELS } from "@/features/auth/lib/roles";

const ROLE_BADGE_CLASSES: Record<UserRole, string> = {
    ROLE_ADMIN:
        "inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/8 px-3 py-1 text-xs font-medium text-accent",
    ROLE_EMPLOYEE:
        "inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/8 px-3 py-1 text-xs font-medium text-sky-300",
    ROLE_CUSTOMER:
        "inline-flex items-center gap-2 rounded-full border border-line bg-surface-soft px-3 py-1 text-xs font-medium text-muted",
};

export function UserRoleBadge({ role }: { role: UserRole }) {
    return <span className={ROLE_BADGE_CLASSES[role]}>{ROLE_LABELS[role]}</span>;
}

export function UserEnabledBadge({ enabled }: { enabled: boolean }) {
    return (
        <span
            className={
                enabled
                    ? "inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/8 px-3 py-1 text-xs font-medium text-emerald-300"
                    : "inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/8 px-3 py-1 text-xs font-medium text-red-300"
            }
        >
            <span
                className={
                    enabled
                        ? "h-1.5 w-1.5 rounded-full bg-emerald-400"
                        : "h-1.5 w-1.5 rounded-full bg-red-400"
                }
            />
            {enabled ? "Actif" : "Désactivé"}
        </span>
    );
}
