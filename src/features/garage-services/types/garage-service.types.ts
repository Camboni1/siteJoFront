export type GarageService = {
    id: string;
    name: string;
    description: string | null;
    startingPrice: number | null;
    durationMinutes: number;
    active: boolean;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
};

export type GarageServiceRequest = {
    name: string;
    description: string | null;
    startingPrice: number | null;
    durationMinutes: number;
    active: boolean;
    displayOrder: number;
};
