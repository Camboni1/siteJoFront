"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import * as vehiclesApi from "@/features/vehicles/api/vehicles-api";
import { VehicleCard } from "@/features/vehicles/components/public/vehicle-card";
import type { PublicVehicleResponse } from "@/features/vehicles/types/vehicle.types";

const FEATURED_VEHICLE_LIMIT = 3;
const FEATURED_REQUEST_SIZE = 12;

export function selectFeaturedVehicles(
    vehicles: PublicVehicleResponse[]
): PublicVehicleResponse[] {
    const available = vehicles.filter(
        (vehicle) => vehicle.id && vehicle.status === "AVAILABLE"
    );

    return [
        ...available.filter((vehicle) => vehicle.highlighted),
        ...available.filter((vehicle) => !vehicle.highlighted),
    ].slice(0, FEATURED_VEHICLE_LIMIT);
}

export function FeaturedVehicles() {
    const [vehicles, setVehicles] = useState<PublicVehicleResponse[] | null>(
        null
    );
    const [error, setError] = useState(false);

    useEffect(() => {
        let ignore = false;

        vehiclesApi
            .getPublicVehicles({
                page: 0,
                size: FEATURED_REQUEST_SIZE,
            })
            .then((result) => {
                if (!ignore) {
                    setVehicles(selectFeaturedVehicles(result.content));
                    setError(false);
                }
            })
            .catch(() => {
                if (!ignore) {
                    setVehicles([]);
                    setError(true);
                }
            });

        return () => {
            ignore = true;
        };
    }, []);

    if (vehicles === null) {
        return (
            <div
                className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
                role="status"
                aria-label="Chargement des occasions à la une"
            >
                {[0, 1, 2].map((item) => (
                    <div
                        key={item}
                        className="overflow-hidden rounded-xl border border-line bg-surface"
                        aria-hidden
                    >
                        <div className="aspect-[16/10] animate-pulse bg-surface-raised motion-reduce:animate-none" />
                        <div className="space-y-4 p-5">
                            <div className="h-3 w-20 animate-pulse rounded bg-surface-raised motion-reduce:animate-none" />
                            <div className="h-6 w-3/5 animate-pulse rounded bg-surface-raised motion-reduce:animate-none" />
                            <div className="grid grid-cols-2 gap-2">
                                <div className="h-10 animate-pulse rounded bg-surface-raised motion-reduce:animate-none" />
                                <div className="h-10 animate-pulse rounded bg-surface-raised motion-reduce:animate-none" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div
                role="alert"
                className="rounded-xl border border-red-500/25 bg-red-500/6 px-6 py-8 sm:flex sm:items-center sm:justify-between sm:gap-6"
            >
                <div>
                    <h3 className="font-semibold text-ink">
                        Le catalogue est momentanément indisponible.
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted">
                        Le reste du site reste accessible. Vous pouvez réessayer
                        depuis le catalogue des occasions.
                    </p>
                </div>
                <Link
                    href="/vehicles"
                    className="btn-ghost mt-5 min-h-11 w-fit shrink-0 sm:mt-0"
                >
                    Ouvrir le catalogue
                </Link>
            </div>
        );
    }

    if (vehicles.length === 0) {
        return (
            <div className="empty-state py-12">
                <h3 className="font-semibold text-ink">
                    Aucune occasion disponible actuellement.
                </h3>
                <p className="mt-2">
                    Le catalogue sera mis à jour dès qu’un véhicule sera proposé.
                </p>
            </div>
        );
    }

    const gridClassName =
        vehicles.length === 1
            ? "mx-auto grid w-full max-w-md items-stretch gap-5"
            : vehicles.length === 2
              ? "grid items-stretch gap-5 md:grid-cols-2"
              : "grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3";

    return (
        <div className={gridClassName}>
            {vehicles.map((vehicle, index) => (
                <div
                    key={vehicle.id}
                    className={
                        vehicles.length === 3 && index === 2
                            ? "h-full md:col-span-2 md:mx-auto md:w-[calc(50%-0.625rem)] xl:col-span-1 xl:mx-0 xl:w-auto"
                            : "h-full"
                    }
                >
                    <VehicleCard
                        vehicle={vehicle}
                        headingLevel="h3"
                    />
                </div>
            ))}
        </div>
    );
}
