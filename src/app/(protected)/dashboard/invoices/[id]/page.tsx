"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { PageHeader } from "@/components/ui/page-header";
import { isCustomer } from "@/features/auth/lib/roles";
import * as invoicesApi from "@/features/invoices/api/invoices-api";
import { InvoiceLinesTable } from "@/features/invoices/components/invoice-lines-table";
import { InvoiceParties } from "@/features/invoices/components/invoice-parties";
import { InvoicePdfButton } from "@/features/invoices/components/invoice-pdf-button";
import { InvoiceSummaryCard } from "@/features/invoices/components/invoice-summary-card";
import { InvoiceTotalsSummary } from "@/features/invoices/components/invoice-totals-summary";
import type { InvoiceResponse } from "@/features/invoices/types/invoice.types";
import { isApiError } from "@/lib/api";

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type InvoiceLoadState =
    | { id: string; kind: "loaded"; invoice: InvoiceResponse }
    | { id: string; kind: "not-found" }
    | { id: string; kind: "error"; message: string };

export default function CustomerInvoiceDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { user, loading } = useAuth();

    const [loadState, setLoadState] = useState<InvoiceLoadState | null>(null);
    const [redirecting, setRedirecting] = useState(false);

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!user) {
            router.replace("/login");
        } else if (!isCustomer(user)) {
            router.replace("/dashboard");
        }
    }, [loading, user, router]);

    useEffect(() => {
        if (!user || !isCustomer(user) || !params.id) {
            return;
        }

        if (!UUID_PATTERN.test(params.id)) {
            return;
        }

        let ignore = false;

        invoicesApi
            .getCustomerInvoice(params.id)
            .then((result) => {
                if (!ignore) {
                    setLoadState({
                        id: params.id,
                        kind: "loaded",
                        invoice: result,
                    });
                }
            })
            .catch((requestError) => {
                if (ignore) {
                    return;
                }

                if (isApiError(requestError, 401)) {
                    setRedirecting(true);
                    router.replace("/login");
                    return;
                }

                if (isApiError(requestError, 403)) {
                    setRedirecting(true);
                    router.replace("/dashboard");
                    return;
                }

                if (isApiError(requestError, 404)) {
                    setLoadState({ id: params.id, kind: "not-found" });
                    return;
                }

                setLoadState({
                    id: params.id,
                    kind: "error",
                    message:
                        requestError instanceof Error
                            ? requestError.message
                            : "Impossible de charger la facture",
                });
            });

        return () => {
            ignore = true;
        };
    }, [user, params.id, router]);

    if (loading || !user || !isCustomer(user) || redirecting) {
        return <LoadingScreen />;
    }

    const validId = UUID_PATTERN.test(params.id);
    const currentState = loadState?.id === params.id ? loadState : null;
    const invoice =
        currentState?.kind === "loaded" ? currentState.invoice : null;
    const error =
        currentState?.kind === "error" ? currentState.message : null;
    const notFound = !validId || currentState?.kind === "not-found";
    const loadingInvoice = validId && currentState === null;

    return (
        <main className="flex-1">
            <PageHeader
                title="Fiche facture"
                backHref="/dashboard/invoices"
                backLabel="Mes factures"
            />

            <section className="mx-auto max-w-4xl space-y-6 px-5 py-8 sm:px-6 sm:py-10">
                {error && (
                    <div className="alert-error" role="alert">
                        {error}
                    </div>
                )}

                {loadingInvoice ? (
                    <div className="empty-state">Chargement...</div>
                ) : notFound || !invoice ? (
                    !error && (
                        <div className="empty-state">
                            Facture introuvable.
                        </div>
                    )
                ) : (
                    <>
                        <InvoiceSummaryCard invoice={invoice}>
                            <InvoicePdfButton
                                onDownload={() =>
                                    invoicesApi.downloadCustomerInvoicePdf(
                                        invoice.id,
                                        invoice.invoiceNumber
                                    )
                                }
                            />
                        </InvoiceSummaryCard>

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
                                <p className="section-title">Informations</p>
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
