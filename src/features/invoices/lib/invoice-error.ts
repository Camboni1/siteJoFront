import { isApiError } from "@/lib/api";

const DUPLICATE_MESSAGE =
    "Une facture existe déjà pour cet ordre de réparation";

const SAFE_CREATE_FROM_WORK_ORDER_MESSAGES = new Set([
    "L'ordre de réparation doit être prêt ou livré avant sa facturation",
    "L'ordre de réparation doit contenir au moins une ligne avant sa facturation",
    DUPLICATE_MESSAGE,
    "Ordre de réparation introuvable",
    "La date d'échéance ne peut pas précéder la date d'émission",
    "La devise doit être un code ISO 4217 valide",
    "Les notes ne peuvent pas dépasser 5000 caractères",
]);

export type InvoiceDraftFromWorkOrderError = {
    message: string;
    duplicate: boolean;
};

export function invoiceDraftFromWorkOrderError(
    error: unknown
): InvoiceDraftFromWorkOrderError {
    if (
        isApiError(error) &&
        SAFE_CREATE_FROM_WORK_ORDER_MESSAGES.has(error.message)
    ) {
        return {
            message:
                error.message === DUPLICATE_MESSAGE
                    ? `${DUPLICATE_MESSAGE}.`
                    : error.message,
            duplicate: error.message === DUPLICATE_MESSAGE,
        };
    }

    return {
        message: "Impossible de créer le brouillon de facture.",
        duplicate: false,
    };
}
