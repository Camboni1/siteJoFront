import { apiFetch } from "@/lib/api";
import type {
    CreateCustomerVehicleRequest,
    CustomerVehicle,
    CustomerVehicleSummary,
    UpdateCustomerVehicleRequest,
} from "@/features/customer-vehicles/types/customer-vehicle.types";

const CUSTOMER_VEHICLES_PATH = "/api/v1/customer-vehicles";

export function getMyCustomerVehicles() {
    return apiFetch<CustomerVehicleSummary[]>(CUSTOMER_VEHICLES_PATH, {
        method: "GET",
    });
}

export function createMyCustomerVehicle(
    request: CreateCustomerVehicleRequest
) {
    return apiFetch<CustomerVehicle>(CUSTOMER_VEHICLES_PATH, {
        method: "POST",
        body: JSON.stringify(request),
    });
}

export function getMyCustomerVehicle(id: string) {
    return apiFetch<CustomerVehicle>(
        `${CUSTOMER_VEHICLES_PATH}/${encodeURIComponent(id)}`,
        {
            method: "GET",
        }
    );
}

export function updateMyCustomerVehicle(
    id: string,
    request: UpdateCustomerVehicleRequest
) {
    return apiFetch<CustomerVehicle>(
        `${CUSTOMER_VEHICLES_PATH}/${encodeURIComponent(id)}`,
        {
            method: "PUT",
            body: JSON.stringify(request),
        }
    );
}

export function deactivateMyCustomerVehicle(id: string) {
    return apiFetch<void>(
        `${CUSTOMER_VEHICLES_PATH}/${encodeURIComponent(id)}`,
        {
            method: "DELETE",
            skipJson: true,
        }
    );
}
