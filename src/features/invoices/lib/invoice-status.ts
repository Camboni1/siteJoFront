import type { InvoiceStatus } from "@/features/invoices/types/invoice.types";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
    DRAFT: "Brouillon",
    SENT: "Émise",
    RECEIVED: "Reçue",
    PAID: "Payée",
    OVERDUE: "En retard",
    CANCELLED: "Annulée",
    PEPPOL_SENT: "Émise via Peppol",
    PEPPOL_FAILED: "Échec Peppol",
};

export const INVOICE_STATUS_BADGE_CLASSES: Record<InvoiceStatus, string> = {
    DRAFT: "border-neutral-500/30 bg-neutral-500/10 text-neutral-300",
    SENT: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    RECEIVED: "border-violet-500/30 bg-violet-500/10 text-violet-300",
    PAID: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    OVERDUE: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    CANCELLED: "border-red-500/30 bg-red-500/10 text-red-300",
    PEPPOL_SENT: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    PEPPOL_FAILED: "border-orange-500/30 bg-orange-500/10 text-orange-300",
};

// Statuts proposés dans le filtre de la liste employé (flux sortant phase 4B).
export const INVOICE_FILTER_STATUSES: InvoiceStatus[] = [
    "DRAFT",
    "SENT",
    "PAID",
    "OVERDUE",
    "CANCELLED",
];

// Miroir exact de la matrice de transitions d'InvoiceServiceImpl.
export const INVOICE_STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
    DRAFT: ["SENT"],
    SENT: ["PAID", "OVERDUE", "CANCELLED"],
    OVERDUE: ["PAID", "CANCELLED"],
    RECEIVED: [],
    PAID: [],
    CANCELLED: [],
    PEPPOL_SENT: [],
    PEPPOL_FAILED: [],
};

export function isInvoiceStatus(value: string): value is InvoiceStatus {
    return value in INVOICE_STATUS_LABELS;
}
