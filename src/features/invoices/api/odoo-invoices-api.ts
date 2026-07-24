import { apiFetch, apiFetchBlob } from "@/lib/api";
import { saveBlob } from "@/lib/download";
import type { OdooInvoiceIntegrationResponse } from "@/features/invoices/types/odoo-invoice.types";

// Client dédié à l'intégration Odoo des factures sortantes.
// L'URL du backend, les cookies (`credentials: "include"`) et la gestion
// d'erreur sont centralisés dans `@/lib/api` et réutilisés tels quels.

function odooBasePath(invoiceId: string) {
    return `/api/v1/employee/invoices/${invoiceId}/odoo`;
}

export function getOdooInvoiceState(invoiceId: string) {
    return apiFetch<OdooInvoiceIntegrationResponse>(odooBasePath(invoiceId), {
        method: "GET",
    });
}

export function synchronizeInvoiceWithOdoo(invoiceId: string) {
    return apiFetch<OdooInvoiceIntegrationResponse>(
        `${odooBasePath(invoiceId)}/sync`,
        { method: "POST" }
    );
}

export function postInvoiceToOdoo(invoiceId: string) {
    return apiFetch<OdooInvoiceIntegrationResponse>(
        `${odooBasePath(invoiceId)}/post`,
        { method: "POST" }
    );
}

export function refreshOdooInvoice(invoiceId: string) {
    return apiFetch<OdooInvoiceIntegrationResponse>(
        `${odooBasePath(invoiceId)}/refresh`,
        { method: "POST" }
    );
}

export async function downloadOdooOfficialPdf(invoiceId: string) {
    // apiFetchBlob vérifie d'abord le statut HTTP et ne traite le corps comme
    // un Blob qu'en cas de réponse OK : on ne risque pas d'interpréter une
    // erreur JSON comme un PDF.
    const { blob, filename } = await apiFetchBlob(`${odooBasePath(invoiceId)}/pdf`);

    saveBlob(blob, filename ?? fallbackPdfName(invoiceId));
}

function fallbackPdfName(invoiceId: string) {
    const safeId = invoiceId.replace(/[^A-Za-z0-9_-]/g, "-");

    return `facture-odoo-${safeId || "sans-numero"}.pdf`;
}
