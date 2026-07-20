"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isStaff } from "@/features/auth/lib/roles";
import { isApiError } from "@/lib/api";
import * as invoicesApi from "@/features/invoices/api/invoices-api";
import type {
    InvoiceResponse,
    UpdateInvoiceRequest,
} from "@/features/invoices/types/invoice.types";
import { InvoiceForm } from "@/features/invoices/components/invoice-form";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function EditInvoicePage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { user, loading } = useAuth();

    const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);
    const [loadingInvoice, setLoadingInvoice] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const notEditable = invoice !== null && invoice.status !== "DRAFT";

    async function handleSubmit(values: UpdateInvoiceRequest) {
        if (!invoice) {
            return;
        }

        try {
            await invoicesApi.updateInvoice(invoice.id, values);
            router.push(`/employee/invoices/${invoice.id}`);
        } catch (error) {
            if (isApiError(error, 401)) {
                router.push("/login");
                return;
            }

            if (isApiError(error, 403)) {
                router.push("/dashboard");
                return;
            }

            if (isApiError(error, 409)) {
                // La facture a pu être émise entre-temps : on recharge son
                // statut pour désactiver le formulaire si nécessaire.
                try {
                    setInvoice(
                        await invoicesApi.getEmployeeInvoice(invoice.id)
                    );
                } catch {
                    // le message 409 affiché par le formulaire suffit
                }
            }

            throw error;
        }
    }

    return (
        <main className="flex-1">
            <PageHeader
                title="Modifier la facture"
                backHref={
                    params.id
                        ? `/employee/invoices/${params.id}`
                        : "/employee/invoices"
                }
                backLabel="Fiche facture"
            />

            <section className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-6 sm:py-10">
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
                        {notEditable && (
                            <div className="alert-error" role="alert">
                                Une facture émise ne peut plus être modifiée.
                                Seul un brouillon est éditable.
                            </div>
                        )}

                        <InvoiceForm
                            initialInvoice={invoice}
                            disabled={notEditable}
                            submitLabel="Enregistrer les modifications"
                            submittingLabel="Enregistrement..."
                            onSubmit={handleSubmit}
                            onCancel={() =>
                                router.push(`/employee/invoices/${invoice.id}`)
                            }
                        />
                    </>
                )}
            </section>
        </main>
    );
}
