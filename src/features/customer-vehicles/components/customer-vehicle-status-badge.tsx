export function CustomerVehicleStatusBadge({ active }: { active: boolean }) {
    return (
        <span
            className={
                active
                    ? "inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/8 px-2.5 py-1 text-xs font-medium text-emerald-300"
                    : "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-soft px-2.5 py-1 text-xs font-medium text-faint"
            }
        >
            <span
                aria-hidden
                className={
                    active
                        ? "h-1.5 w-1.5 rounded-full bg-emerald-300"
                        : "h-1.5 w-1.5 rounded-full bg-faint"
                }
            />
            {active ? "Actif" : "Désactivé"}
        </span>
    );
}
