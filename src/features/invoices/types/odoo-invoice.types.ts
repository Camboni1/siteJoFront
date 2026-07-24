// Contrat d'intégration Odoo des factures sortantes.
// Miroir de OdooInvoiceIntegrationResponse (backend Spring Boot). Les champs
// sérialisés depuis des types nullables Java (Long, BigDecimal, Instant, UUID,
// String) arrivent en `null` via Jackson : on les type donc `| null`.

export type OdooSyncStatus =
    | "NOT_SYNCED"
    | "IN_PROGRESS"
    | "SYNCED"
    | "FAILED";

export type OdooAccountingStatus =
    | "DRAFT"
    | "POSTED"
    | "CANCELLED"
    | "UNKNOWN";

export type OdooPaymentStatus =
    | "NOT_PAID"
    | "IN_PAYMENT"
    | "PAID"
    | "PARTIAL"
    | "REVERSED"
    | "INVOICING_LEGACY"
    | "UNKNOWN";

export type OdooPeppolStatus =
    | "NOT_SENT"
    | "READY"
    | "TO_SEND"
    | "PROCESSING"
    | "DONE"
    | "ERROR"
    | "UNKNOWN";

// L'opération peut être absente lorsqu'aucun traitement n'est en cours.
export type OdooInvoiceOperation = "SYNC" | "POST" | "REFRESH";

export interface OdooInvoiceIntegrationResponse {
    invoiceId: string;
    odooPartnerId: number | null;
    odooInvoiceId: number | null;

    syncStatus: OdooSyncStatus;
    accountingStatus: OdooAccountingStatus;
    paymentStatus: OdooPaymentStatus;
    peppolStatus: OdooPeppolStatus;

    accountingNumber: string | null;
    currencyCode: string | null;

    amountUntaxed: number | null;
    amountTax: number | null;
    amountTotal: number | null;

    lastRequestId: string | null;
    lastAttemptAt: string | null;
    lastSuccessfulSyncAt: string | null;

    lastErrorCode: string | null;
    lastErrorMessage: string | null;

    activeOperation: OdooInvoiceOperation | null;
    operationStartedAt: string | null;

    canPost: boolean;
    canDownloadOfficialPdf: boolean;
}
