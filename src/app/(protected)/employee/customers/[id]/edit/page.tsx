"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isStaff } from "@/features/auth/lib/roles";
import { isApiError } from "@/lib/api";
import * as customersApi from "@/features/customers/api/customers-api";
import type {
    Customer,
    CustomerRequest,
} from "@/features/customers/types/customer.types";
import { CustomerForm } from "@/features/customers/components/customer-form";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function EditCustomerPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { user, loading } = useAuth();

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loadingCustomer, setLoadingCustomer] = useState(true);
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

        customersApi
            .getCustomer(params.id)
            .then(setCustomer)
            .catch((error) => {
                if (isApiError(error, 401)) {
                    router.push("/login");
                    return;
                }

                setError(
                    error instanceof Error
                        ? error.message
                        : "Client introuvable"
                );
            })
            .finally(() => setLoadingCustomer(false));
    }, [user, params.id, router]);

    if (loading || !user || !isStaff(user)) {
        return <LoadingScreen />;
    }

    async function handleSubmit(values: CustomerRequest) {
        if (!customer) {
            return;
        }

        await customersApi.updateCustomer(customer.id, values);
        router.push(`/employee/customers/${customer.id}`);
    }

    return (
        <main className="flex-1">
            <PageHeader
                title="Modifier le client"
                backHref={
                    params.id
                        ? `/employee/customers/${params.id}`
                        : "/employee/customers"
                }
                backLabel="Fiche client"
            />

            <section className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-6 sm:py-10">
                {error && <div className="alert-error">{error}</div>}

                {loadingCustomer ? (
                    <div className="empty-state">Chargement...</div>
                ) : !customer ? (
                    <div className="empty-state">
                        Ce client est introuvable.
                    </div>
                ) : (
                    <CustomerForm
                        initialValues={customer}
                        submitLabel="Enregistrer les modifications"
                        submittingLabel="Enregistrement..."
                        onSubmit={handleSubmit}
                        onCancel={() =>
                            router.push(`/employee/customers/${customer.id}`)
                        }
                    />
                )}
            </section>
        </main>
    );
}
