export type FuelType =
    | "PETROL"
    | "DIESEL"
    | "HYBRID"
    | "PLUG_IN_HYBRID"
    | "ELECTRIC"
    | "LPG"
    | "OTHER";

export type CustomerVehicleSummary = {
    id: string;
    brand: string;
    model: string;
    licensePlate: string | null;
    active: boolean;
};

export type CustomerVehicle = {
    id: string;
    customerId: string;
    brand: string;
    model: string;
    licensePlate: string | null;
    normalizedLicensePlate: string | null;
    vin: string | null;
    firstRegistrationDate: string | null;
    fuelType: FuelType | null;
    currentMileage: number | null;
    notes: string | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
};

export type CreateCustomerVehicleRequest = {
    brand: string;
    model: string;
    licensePlate?: string;
    vin?: string;
    firstRegistrationDate?: string;
    fuelType?: FuelType;
    currentMileage?: number;
    notes?: string;
};

export type UpdateCustomerVehicleRequest = CreateCustomerVehicleRequest & {
    active: boolean;
};
