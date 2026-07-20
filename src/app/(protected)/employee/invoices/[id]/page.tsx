"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isStaff } from "@/features/auth/lib/roles";
import { isApiError } from "@/lib/api";
import * as invoicesApi from "@/features/invoices/api/invoices-api";
import type {
    InvoiceResponse,
    InvoiceStatus,
} from "@/features/invoices/types/invoice.types";
import { INVOICE_STATUS_TRANSITIONS } from "@/features/invoices/lib/invoice-status";
import { InvoiceSummaryCard } from "@/features/invoices/components/invoice-summary-card";
import { InvoiceParties } from "@/features/invoices/components/invoice-parties";
import { InvoiceLinesTable } from "@/features/invoices/components/invoice-lines-table";
import { InvoiceTotalsSummary } from "@/features/invoices/components/invoice-totals-summary";
import { InvoicePdfButton } from "@/features/invoices/components/invoice-pdf-button";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingScreen } from "@/components/ui/loading-screen";

type TransitionAction = {
    label: string;
    pendingLabel: string;
    successMessage: string;
    confirmMessage?: string;
    className: string;
};

const TRANSITION_ACTIONS: Partial<Record<InvoiceStatus, TransitionAction>> = {
    SENT: {
        label: "Émettre la facture",
        pendingLabel: "Émission...",
        successMessage: "La facture a été émise.",
        confirmMessage:
            "Émettre cette facture ?\n\nLes informations du garage et du client seront figées et la facture ne pourra plus être modifiée.",
        className: "btn-primary",
    },
    PAID: {
        label: "Marquer payée",
        pendingLabel: "Mise à jour...",
        successMessage: "La facture est marquée comme payée.",
        className: "btn-primary",
    },
    OVERDUE: {
        label: "Marquer en retard",
        pendingLabel: "Mise à jour...",
        successMessage: "La facture est marquée en retard.",
        className: "btn-ghost",
    },
    CANCELLED: {
        label: "Annuler la facture",
        pendingLabel: "Annulation...",
        successMessage: "La facture a été annulée.",
        confirmMessage:
            "Annuler cette facture ?\n\nUne facture annulée ne peut plus changer de statut.",
        className: "btn-danger",
    },
};

export default function EmployeeInvoiceDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { user, loading } = useAuth();

    const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);
    const [loadingInvoice, setLoadingInvoice] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [transitioning, setTransitioning] = useState<InvoiceStatus | null>(
        null
    );

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!user) {
            router.push("/login");
        } else if (!isStaff(user)) {
            router.push("/dashboard");
        }
    }, [loading, user, router]);

    useEffect(() => {
        if (!user || !isStaff(user) || !params.id) {
            return;
        }

        invoicesApi
            .getEmployeeInvoice(params.id)
            .then(setInvoice)
            .catch((error) => {
                if (isApiError(error, 401)) {
                    router.push("/login");
                    return;
                }

                if (isApiError(error, 403)) {
                    router.push("/dashboard");
                    return;
                }

                setError(
                    error instanceof Error
                        ? error.message
                        : "Facture introuvable"
                );
            })
            .finally(() => setLoadingInvoice(false));
    }, [user, params.id, router]);

    if (loading || !user || !isStaff(user)) {
        return <LoadingScreen />;
    }

    async function handleTransition(target: InvoiceStatus) {
        if (!invoice) {
            return;
        }

        const action = TRANSITION_ACTIONS[target];

        if (!action) {
            return;
        }

        if (action.confirmMessage && !window.confirm(action.confirmMessage)) {
            return;
        }

        setActionError(null);
        setActionMessage(null);
        setTransitioning(target);

        try {
            const updated = await invoicesApi.updateInvoiceStatus(invoice.id, {
                status: target,
            });

            setInvoice(updated);
            setActionMessage(action.successMessage);
        } catch (error) {
            if (isApiError(error, 401)) {
                router.push("/login");
                return;
            }

            if (isApiError(error, 403)) {
                router.push("/dashboard");
                return;
            }

            setActionError(
                error instanceof Error
                    ? error.message
                    : "Impossible de mettre à jour le statut"
            );
        } finally {
            setTransitioning(null);
        }
    }

    const allowedTransitions = invoice
        ? INVOICE_STATUS_TRANSITIONS[invoice.status]
        : [];

    return (
        <main className="flex-1">
            <PageHeader
                title="Fiche facture"
                backHref="/employee/invoices"
                backLabel="Factures"
            />

            <section className="mx-auto max-w-4xl space-y-6 px-5 py-8 sm:px-6 sm:py-10">
                {error && (
                    <div className="alert-error" role="alert">
                        {error}
                    </div>
                )}

                {loadingInvoice ? (
                    <div className="empty-state">Chargement...</div>
                ) : !invoice ? (
                    <div className="empty-state">
                        Cette facture est introuvable.
                    </div>
                ) : (
                    <>
                        {actionMessage && (
                            <div className="alert-success" role="status">
                                {actionMessage}
                            </div>
                        )}

                        {actionError && (
                            <div className="alert-error" role="alert">
                                {actionError}
                            </div>
                        )}

                        <InvoiceSummaryCard invoice={invoice} showTechnicalDates>
                            {invoice.status === "DRAFT" && (
                                <Link
                                    href={`/employee/invoices/${invoice.id}/edit`}
                                    className="btn-ghost"
                                >
                                    Modifier
                                </Link>
                            )}

                            {allowedTransitions.map((target) => {
                                const action = TRANSITION_ACTIONS[target];

                                if (!action) {
                                    return null;
                                }

                                return (
                                    <button
                                        key={target}
                                        type="button"
                                        className={action.className}
                                        onClick={() => handleTransition(target)}
                                        disabled={transitioning !== null}
                                    >
                                        {transitioning === target
                                            ? action.pendingLabel
                                            : action.label}
                                    </button>
                                );
                            })}

                            {invoice.status !== "DRAFT" && (
                                <InvoicePdfButton
                                    onDownload={() =>
                                        invoicesApi.downloadEmployeeInvoicePdf(
                                            invoice.id,
                                            invoice.invoiceNumber
                                        )
                                    }
                                />
                            )}
                        </InvoiceSummaryCard>

                        {invoice.status === "DRAFT" && (
                            <p className="text-sm text-muted">
                                Ce brouillon reste modifiable.
                                L&apos;émission figera les informations du
                                garage et du client et rendra la facture
                                définitive.
                            </p>
                        )}

                        <InvoiceParties invoice={invoice} />

                        <div>
                            <p className="section-title">Détail</p>
                            <h2 className="mt-2 text-xl font-semibold tracking-tight">
                                Lignes
                            </h2>
                            <div className="mt-4">
                                <InvoiceLinesTable
                                    lines={invoice.lines}
                                    currency={invoice.currency}
                                />
                            </div>
                        </div>

                        <InvoiceTotalsSummary invoice={invoice} />

                        {invoice.notes && (
                            <div className="card">
                                <p className="section-title">Suivi</p>
                                <h2 className="mt-2 text-lg font-semibold">
                                    Notes
                                </h2>
                                <p className="mt-4 whitespace-pre-line border-l-2 border-accent/40 pl-4 text-sm leading-6 text-muted">
                                    {invoice.notes}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </section>
        </main>
    );
}
