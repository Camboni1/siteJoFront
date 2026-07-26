import { isApiError } from "@/lib/api";
import type {
    WorkOrderStatus,
} from "@/features/work-orders/types/work-order.types";

export const WORK_ORDER_STATUSES: WorkOrderStatus[] = [
    "DRAFT",
    "PLANNED",
    "IN_PROGRESS",
    "WAITING_FOR_PARTS",
    "READY",
    "DELIVERED",
    "CANCELLED",
];

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
    DRAFT: "Brouillon",
    PLANNED: "Planifié",
    IN_PROGRESS: "En cours",
    WAITING_FOR_PARTS: "En attente de pièces",
    READY: "Prêt",
    DELIVERED: "Livré",
    CANCELLED: "Annulé",
};

export const WORK_ORDER_STATUS_BADGE_CLASSES: Record<
    WorkOrderStatus,
    string
> = {
    DRAFT: "border-line bg-surface-soft text-muted",
    PLANNED: "border-blue-400/25 bg-blue-400/8 text-blue-300",
    IN_PROGRESS: "border-amber-400/25 bg-amber-400/8 text-amber-200",
    WAITING_FOR_PARTS:
        "border-violet-400/25 bg-violet-400/8 text-violet-300",
    READY: "border-emerald-400/25 bg-emerald-400/8 text-emerald-300",
    DELIVERED: "border-accent/25 bg-accent/8 text-accent",
    CANCELLED: "border-red-400/25 bg-red-400/8 text-red-300",
};

export type WorkOrderTransition = {
    target: WorkOrderStatus;
    label: string;
    destructive?: boolean;
    requiresConfirmation?: boolean;
};

export const WORK_ORDER_TRANSITIONS: Record<
    WorkOrderStatus,
    WorkOrderTransition[]
> = {
    DRAFT: [
        { target: "PLANNED", label: "Planifier" },
        {
            target: "CANCELLED",
            label: "Annuler le dossier",
            destructive: true,
            requiresConfirmation: true,
        },
    ],
    PLANNED: [
        { target: "IN_PROGRESS", label: "Démarrer l’intervention" },
        {
            target: "CANCELLED",
            label: "Annuler le dossier",
            destructive: true,
            requiresConfirmation: true,
        },
    ],
    IN_PROGRESS: [
        {
            target: "WAITING_FOR_PARTS",
            label: "Mettre en attente de pièces",
        },
        { target: "READY", label: "Marquer comme prêt" },
        {
            target: "CANCELLED",
            label: "Annuler le dossier",
            destructive: true,
            requiresConfirmation: true,
        },
    ],
    WAITING_FOR_PARTS: [
        { target: "IN_PROGRESS", label: "Reprendre l’intervention" },
        { target: "READY", label: "Marquer comme prêt" },
        {
            target: "CANCELLED",
            label: "Annuler le dossier",
            destructive: true,
            requiresConfirmation: true,
        },
    ],
    READY: [
        {
            target: "DELIVERED",
            label: "Marquer comme livré",
            requiresConfirmation: true,
        },
    ],
    DELIVERED: [],
    CANCELLED: [],
};

const SAFE_WORK_ORDER_MESSAGES = new Set([
    "Ordre de réparation introuvable",
    "Ligne d'ordre de réparation introuvable",
    "Un ordre de réparation existe déjà pour ce rendez-vous",
    "Le rendez-vous n'est associé à aucun véhicule client",
    "Le rendez-vous n'est associé à aucun client",
    "Le véhicule du rendez-vous n'appartient pas au client",
    "Rendez-vous introuvable",
    "Un ordre livré ou annulé ne peut plus être modifié",
    "Le kilométrage d'entrée ne peut pas être négatif",
    "La description de la ligne est obligatoire",
    "La description de la ligne ne peut pas dépasser 500 caractères",
    "La quantité doit être strictement positive",
    "La quantité doit comporter au maximum 9 chiffres et 3 décimales",
    "Le prix unitaire hors TVA doit être positif ou nul",
    "Le prix unitaire doit comporter au maximum 10 chiffres et 2 décimales",
    "Le taux de TVA doit être positif ou nul",
    "Le taux de TVA ne peut pas dépasser 100,00 %",
    "Le taux de TVA doit comporter au maximum 2 décimales",
    "Le taux de TVA doit comporter au maximum 3 chiffres et 2 décimales",
    "L'ordre d'affichage doit être positif ou nul",
    "Service introuvable",
    "Le rendez-vous ne contient aucun service pour initialiser une ligne",
]);

export function isTerminalWorkOrderStatus(status: WorkOrderStatus) {
    return status === "DELIVERED" || status === "CANCELLED";
}

export function availableWorkOrderTransitions(status: WorkOrderStatus) {
    return WORK_ORDER_TRANSITIONS[status];
}

export function workOrderErrorMessage(error: unknown, fallback: string) {
    if (!isApiError(error)) {
        return fallback;
    }

    if (
        (error.status === 400 ||
            error.status === 404 ||
            error.status === 409) &&
        (SAFE_WORK_ORDER_MESSAGES.has(error.message) ||
            error.message.startsWith("Transition de statut interdite :"))
    ) {
        return error.message;
    }

    return fallback;
}

export function shortIdentifier(id: string) {
    return id.slice(0, 8);
}
