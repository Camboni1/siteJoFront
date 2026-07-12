import type { AppointmentStatus } from "@/features/appointments/types/appointment.types";

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
    PENDING: "En attente",
    CONFIRMED: "Confirmé",
    CANCELLED: "Annulé",
    COMPLETED: "Terminé",
    NO_SHOW: "Absent",
};

export const APPOINTMENT_STATUS_BADGE_CLASSES: Record<AppointmentStatus, string> = {
    PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    CONFIRMED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    CANCELLED: "border-red-500/30 bg-red-500/10 text-red-300",
    COMPLETED: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    NO_SHOW: "border-neutral-500/30 bg-neutral-500/10 text-neutral-300",
};

export function isCancellable(status: AppointmentStatus) {
    return status === "PENDING" || status === "CONFIRMED";
}
