"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isStaff } from "@/features/auth/lib/roles";
import * as customersApi from "@/features/customers/api/customers-api";
import type { CustomerRequest } from "@/features/customers/types/customer.types";
import { CustomerForm } from "@/features/customers/components/customer-form";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function NewCustomerPage() {
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

    async function handleSubmit(values: CustomerRequest) {
        const created = await customersApi.createCustomer(values);
        router.push(`/employee/customers/${created.id}`);
    }

    return (
        <main className="flex-1">
            <PageHeader
                title="Nouveau client"
                backHref="/employee/customers"
                backLabel="Clients du garage"
            />

            <section className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-10">
                <CustomerForm
                    submitLabel="Créer le client"
                    submittingLabel="Création..."
                    onSubmit={handleSubmit}
                    onCancel={() => router.push("/employee/customers")}
                />
            </section>
        </main>
    );
}
