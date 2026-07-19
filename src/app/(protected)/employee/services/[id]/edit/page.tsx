"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isStaff } from "@/features/auth/lib/roles";
import { isApiError } from "@/lib/api";
import * as garageServicesApi from "@/features/garage-services/api/garage-services-api";
import type {
    GarageService,
    GarageServiceRequest,
} from "@/features/garage-services/types/garage-service.types";
import { GarageServiceForm } from "@/features/garage-services/components/garage-service-form";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function EditServicePage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { user, loading } = useAuth();

    const [service, setService] = useState<GarageService | null>(null);
    const [loadingService, setLoadingService] = useState(true);
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

        garageServicesApi
            .getService(params.id)
            .then(setService)
            .catch((error) => {
                if (isApiError(error, 401)) {
                    router.push("/login");
                    return;
                }

                setError(
                    error instanceof Error
                        ? error.message
                        : "Prestation introuvable"
                );
            })
            .finally(() => setLoadingService(false));
    }, [user, params.id, router]);

    if (loading || !user || !isStaff(user)) {
        return <LoadingScreen />;
    }

    async function handleSubmit(values: GarageServiceRequest) {
        if (!service) {
            return;
        }

        await garageServicesApi.updateService(service.id, values);
        router.push("/employee/services");
    }

    return (
        <main className="flex-1">
            <PageHeader
                title="Modifier la prestation"
                backHref="/employee/services"
                backLabel="Prestations du garage"
            />

            <section className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-6 sm:py-10">
                {error && <div className="alert-error">{error}</div>}

                {loadingService ? (
                    <div className="empty-state">Chargement...</div>
                ) : !service ? (
                    <div className="empty-state">
                        Cette prestation est introuvable.
                    </div>
                ) : (
                    <GarageServiceForm
                        initialValues={service}
                        submitLabel="Enregistrer les modifications"
                        submittingLabel="Enregistrement..."
                        onSubmit={handleSubmit}
                        onCancel={() => router.push("/employee/services")}
                    />
                )}
            </section>
        </main>
    );
}
