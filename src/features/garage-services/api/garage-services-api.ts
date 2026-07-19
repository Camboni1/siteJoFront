import { apiFetch } from "@/lib/api";
import type {
    GarageService,
    GarageServiceRequest,
} from "@/features/garage-services/types/garage-service.types";

export function getActiveServices() {
    return apiFetch<GarageService[]>("/api/v1/garage-services", {
        method: "GET",
    });
}

export function getService(id: string) {
    return apiFetch<GarageService>(`/api/v1/garage-services/${id}`, {
        method: "GET",
    });
}

export function getAllServices() {
    return apiFetch<GarageService[]>("/api/v1/employee/garage-services", {
        method: "GET",
    });
}

export function createService(data: GarageServiceRequest) {
    return apiFetch<GarageService>("/api/v1/employee/garage-services", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function updateService(id: string, data: GarageServiceRequest) {
    return apiFetch<GarageService>(`/api/v1/employee/garage-services/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export function updateServiceActive(id: string, active: boolean) {
    return apiFetch<GarageService>(
        `/api/v1/employee/garage-services/${id}/active`,
        {
            method: "PATCH",
            body: JSON.stringify({ active }),
        }
    );
}
