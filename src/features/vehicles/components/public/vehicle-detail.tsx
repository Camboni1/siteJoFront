"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as vehiclesApi from "@/features/vehicles/api/vehicles-api";
import type { PublicVehicleResponse } from "@/features/vehicles/types/vehicle.types";
import { VehicleGallery } from "@/features/vehicles/components/vehicle-gallery";
import { VehicleStatusBadge } from "@/features/vehicles/components/vehicle-status-badge";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate, formatMileage, formatPrice } from "@/lib/format";

export function VehicleDetail({ id }: { id: string }) {
    const [vehicle, setVehicle] = useState<PublicVehicleResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        vehiclesApi
            .getPublicVehicle(id)
            .then((response) => {
                if (!ignore) {
                    setVehicle(response);
                    setError(null);
                }
            })
            .catch((requestError) => {
                if (!ignore) {
                    setError(
                        requestError instanceof Error
                            ? requestError.message
                            : "Véhicule introuvable"
                    );
                }
            })
            .finally(() => {
                if (!ignore) {
                    setLoading(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, [id]);

    if (loading) {
        return <LoadingScreen />;
    }

    if (!vehicle) {
        return (
            <main className="flex-1">
                <PageHeader
                    title="Véhicule introuvable"
                    backHref="/vehicles"
                    backLabel="Retour au catalogue"
                />
                <section className="mx-auto max-w-4xl px-5 py-10 sm:px-6">
                    <div className="empty-state">
                        <p>{error ?? "Ce véhicule n’est pas disponible."}</p>
                        <Link href="/vehicles" className="btn-primary mt-5">
                            Voir le catalogue
                        </Link>
                    </div>
                </section>
            </main>
        );
    }

    const name = `${vehicle.brand} ${vehicle.model}`;
    const details = [
        ["Année", vehicle.year?.toString() ?? "À préciser"],
        [
            "Kilométrage",
            vehicle.mileage != null
                ? formatMileage(vehicle.mileage)
                : "À préciser",
        ],
        ["Carburant", vehicle.fuelType ?? "À préciser"],
        ["Boîte de vitesses", vehicle.gearbox ?? "À préciser"],
        ["Couleur", vehicle.color ?? "À préciser"],
        [
            "Première immatriculation",
            vehicle.firstRegistrationDate
                ? formatDate(vehicle.firstRegistrationDate)
                : "À préciser",
        ],
    ];

    return (
        <main className="flex-1">
            <PageHeader
                title={name}
                backHref="/vehicles"
                backLabel="Retour au catalogue"
            />

            <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-8 sm:px-6 sm:py-10 lg:grid-cols-[1.15fr_0.85fr]">
                <VehicleGallery images={vehicle.images} vehicleName={name} />

                <div className="space-y-6">
                    <div className="card">
                        <div className="flex flex-wrap items-center gap-2">
                            <VehicleStatusBadge status={vehicle.status} />
                            {vehicle.highlighted && (
                                <span className="rounded-full border border-accent/30 bg-accent/8 px-2.5 py-1 text-xs font-semibold text-accent">
                                    Sélection du garage
                                </span>
                            )}
                        </div>
                        <p className="mt-5 eyebrow">Véhicule d’occasion</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                            {name}
                        </h1>
                        {vehicle.version && (
                            <p className="mt-2 text-base text-muted">
                                {vehicle.version}
                            </p>
                        )}
                        <p className="mt-7 text-3xl font-semibold text-accent">
                            {vehicle.price != null
                                ? formatPrice(vehicle.price)
                                : "Prix sur demande"}
                        </p>
                    </div>

                    <div className="card">
                        <p className="section-title">Caractéristiques</p>
                        <dl className="mt-4 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
                            {details.map(([label, value]) => (
                                <div key={label} className="bg-surface-soft p-4">
                                    <dt className="text-xs text-faint">{label}</dt>
                                    <dd className="mt-1 text-sm font-medium">
                                        {value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    {vehicle.description && (
                        <div className="card">
                            <p className="section-title">Description</p>
                            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted">
                                {vehicle.description}
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
