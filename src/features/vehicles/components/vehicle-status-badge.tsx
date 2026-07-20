import type { VehicleStatus } from "@/features/vehicles/types/vehicle.types";
import { VEHICLE_STATUS_LABELS } from "@/features/vehicles/lib/vehicle-status";

const STATUS_STYLES: Record<VehicleStatus, string> = {
    DRAFT: "border-slate-400/30 bg-slate-400/8 text-slate-300",
    AVAILABLE: "border-emerald-500/30 bg-emerald-500/8 text-emerald-300",
    RESERVED: "border-amber-500/30 bg-amber-500/8 text-amber-300",
    SOLD: "border-blue-500/30 bg-blue-500/8 text-blue-300",
    ARCHIVED: "border-line bg-surface-soft text-faint",
};

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
        >
            {VEHICLE_STATUS_LABELS[status]}
        </span>
    );
}
