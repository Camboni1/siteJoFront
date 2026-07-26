import { apiFetch } from "@/lib/api";
import type { PageResponse } from "@/features/invoices/types/invoice.types";
import type { CustomerVehicle } from "@/features/customer-vehicles/types/customer-vehicle.types";
import type {
    CreateWorkOrderFromAppointmentRequest,
    UpdateWorkOrderRequest,
    WorkOrder,
    WorkOrderFilters,
    WorkOrderLineRequest,
    WorkOrderStatus,
    WorkOrderSummary,
} from "@/features/work-orders/types/work-order.types";

const WORK_ORDERS_PATH = "/api/v1/employee/work-orders";

function workOrderQuery(filters: WorkOrderFilters) {
    const search = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
            search.set(key, String(value));
        }
    });

    return search.toString();
}

export function getWorkOrders(filters: WorkOrderFilters) {
    const query = workOrderQuery(filters);
    const suffix = query ? `?${query}` : "";

    return apiFetch<PageResponse<WorkOrderSummary>>(
        `${WORK_ORDERS_PATH}${suffix}`,
        { method: "GET" }
    );
}

export function getWorkOrder(id: string) {
    return apiFetch<WorkOrder>(
        `${WORK_ORDERS_PATH}/${encodeURIComponent(id)}`,
        { method: "GET" }
    );
}

export function createWorkOrderFromAppointment(
    appointmentId: string,
    request: CreateWorkOrderFromAppointmentRequest
) {
    return apiFetch<WorkOrder>(
        `/api/v1/employee/appointments/${encodeURIComponent(appointmentId)}/work-order`,
        {
            method: "POST",
            body: JSON.stringify(request),
        }
    );
}

export function updateWorkOrder(
    id: string,
    request: UpdateWorkOrderRequest
) {
    return apiFetch<WorkOrder>(
        `${WORK_ORDERS_PATH}/${encodeURIComponent(id)}`,
        {
            method: "PUT",
            body: JSON.stringify(request),
        }
    );
}

export function updateWorkOrderStatus(
    id: string,
    status: WorkOrderStatus
) {
    return apiFetch<WorkOrder>(
        `${WORK_ORDERS_PATH}/${encodeURIComponent(id)}/status`,
        {
            method: "PATCH",
            body: JSON.stringify({ status }),
        }
    );
}

export function addWorkOrderLine(
    id: string,
    request: WorkOrderLineRequest
) {
    return apiFetch<WorkOrder>(
        `${WORK_ORDERS_PATH}/${encodeURIComponent(id)}/lines`,
        {
            method: "POST",
            body: JSON.stringify(request),
        }
    );
}

export function updateWorkOrderLine(
    id: string,
    lineId: string,
    request: WorkOrderLineRequest
) {
    return apiFetch<WorkOrder>(
        `${WORK_ORDERS_PATH}/${encodeURIComponent(id)}/lines/${encodeURIComponent(lineId)}`,
        {
            method: "PUT",
            body: JSON.stringify(request),
        }
    );
}

export function deleteWorkOrderLine(id: string, lineId: string) {
    return apiFetch<void>(
        `${WORK_ORDERS_PATH}/${encodeURIComponent(id)}/lines/${encodeURIComponent(lineId)}`,
        {
            method: "DELETE",
            skipJson: true,
        }
    );
}

export function getWorkOrderCustomerVehicle(id: string) {
    return apiFetch<CustomerVehicle>(
        `/api/v1/employee/customer-vehicles/${encodeURIComponent(id)}`,
        { method: "GET" }
    );
}
