import { apiFetch } from "@/lib/api";
import type {
    CreateVehicleRequest,
    PageResponse,
    PublicVehicleFilters,
    PublicVehicleResponse,
    UpdateVehicleRequest,
    UpdateVehicleStatusRequest,
    VehicleImageRequest,
    VehicleImageResponse,
    VehicleResponse,
} from "@/features/vehicles/types/vehicle.types";

function queryString(
    parameters: Record<string, string | number | undefined>
) {
    const search = new URLSearchParams();

    Object.entries(parameters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
            search.set(key, String(value));
        }
    });

    return search.toString();
}

export function getPublicVehicles(filters: PublicVehicleFilters) {
    const search = queryString(filters);

    return apiFetch<PageResponse<PublicVehicleResponse>>(
        `/api/v1/vehicles?${search}`,
        { method: "GET" }
    );
}

export function getPublicVehicle(id: string) {
    return apiFetch<PublicVehicleResponse>(`/api/v1/vehicles/${id}`, {
        method: "GET",
    });
}

export function getEmployeeVehicles(page: number, size: number) {
    const search = queryString({ page, size });

    return apiFetch<PageResponse<VehicleResponse>>(
        `/api/v1/employee/vehicles?${search}`,
        { method: "GET" }
    );
}

export function getEmployeeVehicle(id: string) {
    return apiFetch<VehicleResponse>(`/api/v1/employee/vehicles/${id}`, {
        method: "GET",
    });
}

export function createVehicle(data: CreateVehicleRequest) {
    return apiFetch<VehicleResponse>("/api/v1/employee/vehicles", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function updateVehicle(id: string, data: UpdateVehicleRequest) {
    return apiFetch<VehicleResponse>(`/api/v1/employee/vehicles/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export function updateVehicleStatus(
    id: string,
    data: UpdateVehicleStatusRequest
) {
    return apiFetch<VehicleResponse>(
        `/api/v1/employee/vehicles/${id}/status`,
        { method: "PATCH", body: JSON.stringify(data) }
    );
}

export function addVehicleImage(vehicleId: string, data: VehicleImageRequest) {
    return apiFetch<VehicleImageResponse>(
        `/api/v1/employee/vehicles/${vehicleId}/images`,
        { method: "POST", body: JSON.stringify(data) }
    );
}

export function updateVehicleImage(
    vehicleId: string,
    imageId: string,
    data: VehicleImageRequest
) {
    return apiFetch<VehicleImageResponse>(
        `/api/v1/employee/vehicles/${vehicleId}/images/${imageId}`,
        { method: "PUT", body: JSON.stringify(data) }
    );
}

export function deleteVehicleImage(vehicleId: string, imageId: string) {
    return apiFetch<void>(
        `/api/v1/employee/vehicles/${vehicleId}/images/${imageId}`,
        { method: "DELETE", skipJson: true }
    );
}
