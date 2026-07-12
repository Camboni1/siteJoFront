export type AppointmentStatus =
    | "PENDING"
    | "CONFIRMED"
    | "CANCELLED"
    | "COMPLETED"
    | "NO_SHOW";

export type Appointment = {
    id: string;
    customerId: string | null;
    serviceId: string | null;
    serviceName: string | null;
    customerFirstName: string;
    customerLastName: string;
    customerEmail: string | null;
    customerPhone: string;
    vehicleBrand: string | null;
    vehicleModel: string | null;
    licensePlate: string | null;
    startAt: string;
    endAt: string;
    status: AppointmentStatus;
    message: string | null;
    googleCalendarEventId: string | null;
    whatsappMessageId: string | null;
    createdAt: string;
    updatedAt: string;
};

export type CreateAppointmentRequest = {
    serviceId: string | null;
    customerPhone: string;
    vehicleBrand?: string;
    vehicleModel?: string;
    licensePlate?: string;
    startAt: string;
    endAt: string;
    message?: string;
};

export type AvailabilitySlot = {
    startAt: string;
    endAt: string;
    available: boolean;
};

export type Availability = {
    date: string;
    slots: AvailabilitySlot[];
};
