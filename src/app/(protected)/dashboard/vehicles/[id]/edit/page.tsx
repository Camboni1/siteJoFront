"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { PageHeader } from "@/components/ui/page-header";
import * as customerVehiclesApi from "@/features/customer-vehicles/api/customer-vehicles-api";
import { CustomerVehicleForm } from "@/features/customer-vehicles/components/customer-vehicle-form";
import { useCustomerGuard } from "@/features/customer-vehicles/hooks/use-customer-guard";
import {
    customerVehicleErrorMessage,
} from "@/features/customer-vehicles/lib/customer-vehicle";
import type { CustomerVehicle } from "@/features/customer-vehicles/types/customer-vehicle.types";
import { isApiError } from "@/lib/api";

export default function EditCustomerVehiclePage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { loading: loadingUser, authorized } = useCustomerGuard();
    const [vehicle, setVehicle] = useState<CustomerVehicle | null>(null);
    const [loadingVehicle, setLoadingVehicle] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authorized || !params.id) {
            return;
        }

        let ignore = false;

        customerVehiclesApi
            .getMyCustomerVehicle(params.id)
            .then((result) => {
                if (!ignore) {
                    setVehicle(result);
                    setError(null);
                }
            })
            .catch((requestError) => {
                if (ignore) {
                    return;
                }

                if (isApiError(requestError, 401)) {
                    router.replace("/login");
                    return;
                }

                if (isApiError(requestError, 403)) {
                    router.replace("/dashboard");
                    return;
                }

                if (isApiError(requestError, 404)) {
                    setNotFound(true);
                    return;
                }

                setError(
                    customerVehicleErrorMessage(
                        requestError,
                        "Impossible de charger ce véhicule pour le moment."
                    )
                );
            })
            .finally(() => {
                if (!ignore) {
                    setLoadingVehicle(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, [authorized, params.id, router]);

    if (loadingUser || !authorized) {
        return <LoadingScreen />;
    }

    return (
        <main className="flex-1">
            <PageHeader
                title="Modifier le véhicule"
                backHref="/dashboard/vehicles"
                backLabel="Mes véhicules"
            />

            <section className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-6 sm:py-10">
                {error && (
                    <div className="alert-error" role="alert">
                        {error}
                    </div>
                )}

                {loadingVehicle ? (
                    <div className="empty-state">
                        Chargement du véhicule...
                    </div>
                ) : notFound || !vehicle ? (
                    !error && (
                        <div className="empty-state space-y-4">
                            <p>Ce véhicule est introuvable.</p>
                            <button
                                type="button"
                                className="btn-ghost"
                                onClick={() =>
                                    router.push("/dashboard/vehicles")
                                }
                            >
                                Revenir à mes véhicules
                            </button>
                        </div>
                    )
                ) : (
                    <CustomerVehicleForm
                        mode="edit"
                        initialVehicle={vehicle}
                        onSubmit={async (request) => {
                            await customerVehiclesApi.updateMyCustomerVehicle(
                                vehicle.id,
                                request
                            );
                            router.push(
                                "/dashboard/vehicles?result=updated"
                            );
                        }}
                        onDeactivate={async () => {
                            await customerVehiclesApi.deactivateMyCustomerVehicle(
                                vehicle.id
                            );
                            router.push(
                                "/dashboard/vehicles?result=deactivated"
                            );
                        }}
                        onCancel={() =>
                            router.push("/dashboard/vehicles")
                        }
                    />
                )}
            </section>
        </main>
    );
}
