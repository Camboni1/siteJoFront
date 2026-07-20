export type InvoiceStatus =
    | "DRAFT"
    | "SENT"
    | "RECEIVED"
    | "PAID"
    | "OVERDUE"
    | "CANCELLED"
    | "PEPPOL_SENT"
    | "PEPPOL_FAILED";

export type InvoiceDirection = "OUTGOING" | "INCOMING";

export type GarageInvoicePartyResponse = {
    legalName: string | null;
    vatNumber: string | null;
    street: string | null;
    postalCode: string | null;
    city: string | null;
    country: string | null;
    email: string | null;
    phone: string | null;
};

export type CustomerInvoicePartyResponse = {
    firstName: string | null;
    lastName: string | null;
    street: string | null;
    postalCode: string | null;
    city: string | null;
    country: string | null;
    vatNumber: string | null;
    email: string | null;
};

export type InvoiceLineResponse = {
    id: string;
    description: string;
    quantity: number;
    unitPriceExcludingVat: number;
    vatRate: number;
    amountExcludingVat: number;
    vatAmount: number;
    amountIncludingVat: number;
    displayOrder: number;
};

export type InvoiceResponse = {
    id: string;
    invoiceNumber: string;
    customerId: string | null;
    direction: InvoiceDirection;
    status: InvoiceStatus;
    invoiceDate: string;
    dueDate: string | null;
    currency: string;
    garage: GarageInvoicePartyResponse;
    customer: CustomerInvoicePartyResponse;
    lines: InvoiceLineResponse[];
    amountExcludingVat: number;
    vatAmount: number;
    amountIncludingVat: number;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
};

export type InvoiceLineRequest = {
    description: string;
    quantity: number;
    unitPriceExcludingVat: number;
    vatRate: number;
    displayOrder: number;
};

export type CreateInvoiceRequest = {
    customerId: string;
    invoiceDate: string;
    dueDate: string;
    currency: string;
    notes: string | null;
    lines: InvoiceLineRequest[];
};

export type UpdateInvoiceRequest = CreateInvoiceRequest;

export type UpdateInvoiceStatusRequest = {
    status: InvoiceStatus;
};

export type EmployeeInvoiceFilters = {
    customerId?: string;
    invoiceNumber?: string;
    status?: InvoiceStatus;
    dateFrom?: string;
    dateTo?: string;
    page: number;
    size: number;
};

export type PageResponse<T> = {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
};
