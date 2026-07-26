import { isApiError } from "@/lib/api";
import type {
    FuelType,
} from "@/features/customer-vehicles/types/customer-vehicle.types";

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
    PETROL: "Essence",
    DIESEL: "Diesel",
    HYBRID: "Hybride",
    PLUG_IN_HYBRID: "Hybride rechargeable",
    ELECTRIC: "Électrique",
    LPG: "LPG",
    OTHER: "Autre",
};

export const FUEL_TYPES = Object.keys(FUEL_TYPE_LABELS) as FuelType[];

const SAFE_BUSINESS_MESSAGES = new Set([
    "Un véhicule avec ce VIN existe déjà",
    "Un véhicule actif avec cette plaque existe déjà",
    "Le VIN doit comporter exactement 17 caractères",
    "Le VIN ne peut pas dépasser 17 caractères",
    "Le kilométrage ne peut pas être négatif",
    "La marque est obligatoire",
    "Le modèle est obligatoire",
    "La marque ne peut pas dépasser 100 caractères",
    "Le modèle ne peut pas dépasser 100 caractères",
    "La plaque ne peut pas dépasser 30 caractères",
    "L'état actif est obligatoire",
    "Véhicule client introuvable",
]);

export const CUSTOMER_VEHICLE_SAVE_ERROR =
    "Impossible d’enregistrer le véhicule pour le moment.";

export function customerVehicleErrorMessage(
    error: unknown,
    fallback = CUSTOMER_VEHICLE_SAVE_ERROR
) {
    if (
        isApiError(error) &&
        (error.status === 400 ||
            error.status === 404 ||
            error.status === 409) &&
        SAFE_BUSINESS_MESSAGES.has(error.message)
    ) {
        return error.message;
    }

    return fallback;
}

export function customerVehicleLabel(
    vehicle: Pick<
        import("@/features/customer-vehicles/types/customer-vehicle.types").CustomerVehicleSummary,
        "brand" | "model" | "licensePlate"
    >
) {
    return `${vehicle.brand} ${vehicle.model} — ${
        vehicle.licensePlate ?? "plaque non renseignée"
    }`;
}
