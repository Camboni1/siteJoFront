import { apiFetch } from "@/lib/api";
import type {
    Appointment,
    AppointmentStatus,
    Availability,
    CreateAppointmentRequest,
} from "@/features/appointments/types/appointment.types";

export function createAppointment(data: CreateAppointmentRequest) {
    return apiFetch<Appointment>("/api/v1/appointments", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function getAvailability(date: string, serviceId?: string) {
    const params = new URLSearchParams({ date });

    if (serviceId) {
        params.set("serviceId", serviceId);
    }

    return apiFetch<Availability>(
        `/api/v1/appointments/availability?${params.toString()}`,
        {
            method: "GET",
        }
    );
}

export function getMyAppointments() {
    return apiFetch<Appointment[]>("/api/v1/appointments/me", {
        method: "GET",
    });
}

export function cancelAppointment(id: string) {
    return apiFetch<Appointment>(`/api/v1/appointments/${id}/cancel`, {
        method: "PATCH",
    });
}

export function getAllAppointments() {
    return apiFetch<Appointment[]>("/api/v1/employee/appointments", {
        method: "GET",
    });
}

export function getAppointment(id: string) {
    return apiFetch<Appointment>(`/api/v1/employee/appointments/${id}`, {
        method: "GET",
    });
}

export function updateAppointmentStatus(id: string, status: AppointmentStatus) {
    return apiFetch<Appointment>(`/api/v1/employee/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
}
