import { apiFetch, apiFetchBlob } from "@/lib/api";
import type {
    CreateInvoiceRequest,
    EmployeeInvoiceFilters,
    InvoiceResponse,
    PageResponse,
    UpdateInvoiceRequest,
    UpdateInvoiceStatusRequest,
} from "@/features/invoices/types/invoice.types";

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

export function getEmployeeInvoices(filters: EmployeeInvoiceFilters) {
    const search = queryString(filters);

    return apiFetch<PageResponse<InvoiceResponse>>(
        `/api/v1/employee/invoices?${search}`,
        { method: "GET" }
    );
}

export function getEmployeeInvoice(id: string) {
    return apiFetch<InvoiceResponse>(`/api/v1/employee/invoices/${id}`, {
        method: "GET",
    });
}

export function createInvoice(data: CreateInvoiceRequest) {
    return apiFetch<InvoiceResponse>("/api/v1/employee/invoices", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function updateInvoice(id: string, data: UpdateInvoiceRequest) {
    return apiFetch<InvoiceResponse>(`/api/v1/employee/invoices/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export function updateInvoiceStatus(
    id: string,
    data: UpdateInvoiceStatusRequest
) {
    return apiFetch<InvoiceResponse>(
        `/api/v1/employee/invoices/${id}/status`,
        { method: "PATCH", body: JSON.stringify(data) }
    );
}

export function getCustomerInvoices(page: number, size: number) {
    const search = queryString({ page, size });

    return apiFetch<PageResponse<InvoiceResponse>>(
        `/api/v1/customers/invoices?${search}`,
        { method: "GET" }
    );
}

export function getCustomerInvoice(id: string) {
    return apiFetch<InvoiceResponse>(`/api/v1/customers/invoices/${id}`, {
        method: "GET",
    });
}

export function downloadEmployeeInvoicePdf(id: string, invoiceNumber: string) {
    return downloadInvoicePdf(
        `/api/v1/employee/invoices/${id}/pdf`,
        invoiceNumber
    );
}

export function downloadCustomerInvoicePdf(id: string, invoiceNumber: string) {
    return downloadInvoicePdf(
        `/api/v1/customers/invoices/${id}/pdf`,
        invoiceNumber
    );
}

async function downloadInvoicePdf(path: string, invoiceNumber: string) {
    const { blob, filename } = await apiFetchBlob(path);

    saveBlob(blob, filename ?? fallbackPdfName(invoiceNumber));
}

// Même règle de nettoyage que le backend pour le nom de secours.
function fallbackPdfName(invoiceNumber: string) {
    const safeNumber = invoiceNumber.replace(/[^A-Za-z0-9_-]/g, "-");

    return `facture-${safeNumber || "sans-numero"}.pdf`;
}

function saveBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);

    try {
        link.click();
    } finally {
        link.remove();
        URL.revokeObjectURL(url);
    }
}
