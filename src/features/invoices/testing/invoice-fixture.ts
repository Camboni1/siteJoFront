import type { InvoiceResponse } from "@/features/invoices/types/invoice.types";

export function invoiceFixture(
    overrides: Partial<InvoiceResponse> = {}
): InvoiceResponse {
    return {
        id: "invoice-1",
        invoiceNumber: "FAC-2026-0001",
        customerId: "customer-1",
        workOrderId: null,
        direction: "OUTGOING",
        status: "DRAFT",
        invoiceDate: "2026-07-26",
        dueDate: "2026-07-26",
        currency: "EUR",
        garage: {
            legalName: "CamboGarage",
            vatNumber: "BE0123456789",
            street: "1 rue du Garage",
            postalCode: "7000",
            city: "Mons",
            country: "BE",
            email: "garage@example.invalid",
            phone: "+32000000000",
        },
        customer: {
            firstName: "Marie",
            lastName: "Dupont",
            street: "2 rue du Client",
            postalCode: "7000",
            city: "Mons",
            country: "BE",
            vatNumber: null,
            email: "marie@example.invalid",
        },
        lines: [
            {
                id: "invoice-line-1",
                description: "Diagnostic",
                quantity: 1,
                unitPriceExcludingVat: 100,
                vatRate: 21,
                amountExcludingVat: 100,
                vatAmount: 21,
                amountIncludingVat: 121,
                displayOrder: 0,
            },
        ],
        amountExcludingVat: 100,
        vatAmount: 21,
        amountIncludingVat: 121,
        notes: null,
        createdAt: "2026-07-26T10:00:00Z",
        updatedAt: "2026-07-26T10:00:00Z",
        ...overrides,
    };
}
