"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isStaff } from "@/features/auth/lib/roles";
import { isApiError } from "@/lib/api";
import * as invoicesApi from "@/features/invoices/api/invoices-api";
import type { CreateInvoiceRequest } from "@/features/invoices/types/invoice.types";
import { InvoiceForm } from "@/features/invoices/components/invoice-form";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function NewInvoicePage() {
    const router = useRouter();
    const { user, loading } = useAuth();

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

    if (loading || !user || !isStaff(user)) {
        return <LoadingScreen />;
    }

    async function handleSubmit(values: CreateInvoiceRequest) {
        try {
            const created = await invoicesApi.createInvoice(values);
            router.push(`/employee/invoices/${created.id}`);
        } catch (error) {
            if (isApiError(error, 401)) {
                router.push("/login");
                return;
            }

            throw error;
        }
    }

    return (
        <main className="flex-1">
            <PageHeader
                title="Nouvelle facture"
                backHref="/employee/invoices"
                backLabel="Factures"
            />

            <section className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-6 sm:py-10">
                <p className="text-sm text-muted">
                    La facture est créée en brouillon : elle reste modifiable
                    jusqu&apos;à son émission et son numéro est attribué
                    automatiquement.
                </p>

                <InvoiceForm
                    submitLabel="Créer le brouillon"
                    submittingLabel="Création..."
                    onSubmit={handleSubmit}
                    onCancel={() => router.push("/employee/invoices")}
                />
            </section>
        </main>
    );
}
