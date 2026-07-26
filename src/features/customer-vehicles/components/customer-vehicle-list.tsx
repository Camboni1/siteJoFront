"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { PageHeader } from "@/components/ui/page-header";
import * as customerVehiclesApi from "@/features/customer-vehicles/api/customer-vehicles-api";
import { CustomerVehicleStatusBadge } from "@/features/customer-vehicles/components/customer-vehicle-status-badge";
import { useCustomerGuard } from "@/features/customer-vehicles/hooks/use-customer-guard";
import type { CustomerVehicleSummary } from "@/features/customer-vehicles/types/customer-vehicle.types";
import { isApiError } from "@/lib/api";

type CustomerVehicleListProps = {
    successMessage?: string;
};

export function CustomerVehicleList({
    successMessage,
}: CustomerVehicleListProps) {
    const router = useRouter();
    const { loading: loadingUser, authorized } = useCustomerGuard();
    const [vehicles, setVehicles] = useState<CustomerVehicleSummary[]>([]);
    const [loadingVehicles, setLoadingVehicles] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authorized) {
            return;
        }

        let ignore = false;

        customerVehiclesApi
            .getMyCustomerVehicles()
            .then((result) => {
                if (!ignore) {
                    setVehicles(result);
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

                setError(
                    "Impossible de charger vos véhicules pour le moment."
                );
            })
            .finally(() => {
                if (!ignore) {
                    setLoadingVehicles(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, [authorized, router]);

    if (loadingUser || !authorized) {
        return <LoadingScreen />;
    }

    return (
        <main className="flex-1">
            <PageHeader
                title="Mes véhicules"
                backHref="/dashboard"
                backLabel="Tableau de bord"
                action={
                    <Link href="/dashboard/vehicles/new" className="btn-primary">
                        Ajouter un véhicule <span aria-hidden>+</span>
                    </Link>
                }
            />

            <section className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-6 sm:py-10">
                <div>
                    <p className="eyebrow">Garage personnel</p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight">
                        Véhicules enregistrés
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                        Enregistrez vos véhicules pour les sélectionner plus
                        rapidement lors de vos demandes de rendez-vous.
                    </p>
                </div>

                {successMessage && (
                    <div className="alert-success" role="status">
                        {successMessage}
                    </div>
                )}

                {error && (
                    <div className="alert-error" role="alert">
                        {error}
                    </div>
                )}

                {loadingVehicles ? (
                    <div className="empty-state">
                        Chargement de vos véhicules...
                    </div>
                ) : vehicles.length === 0 ? (
                    !error && (
                        <div className="empty-state space-y-2">
                            <p className="font-medium text-ink">
                                Aucun véhicule enregistré.
                            </p>
                            <p>
                                Ajoutez votre véhicule pour le sélectionner plus
                                rapidement lors de vos prochains rendez-vous.
                            </p>
                        </div>
                    )
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {vehicles.map((vehicle) => (
                            <article
                                key={vehicle.id}
                                className="card flex flex-col justify-between gap-6"
                            >
                                <div>
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="section-title">
                                                Véhicule client
                                            </p>
                                            <h3 className="mt-2 text-lg font-semibold">
                                                {vehicle.brand} {vehicle.model}
                                            </h3>
                                        </div>
                                        <CustomerVehicleStatusBadge
                                            active={vehicle.active}
                                        />
                                    </div>

                                    <p className="mt-4 font-mono text-sm text-muted">
                                        {vehicle.licensePlate ??
                                            "Plaque non renseignée"}
                                    </p>

                                    {!vehicle.active && (
                                        <p className="mt-4 text-sm leading-6 text-muted">
                                            Ce véhicule reste dans votre
                                            historique, mais il n’est plus
                                            disponible pour un nouveau
                                            rendez-vous.
                                        </p>
                                    )}
                                </div>

                                <Link
                                    href={`/dashboard/vehicles/${vehicle.id}/edit`}
                                    className="btn-ghost w-full sm:w-fit"
                                    aria-label={`Modifier ${vehicle.brand} ${vehicle.model}`}
                                >
                                    Modifier
                                </Link>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
