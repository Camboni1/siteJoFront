import type { AppointmentStatus } from "@/features/appointments/types/appointment.types";
import {
    APPOINTMENT_STATUS_BADGE_CLASSES,
    APPOINTMENT_STATUS_LABELS,
} from "@/features/appointments/lib/appointment-status";

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${APPOINTMENT_STATUS_BADGE_CLASSES[status]}`}
        >
            <span className="h-1 w-1 rounded-full bg-current" aria-hidden />
            {APPOINTMENT_STATUS_LABELS[status]}
        </span>
    );
}
