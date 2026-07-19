export function ServiceActiveBadge({ active }: { active: boolean }) {
    return (
        <span
            className={
                active
                    ? "inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/8 px-3 py-1 text-xs font-medium text-emerald-300"
                    : "inline-flex items-center gap-2 rounded-full border border-line bg-surface-soft px-3 py-1 text-xs font-medium text-muted"
            }
        >
            <span
                className={
                    active
                        ? "h-1.5 w-1.5 rounded-full bg-emerald-400"
                        : "h-1.5 w-1.5 rounded-full bg-faint"
                }
            />
            {active ? "Active" : "Inactive"}
        </span>
    );
}
