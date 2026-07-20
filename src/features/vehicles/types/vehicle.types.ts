export type VehicleStatus =
    | "DRAFT"
    | "AVAILABLE"
    | "RESERVED"
    | "SOLD"
    | "ARCHIVED";

export type PublicVehicleImageResponse = {
    url: string;
    altText: string | null;
};

export type PublicVehicleResponse = {
    id: string;
    brand: string;
    model: string;
    version: string | null;
    year: number | null;
    mileage: number | null;
    fuelType: string | null;
    gearbox: string | null;
    color: string | null;
    price: number | null;
    description: string | null;
    highlighted: boolean;
    status: VehicleStatus;
    firstRegistrationDate: string | null;
    images: PublicVehicleImageResponse[];
};

export type VehicleImageResponse = {
    id: string;
    url: string;
    altText: string | null;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
};

export type VehicleResponse = {
    id: string;
    brand: string;
    model: string;
    version: string | null;
    year: number | null;
    mileage: number | null;
    fuelType: string | null;
    gearbox: string | null;
    color: string | null;
    licensePlate: string | null;
    vin: string | null;
    price: number | null;
    description: string | null;
    highlighted: boolean;
    status: VehicleStatus;
    firstRegistrationDate: string | null;
    images: VehicleImageResponse[];
    createdAt: string;
    updatedAt: string;
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

export type CreateVehicleRequest = {
    brand: string;
    model: string;
    version: string | null;
    year: number | null;
    mileage: number | null;
    fuelType: string | null;
    gearbox: string | null;
    color: string | null;
    licensePlate: string | null;
    vin: string | null;
    price: number | null;
    description: string | null;
    highlighted: boolean;
    status: VehicleStatus | null;
    firstRegistrationDate: string | null;
};

export type UpdateVehicleRequest = Omit<CreateVehicleRequest, "status">;

export type UpdateVehicleStatusRequest = {
    status: VehicleStatus;
};

export type VehicleImageRequest = {
    url: string;
    altText: string | null;
    displayOrder: number | null;
};

export type PublicVehicleFilters = {
    brand?: string;
    model?: string;
    year?: number;
    minPrice?: number;
    maxPrice?: number;
    fuelType?: string;
    gearbox?: string;
    page: number;
    size: number;
};
