"use client";

import { useEffect, useState, type ReactNode } from "react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { useOdooInvoiceIntegration } from "@/features/invoices/hooks/use-odoo-invoice-integration";
import { OdooStatusBadge } from "@/features/invoices/components/odoo-status-badge";
import {
    ODOO_ACCOUNTING_STATUS_BADGE_CLASSES,
    ODOO_ACCOUNTING_STATUS_LABELS,
    ODOO_OPERATION_LABELS,
    ODOO_PAYMENT_STATUS_BADGE_CLASSES,
    ODOO_PAYMENT_STATUS_LABELS,
    ODOO_PEPPOL_STATUS_BADGE_CLASSES,
    ODOO_PEPPOL_STATUS_LABELS,
    ODOO_SYNC_STATUS_BADGE_CLASSES,
    ODOO_SYNC_STATUS_LABELS,
} from "@/features/invoices/lib/odoo-invoice-status";
import type { OdooErrorInfo } from "@/features/invoices/lib/odoo-error";
import type { OdooInvoiceIntegrationResponse } from "@/features/invoices/types/odoo-invoice.types";
import type { OdooPeppolReadiness } from "@/features/invoices/types/odoo-invoice.types";
import { getPeppolReadiness } from "@/features/invoices/api/odoo-invoices-api";

type OdooIntegrationPanelProps = {
    invoiceId: string;
    /**
     * Réservé au personnel (ROLE_ADMIN / ROLE_EMPLOYEE). Un client ordinaire
     * ne voit ni les informations techniques ni les actions Odoo. La sécurité
     * réelle reste garantie côté backend : ce masquage n'est pas une protection.
     */
    canManage: boolean;
};

export function OdooIntegrationPanel({
    invoiceId,
    canManage,
}: OdooIntegrationPanelProps) {
    // Garde de rôle avant tout appel réseau : un client ordinaire ne déclenche
    // aucune requête Odoo depuis l'interface (le hook n'est monté que pour le
    // personnel). La sécurité réelle reste assurée côté backend.
    if (!canManage) {
        return null;
    }

    return <OdooIntegrationPanelContent invoiceId={invoiceId} />;
}

function OdooIntegrationPanelContent({ invoiceId }: { invoiceId: string }) {
    const {
        state,
        initialLoading,
        loadError,
        pending,
        actionError,
        actionMessage,
        reload,
        sync,
        post,
        refresh,
        downloadPdf,
    } = useOdooInvoiceIntegration(invoiceId);

    return (
        <section className="card" aria-labelledby="odoo-panel-title">
            <p className="eyebrow">Intégration</p>
            <h2
                id="odoo-panel-title"
                className="mt-2 text-lg font-semibold tracking-tight"
            >
                Odoo
            </h2>

            {initialLoading ? (
                <p className="mt-4 text-sm text-muted">
                    Chargement de l&apos;état d&apos;intégration Odoo...
                </p>
            ) : loadError ? (
                <div className="mt-4 space-y-3">
                    <div className="alert-error" role="alert">
                        {loadError.message}
                    </div>
                    <RequestIdHint requestId={loadError.requestId} />
                    <button
                        type="button"
                        className="btn-ghost"
                        onClick={reload}
                    >
                        Réessayer
                    </button>
                </div>
            ) : state ? (
                <OdooPanelBody
                    invoiceId={invoiceId}
                    state={state}
                    pending={pending}
                    actionError={actionError}
                    actionMessage={actionMessage}
                    onSync={sync}
                    onPost={post}
                    onRefresh={refresh}
                    onDownloadPdf={downloadPdf}
                />
            ) : (
                <p className="mt-4 text-sm text-muted">
                    Aucun état d&apos;intégration Odoo disponible.
                </p>
            )}
        </section>
    );
}

type OdooPanelBodyProps = {
    invoiceId: string;
    state: OdooInvoiceIntegrationResponse;
    pending: "sync" | "post" | "refresh" | "download" | null;
    actionError: OdooErrorInfo | null;
    actionMessage: string | null;
    onSync: () => void;
    onPost: () => void;
    onRefresh: () => void;
    onDownloadPdf: () => void;
};

function OdooPanelBody({
    invoiceId,
    state,
    pending,
    actionError,
    actionMessage,
    onSync,
    onPost,
    onRefresh,
    onDownloadPdf,
}: OdooPanelBodyProps) {
    const [peppolReadiness, setPeppolReadiness] =
        useState<OdooPeppolReadiness | null>(null);
    const [peppolLoadError, setPeppolLoadError] = useState(false);
    useEffect(() => {
        let current = true;
        Promise.resolve(getPeppolReadiness(invoiceId))
            .then((readiness) => {
                if (current && readiness) {
                    setPeppolReadiness(readiness);
                    setPeppolLoadError(false);
                }
            })
            .catch(() => {
                if (current) {
                    setPeppolReadiness(null);
                    setPeppolLoadError(true);
                }
            });
        return () => {
            current = false;
        };
    }, [invoiceId]);
    const currency = state.currencyCode ?? "EUR";
    const activeOperation = state.activeOperation;
    const busy = pending !== null;
    const operationActive = activeOperation !== null;
    const mutationsDisabled = busy || operationActive;
    // Liaison Odoo établie = facture Odoo créée ET au moins une synchro réussie.
    // Source de vérité pour distinguer « jamais synchronisée » d'une facture déjà
    // liée dont la dernière tentative a éventuellement échoué (cf. correctif backend).
    const hasOdooLink =
        state.odooInvoiceId !== null && state.lastSuccessfulSyncAt !== null;
    const isPosted = state.accountingStatus === "POSTED";
    const notSyncedYet = !hasOdooLink && state.syncStatus === "NOT_SYNCED";

    return (
        <div className="mt-4 space-y-6">
            {activeOperation && (
                <div
                    className="rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm text-amber-300"
                    role="status"
                >
                    Une opération «&nbsp;
                    {ODOO_OPERATION_LABELS[activeOperation]}&nbsp;» est déjà en
                    cours côté Odoo. Les actions sont momentanément
                    indisponibles.
                    {state.operationStartedAt && (
                        <span className="mt-1 block text-xs text-amber-300/80">
                            Démarrée le{" "}
                            {formatDateTime(state.operationStartedAt)}
                        </span>
                    )}
                </div>
            )}

            {notSyncedYet && !operationActive && (
                <p className="text-sm text-muted">
                    Cette facture n&apos;est pas encore synchronisée avec Odoo.
                </p>
            )}

            {isPosted && hasOdooLink && !operationActive && (
                <p
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-300"
                    role="status"
                >
                    Cette facture est déjà comptabilisée dans Odoo
                    {state.accountingNumber
                        ? ` (n° ${state.accountingNumber})`
                        : ""}
                    . Une resynchronisation n&apos;est en général pas nécessaire ;
                    utilisez «&nbsp;Actualiser les statuts&nbsp;» ou téléchargez le
                    PDF officiel.
                </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
                <StatusItem label="Synchronisation">
                    <OdooStatusBadge
                        label={ODOO_SYNC_STATUS_LABELS[state.syncStatus]}
                        className={
                            ODOO_SYNC_STATUS_BADGE_CLASSES[state.syncStatus]
                        }
                    />
                </StatusItem>
                <StatusItem label="Comptabilité">
                    <OdooStatusBadge
                        label={
                            ODOO_ACCOUNTING_STATUS_LABELS[state.accountingStatus]
                        }
                        className={
                            ODOO_ACCOUNTING_STATUS_BADGE_CLASSES[
                                state.accountingStatus
                            ]
                        }
                    />
                </StatusItem>
                <StatusItem label="Paiement">
                    <OdooStatusBadge
                        label={ODOO_PAYMENT_STATUS_LABELS[state.paymentStatus]}
                        className={
                            ODOO_PAYMENT_STATUS_BADGE_CLASSES[
                                state.paymentStatus
                            ]
                        }
                    />
                </StatusItem>
                <StatusItem label="Peppol (lecture seule)">
                    <OdooStatusBadge
                        label={ODOO_PEPPOL_STATUS_LABELS[state.peppolStatus]}
                        className={
                            ODOO_PEPPOL_STATUS_BADGE_CLASSES[state.peppolStatus]
                        }
                    />
                </StatusItem>
            </div>

            <section
                className="rounded-xl border border-line bg-surface-muted p-4"
                aria-labelledby="peppol-readiness-title"
            >
                <h3 id="peppol-readiness-title" className="font-semibold">
                    Peppol — environnement de test
                </h3>
                {peppolLoadError ? (
                    <p className="mt-2 text-sm text-amber-300" role="status">
                        État de préparation Peppol temporairement indisponible.
                        Les informations Odoo et le PDF officiel restent
                        disponibles.
                    </p>
                ) : !peppolReadiness ? (
                    <p className="mt-2 text-sm text-muted">
                        Préparation Peppol indisponible.
                    </p>
                ) : (
                    <div className="mt-3 space-y-3 text-sm">
                        <p>
                            Environnement :{" "}
                            <strong>
                                {peppolReadiness.environment === "sandbox"
                                    ? "Test"
                                    : "Interdit"}
                            </strong>
                        </p>
                        <p className="text-amber-300">
                            Envoi Peppol non disponible dans cet environnement
                            de test
                        </p>
                        <p>
                            Société :{" "}
                            {peppolReadiness.companyReady ? "prête" : "non prête"}
                            {" · "}Client :{" "}
                            {peppolReadiness.customerReady ? "prêt" : "non prêt"}
                            {" · "}Document :{" "}
                            {peppolReadiness.documentReady ? "prêt" : "non prêt"}
                        </p>
                        {peppolReadiness.blockingReasons.length > 0 && (
                            <ul className="list-disc space-y-1 pl-5 text-muted">
                                {peppolReadiness.blockingReasons.map((reason) => (
                                    <li key={reason}>{peppolReason(reason)}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </section>

            <div className="grid gap-3 border-t border-line pt-6 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem
                    label="Partenaire Odoo"
                    value={idOrDash(state.odooPartnerId)}
                    mono
                />
                <DetailItem
                    label="Facture Odoo"
                    value={idOrDash(state.odooInvoiceId)}
                    mono
                />
                <DetailItem
                    label="Numéro comptable"
                    value={state.accountingNumber ?? "—"}
                    mono
                />
                <DetailItem
                    label="Montant HTVA"
                    value={amountOrDash(state.amountUntaxed, currency)}
                />
                <DetailItem
                    label="TVA"
                    value={amountOrDash(state.amountTax, currency)}
                />
                <DetailItem
                    label="Montant total"
                    value={amountOrDash(state.amountTotal, currency)}
                />
                <DetailItem label="Devise" value={currency} mono />
                <DetailItem
                    label="Dernière tentative"
                    value={dateOrDash(state.lastAttemptAt)}
                    mono
                />
                <DetailItem
                    label="Dernière synchro réussie"
                    value={dateOrDash(state.lastSuccessfulSyncAt)}
                    mono
                />
                <DetailItem
                    label="Opération active"
                    value={
                        state.activeOperation
                            ? ODOO_OPERATION_LABELS[state.activeOperation]
                            : "Aucune"
                    }
                />
            </div>

            {(state.lastErrorMessage || state.lastErrorCode) && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3 text-sm text-red-300">
                    <p className="section-title text-red-300/80">
                        Dernière erreur
                    </p>
                    <p className="mt-2">
                        {state.lastErrorMessage ??
                            "Une erreur est survenue lors de la dernière opération."}
                    </p>
                    {state.lastErrorCode && (
                        <p className="mt-1 font-mono text-xs text-red-300/70">
                            Code : {state.lastErrorCode}
                        </p>
                    )}
                </div>
            )}

            <RequestIdHint requestId={state.lastRequestId} />

            {actionMessage && (
                <div className="alert-success" role="status">
                    {actionMessage}
                </div>
            )}

            {actionError && (
                <div className="space-y-2">
                    <div className="alert-error" role="alert">
                        {actionError.message}
                    </div>
                    {hasOdooLink && (
                        <p className="text-xs text-muted">
                            Les informations déjà synchronisées avec Odoo sont
                            conservées. Vous pouvez réessayer une fois Odoo de
                            nouveau disponible.
                        </p>
                    )}
                    <RequestIdHint requestId={actionError.requestId} />
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
                <button
                    type="button"
                    // Action principale seulement pour la toute première synchro.
                    // Sur une facture déjà liée (surtout comptabilisée), la
                    // resynchronisation devient une action discrète.
                    className={hasOdooLink ? "btn-ghost" : "btn-primary"}
                    onClick={onSync}
                    disabled={mutationsDisabled}
                >
                    {pending === "sync"
                        ? hasOdooLink
                            ? "Resynchronisation..."
                            : "Synchronisation..."
                        : hasOdooLink
                          ? "Resynchroniser"
                          : "Synchroniser avec Odoo"}
                </button>

                {state.canPost && (
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={onPost}
                        disabled={mutationsDisabled}
                    >
                        {pending === "post"
                            ? "Comptabilisation..."
                            : "Comptabiliser"}
                    </button>
                )}

                <button
                    type="button"
                    className="btn-ghost"
                    onClick={onRefresh}
                    disabled={mutationsDisabled}
                >
                    {pending === "refresh"
                        ? "Actualisation..."
                        : "Actualiser les statuts"}
                </button>

                {state.canDownloadOfficialPdf && (
                    <button
                        type="button"
                        className="btn-ghost"
                        onClick={onDownloadPdf}
                        disabled={busy}
                    >
                        {pending === "download"
                            ? "Téléchargement..."
                            : "Télécharger le PDF officiel"}
                    </button>
                )}
            </div>
        </div>
    );
}

function StatusItem({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="surface-muted">
            <p className="section-title">{label}</p>
            <div className="mt-2">{children}</div>
        </div>
    );
}

function DetailItem({
    label,
    value,
    mono,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="surface-muted">
            <p className="section-title">{label}</p>
            <p
                className={`mt-2 text-sm font-medium ${
                    mono ? "font-mono" : ""
                }`}
            >
                {value}
            </p>
        </div>
    );
}

function RequestIdHint({ requestId }: { requestId: string | null }) {
    if (!requestId) {
        return null;
    }

    return (
        <p className="font-mono text-xs text-faint">
            Référence support : {requestId}
        </p>
    );
}

function idOrDash(value: number | null) {
    return value === null ? "—" : String(value);
}

function amountOrDash(value: number | null, currency: string) {
    return value === null ? "—" : formatCurrency(value, currency);
}

function dateOrDash(isoDate: string | null) {
    return isoDate ? formatDateTime(isoDate) : "—";
}

function peppolReason(code: string) {
    const labels: Record<string, string> = {
        PEPPOL_DISABLED: "L’envoi est désactivé.",
        PEPPOL_ENVIRONMENT_NOT_ALLOWED: "L’environnement n’est pas autorisé.",
        PEPPOL_COMPANY_NOT_READY: "La société n’est pas prête.",
        PEPPOL_CUSTOMER_NOT_READY: "Le client n’est pas prêt.",
        PEPPOL_INVOICE_NOT_POSTED: "La facture n’est pas comptabilisée.",
        PEPPOL_DOCUMENT_NOT_READY: "Le document électronique n’est pas prêt.",
        PEPPOL_OPERATION_IN_PROGRESS: "Une opération est déjà en cours.",
        PEPPOL_ALREADY_SENT: "La facture a déjà été envoyée.",
        PEPPOL_UNAVAILABLE: "Aucun transport sandbox autorisé n’est disponible.",
    };
    return labels[code] ?? "La préparation Peppol est bloquée.";
}
