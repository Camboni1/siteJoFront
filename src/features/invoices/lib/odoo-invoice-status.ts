import type {
    OdooAccountingStatus,
    OdooInvoiceOperation,
    OdooPaymentStatus,
    OdooPeppolStatus,
    OdooSyncStatus,
} from "@/features/invoices/types/odoo-invoice.types";

// Point unique de vérité pour les libellés FR et les variantes de badge.
// Toute condition d'affichage de statut Odoo doit passer par ces tables
// plutôt que d'être dupliquée dans les composants.

const NEUTRAL_BADGE = "border-neutral-500/30 bg-neutral-500/10 text-neutral-300";
const SKY_BADGE = "border-sky-500/30 bg-sky-500/10 text-sky-300";
const AMBER_BADGE = "border-amber-500/30 bg-amber-500/10 text-amber-300";
const EMERALD_BADGE = "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
const RED_BADGE = "border-red-500/30 bg-red-500/10 text-red-300";
const VIOLET_BADGE = "border-violet-500/30 bg-violet-500/10 text-violet-300";

export const ODOO_SYNC_STATUS_LABELS: Record<OdooSyncStatus, string> = {
    NOT_SYNCED: "Non synchronisée",
    IN_PROGRESS: "Synchronisation en cours",
    SYNCED: "Synchronisée",
    FAILED: "Échec de synchronisation",
};

export const ODOO_SYNC_STATUS_BADGE_CLASSES: Record<OdooSyncStatus, string> = {
    NOT_SYNCED: NEUTRAL_BADGE,
    IN_PROGRESS: AMBER_BADGE,
    SYNCED: EMERALD_BADGE,
    FAILED: RED_BADGE,
};

export const ODOO_ACCOUNTING_STATUS_LABELS: Record<
    OdooAccountingStatus,
    string
> = {
    DRAFT: "Brouillon",
    POSTED: "Comptabilisée",
    CANCELLED: "Annulée",
    UNKNOWN: "Inconnu",
};

export const ODOO_ACCOUNTING_STATUS_BADGE_CLASSES: Record<
    OdooAccountingStatus,
    string
> = {
    DRAFT: NEUTRAL_BADGE,
    POSTED: EMERALD_BADGE,
    CANCELLED: RED_BADGE,
    UNKNOWN: NEUTRAL_BADGE,
};

export const ODOO_PAYMENT_STATUS_LABELS: Record<OdooPaymentStatus, string> = {
    NOT_PAID: "Non payée",
    IN_PAYMENT: "Paiement en cours",
    PAID: "Payée",
    PARTIAL: "Partiellement payée",
    REVERSED: "Annulée ou remboursée",
    INVOICING_LEGACY: "Facturation héritée",
    UNKNOWN: "Inconnu",
};

export const ODOO_PAYMENT_STATUS_BADGE_CLASSES: Record<
    OdooPaymentStatus,
    string
> = {
    NOT_PAID: NEUTRAL_BADGE,
    IN_PAYMENT: SKY_BADGE,
    PAID: EMERALD_BADGE,
    PARTIAL: AMBER_BADGE,
    REVERSED: RED_BADGE,
    INVOICING_LEGACY: VIOLET_BADGE,
    UNKNOWN: NEUTRAL_BADGE,
};

export const ODOO_PEPPOL_STATUS_LABELS: Record<OdooPeppolStatus, string> = {
    NOT_SENT: "Non envoyée",
    READY: "Prête",
    TO_SEND: "À envoyer",
    PROCESSING: "Traitement en cours",
    DONE: "Envoyée",
    ERROR: "Erreur",
    UNKNOWN: "Inconnu",
};

export const ODOO_PEPPOL_STATUS_BADGE_CLASSES: Record<
    OdooPeppolStatus,
    string
> = {
    NOT_SENT: NEUTRAL_BADGE,
    READY: SKY_BADGE,
    TO_SEND: SKY_BADGE,
    PROCESSING: AMBER_BADGE,
    DONE: EMERALD_BADGE,
    ERROR: RED_BADGE,
    UNKNOWN: NEUTRAL_BADGE,
};

// Libellés des opérations backend (utilisés pour signaler qu'un traitement
// est déjà en cours côté Odoo).
export const ODOO_OPERATION_LABELS: Record<OdooInvoiceOperation, string> = {
    SYNC: "Synchronisation",
    POST: "Comptabilisation",
    REFRESH: "Actualisation des statuts",
};
