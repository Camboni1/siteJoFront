import type { VehicleStatus } from "@/features/vehicles/types/vehicle.types";

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
    DRAFT: "Brouillon",
    AVAILABLE: "Disponible",
    RESERVED: "Réservé",
    SOLD: "Vendu",
    ARCHIVED: "Archivé",
};

export const VEHICLE_STATUSES: VehicleStatus[] = [
    "DRAFT",
    "AVAILABLE",
    "RESERVED",
    "SOLD",
    "ARCHIVED",
];
