import type { AppointmentStatus } from "@/features/appointments/types/appointment.types";
import {
    APPOINTMENT_STATUS_BADGE_CLASSES,
    APPOINTMENT_STATUS_LABELS,
} from "@/features/appointments/lib/appointment-status";

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${APPOINTMENT_STATUS_BADGE_CLASSES[status]}`}
        >
            {APPOINTMENT_STATUS_LABELS[status]}
        </span>
    );
}
