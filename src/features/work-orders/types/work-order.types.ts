export type WorkOrderStatus =
    | "DRAFT"
    | "PLANNED"
    | "IN_PROGRESS"
    | "WAITING_FOR_PARTS"
    | "READY"
    | "DELIVERED"
    | "CANCELLED";

export type WorkOrderSummary = {
    id: string;
    appointmentId: string | null;
    customerId: string;
    customerName: string;
    customerVehicleId: string;
    vehicleLabel: string;
    assignedEmployeeId: string | null;
    assignedEmployeeName: string | null;
    status: WorkOrderStatus;
    openedAt: string;
    updatedAt: string;
};

export type WorkOrderLine = {
    id: string;
    garageServiceId: string | null;
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    displayOrder: number;
    amountExcludingVat: number;
    vatAmount: number;
    amountIncludingVat: number;
};

export type WorkOrder = {
    id: string;
    appointmentId: string | null;
    customerId: string;
    customerVehicleId: string;
    assignedEmployeeId: string | null;
    status: WorkOrderStatus;
    mileageAtReception: number | null;
    customerComplaint: string | null;
    diagnostic: string | null;
    workPerformed: string | null;
    internalNotes: string | null;
    openedAt: string;
    startedAt: string | null;
    completedAt: string | null;
    deliveredAt: string | null;
    lines: WorkOrderLine[];
    amountExcludingVat: number;
    vatAmount: number;
    amountIncludingVat: number;
    createdAt: string;
    updatedAt: string;
};

export type WorkOrderFilters = {
    status?: WorkOrderStatus;
    customerId?: string;
    customerVehicleId?: string;
    assignedEmployeeId?: string;
    date?: string;
    page?: number;
    size?: number;
};

export type CreateWorkOrderFromAppointmentRequest = {
    assignedEmployeeId: string | null;
    mileageAtReception: number | null;
    internalNotes: string | null;
    initialServiceLineVatRate: number | null;
};

export type UpdateWorkOrderRequest = {
    assignedEmployeeId: string | null;
    mileageAtReception: number | null;
    customerComplaint: string | null;
    diagnostic: string | null;
    workPerformed: string | null;
    internalNotes: string | null;
};

export type WorkOrderLineRequest = {
    garageServiceId: string | null;
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    displayOrder: number;
};
