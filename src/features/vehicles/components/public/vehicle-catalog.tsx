"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as vehiclesApi from "@/features/vehicles/api/vehicles-api";
import type {
    PageResponse,
    PublicVehicleFilters,
    PublicVehicleResponse,
} from "@/features/vehicles/types/vehicle.types";
import { VehicleCard } from "@/features/vehicles/components/public/vehicle-card";
import { VehiclePagination } from "@/features/vehicles/components/vehicle-pagination";

const PAGE_SIZE = 9;

type FilterValues = {
    brand: string;
    model: string;
    year: string;
    minPrice: string;
    maxPrice: string;
    fuelType: string;
    gearbox: string;
};

const EMPTY_FILTERS: FilterValues = {
    brand: "",
    model: "",
    year: "",
    minPrice: "",
    maxPrice: "",
    fuelType: "",
    gearbox: "",
};

function valuesFromSearch(search: URLSearchParams): FilterValues {
    return {
        brand: search.get("brand") ?? "",
        model: search.get("model") ?? "",
        year: search.get("year") ?? "",
        minPrice: search.get("minPrice") ?? "",
        maxPrice: search.get("maxPrice") ?? "",
        fuelType: search.get("fuelType") ?? "",
        gearbox: search.get("gearbox") ?? "",
    };
}

function optionalNumber(value: string | null) {
    if (!value?.trim()) {
        return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function nonNegativeInteger(value: string | null) {
    const parsed = optionalNumber(value);
    return parsed != null && Number.isInteger(parsed) && parsed >= 0
        ? parsed
        : 0;
}

function requestFromSearch(search: URLSearchParams): PublicVehicleFilters {
    return {
        brand: search.get("brand") || undefined,
        model: search.get("model") || undefined,
        year: optionalNumber(search.get("year")),
        minPrice: optionalNumber(search.get("minPrice")),
        maxPrice: optionalNumber(search.get("maxPrice")),
        fuelType: search.get("fuelType") || undefined,
        gearbox: search.get("gearbox") || undefined,
        page: nonNegativeInteger(search.get("page")),
        size: PAGE_SIZE,
    };
}

export function VehicleCatalog() {
    const searchParams = useSearchParams();
    const searchKey = searchParams.toString();

    return <VehicleCatalogContent key={searchKey} searchKey={searchKey} />;
}

function VehicleCatalogContent({ searchKey }: { searchKey: string }) {
    const router = useRouter();
    const pathname = usePathname();

    const [filters, setFilters] = useState<FilterValues>(() =>
        valuesFromSearch(new URLSearchParams(searchKey))
    );
    const [result, setResult] = useState<PageResponse<PublicVehicleResponse> | null>(
        null
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        vehiclesApi
            .getPublicVehicles(requestFromSearch(new URLSearchParams(searchKey)))
            .then((page) => {
                if (!ignore) {
                    setResult(page);
                }
            })
            .catch((requestError) => {
                if (!ignore) {
                    setResult(null);
                    setError(
                        requestError instanceof Error
                            ? requestError.message
                            : "Impossible de charger les véhicules"
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
    }, [searchKey]);

    function updateFilter(name: keyof FilterValues, value: string) {
        setFilters((current) => ({ ...current, [name]: value }));
    }

    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const search = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value.trim()) {
                search.set(key, value.trim());
            }
        });
        search.set("page", "0");

        router.push(`${pathname}?${search.toString()}`);
    }

    function resetFilters() {
        setFilters(EMPTY_FILTERS);
        router.push(pathname);
    }

    function changePage(page: number) {
        const search = new URLSearchParams(searchKey);
        search.set("page", String(page));
        router.push(`${pathname}?${search.toString()}`);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    return (
        <main className="flex-1">
            <section className="border-b border-line/70 bg-surface-soft/55">
                <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-16">
                    <p className="eyebrow">Véhicules d’occasion</p>
                    <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
                        Trouvez votre prochaine voiture.
                    </h1>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                        Une sélection préparée par l’atelier, avec les informations
                        utiles pour comparer en toute simplicité.
                    </p>
                </div>
            </section>

            <section className="mx-auto w-full max-w-7xl space-y-7 px-5 py-8 sm:px-6 sm:py-10">
                <form onSubmit={applyFilters} className="card" noValidate>
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <p className="section-title">Recherche</p>
                            <h2 className="mt-2 text-lg font-semibold">
                                Filtrer le catalogue
                            </h2>
                        </div>
                        <button
                            type="button"
                            className="btn-ghost w-fit"
                            onClick={resetFilters}
                        >
                            Réinitialiser
                        </button>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            ["brand", "Marque", "Volkswagen"],
                            ["model", "Modèle", "Golf"],
                            ["fuelType", "Carburant", "Essence"],
                            ["gearbox", "Boîte de vitesses", "Automatique"],
                        ].map(([name, label, placeholder]) => (
                            <label key={name} className="block">
                                <span className="field-label">{label}</span>
                                <input
                                    className="input"
                                    value={filters[name as keyof FilterValues]}
                                    onChange={(event) =>
                                        updateFilter(
                                            name as keyof FilterValues,
                                            event.target.value
                                        )
                                    }
                                    placeholder={placeholder}
                                />
                            </label>
                        ))}

                        <label className="block">
                            <span className="field-label">Année</span>
                            <input
                                type="number"
                                min={1886}
                                className="input"
                                value={filters.year}
                                onChange={(event) =>
                                    updateFilter("year", event.target.value)
                                }
                                placeholder="2022"
                            />
                        </label>
                        <label className="block">
                            <span className="field-label">Prix minimum (€)</span>
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                className="input"
                                value={filters.minPrice}
                                onChange={(event) =>
                                    updateFilter("minPrice", event.target.value)
                                }
                                placeholder="10 000"
                            />
                        </label>
                        <label className="block">
                            <span className="field-label">Prix maximum (€)</span>
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                className="input"
                                value={filters.maxPrice}
                                onChange={(event) =>
                                    updateFilter("maxPrice", event.target.value)
                                }
                                placeholder="30 000"
                            />
                        </label>
                        <button type="submit" className="btn-primary self-end">
                            Appliquer les filtres
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="alert-error" role="alert">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="empty-state">Chargement du catalogue...</div>
                ) : !result || result.content.length === 0 ? (
                    <div className="empty-state">
                        Aucun véhicule ne correspond à ces critères.
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-sm text-muted">
                                {result.totalElements} véhicule
                                {result.totalElements !== 1 ? "s" : ""}
                            </p>
                            <p className="font-mono text-xs text-faint">
                                Page {result.page + 1} / {result.totalPages}
                            </p>
                        </div>
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {result.content.map((vehicle) => (
                                <VehicleCard key={vehicle.id} vehicle={vehicle} />
                            ))}
                        </div>
                        <VehiclePagination
                            page={result.page}
                            totalPages={result.totalPages}
                            first={result.first}
                            last={result.last}
                            onPageChange={changePage}
                        />
                    </>
                )}
            </section>
        </main>
    );
}
