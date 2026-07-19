import { apiFetch } from "@/lib/api";
import type {
    Customer,
    CustomerRequest,
} from "@/features/customers/types/customer.types";

export function getCustomers(search?: string) {
    const trimmed = search?.trim();
    const query = trimmed
        ? `?search=${encodeURIComponent(trimmed)}`
        : "";

    return apiFetch<Customer[]>(`/api/v1/employee/customers${query}`, {
        method: "GET",
    });
}

export function getCustomer(id: string) {
    return apiFetch<Customer>(`/api/v1/employee/customers/${id}`, {
        method: "GET",
    });
}

export function createCustomer(data: CustomerRequest) {
    return apiFetch<Customer>("/api/v1/employee/customers", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function updateCustomer(id: string, data: CustomerRequest) {
    return apiFetch<Customer>(`/api/v1/employee/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}
