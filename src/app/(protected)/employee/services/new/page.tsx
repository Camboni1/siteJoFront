"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isStaff } from "@/features/auth/lib/roles";
import * as garageServicesApi from "@/features/garage-services/api/garage-services-api";
import type { GarageServiceRequest } from "@/features/garage-services/types/garage-service.types";
import { GarageServiceForm } from "@/features/garage-services/components/garage-service-form";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function NewServicePage() {
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

    async function handleSubmit(values: GarageServiceRequest) {
        await garageServicesApi.createService(values);
        router.push("/employee/services");
    }

    return (
        <main className="flex-1">
            <PageHeader
                title="Nouvelle prestation"
                backHref="/employee/services"
                backLabel="Prestations du garage"
            />

            <section className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-10">
                <GarageServiceForm
                    submitLabel="Créer la prestation"
                    submittingLabel="Création..."
                    onSubmit={handleSubmit}
                    onCancel={() => router.push("/employee/services")}
                />
            </section>
        </main>
    );
}
