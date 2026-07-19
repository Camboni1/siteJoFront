"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isStaff } from "@/features/auth/lib/roles";
import { isApiError } from "@/lib/api";
import * as garageServicesApi from "@/features/garage-services/api/garage-services-api";
import type { GarageService } from "@/features/garage-services/types/garage-service.types";
import { ServiceActiveBadge } from "@/features/garage-services/components/service-active-badge";
import { formatDuration, formatPrice } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingScreen } from "@/components/ui/loading-screen";

type StatusFilter = "" | "active" | "inactive";

export default function EmployeeServicesPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const [services, setServices] = useState<GarageService[]>([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("");

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
        if (!user || !isStaff(user)) {
            return;
        }

        let ignore = false;

        garageServicesApi
            .getAllServices()
            .then((result) => {
                if (!ignore) {
                    setServices(result);
                    setError(null);
                }
            })
            .catch((error) => {
                if (ignore) {
                    return;
                }

                if (isApiError(error, 401)) {
                    router.push("/login");
                    return;
                }

                setError(
                    error instanceof Error
                        ? error.message
                        : "Impossible de charger les prestations"
                );
            })
            .finally(() => {
                if (!ignore) {
                    setLoadingServices(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, [user, router]);

    async function handleToggleActive(service: GarageService) {
        setError(null);
        setSuccess(null);
        setTogglingId(service.id);

        try {
            const updated = await garageServicesApi.updateServiceActive(
                service.id,
                !service.active
            );

            setServices((current) =>
                current.map((item) =>
                    item.id === updated.id ? updated : item
                )
            );
            setSuccess(
                updated.active
                    ? `« ${updated.name} » est de nouveau proposée aux clients.`
                    : `« ${updated.name} » n'est plus proposée aux clients.`
            );
        } catch (error) {
            if (isApiError(error, 401)) {
                router.push("/login");
                return;
            }

            setError(
                error instanceof Error
                    ? error.message
                    : "Impossible de modifier la prestation"
            );
        } finally {
            setTogglingId(null);
        }
    }

    if (loading || !user || !isStaff(user)) {
        return <LoadingScreen />;
    }

    const normalizedSearch = search.trim().toLowerCase();

    const filtered = services.filter((service) => {
        if (statusFilter === "active" && !service.active) {
            return false;
        }

        if (statusFilter === "inactive" && service.active) {
            return false;
        }

        if (!normalizedSearch) {
            return true;
        }

        return (
            service.name.toLowerCase().includes(normalizedSearch) ||
            (service.description ?? "")
                .toLowerCase()
                .includes(normalizedSearch)
        );
    });

    return (
        <main className="flex-1">
            <PageHeader
                title="Prestations du garage"
                backHref="/dashboard"
                backLabel="Tableau de bord"
            />

            <section className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-6 sm:py-10">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="eyebrow">Gestion atelier</p>
                        <h2 className="mt-2 text-xl font-semibold tracking-tight">
                            Catalogue des prestations
                        </h2>
                    </div>
                    <Link
                        href="/employee/services/new"
                        className="btn-primary w-fit"
                    >
                        Nouvelle prestation
                        <span aria-hidden>+</span>
                    </Link>
                </div>

                <div className="card flex flex-wrap items-end gap-4 p-4">
                    <div className="min-w-56 flex-1">
                        <label className="field-label" htmlFor="service-search">
                            Recherche
                        </label>
                        <input
                            id="service-search"
                            type="search"
                            className="input py-2.5"
                            placeholder="Nom ou description..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                        />
                    </div>

                    <div className="min-w-44 flex-1 sm:flex-none">
                        <label className="field-label" htmlFor="service-status">
                            Statut
                        </label>
                        <select
                            id="service-status"
                            className="input py-2.5"
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target.value as StatusFilter
                                )
                            }
                        >
                            <option value="">Toutes</option>
                            <option value="active">Actives</option>
                            <option value="inactive">Inactives</option>
                        </select>
                    </div>

                    <span className="mb-1 rounded-full border border-line bg-surface-soft px-3 py-1 font-mono text-xs text-muted">
                        {String(filtered.length).padStart(2, "0")} résultat
                        {filtered.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {error && (
                    <div className="alert-error" role="alert">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="alert-success" role="status">
                        {success}
                    </div>
                )}

                {loadingServices ? (
                    <div className="empty-state">
                        Chargement des prestations...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        {services.length === 0
                            ? "Aucune prestation enregistrée pour le moment."
                            : "Aucune prestation ne correspond aux filtres."}
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-line bg-surface-soft font-mono text-[0.65rem] tracking-wider text-faint uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">
                                        Prestation
                                    </th>
                                    <th className="px-6 py-4 font-semibold">
                                        Prix de départ
                                    </th>
                                    <th className="px-6 py-4 font-semibold">
                                        Durée
                                    </th>
                                    <th className="px-6 py-4 font-semibold">
                                        Ordre
                                    </th>
                                    <th className="px-6 py-4 font-semibold">
                                        Statut
                                    </th>
                                    <th className="px-6 py-4 font-semibold">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((service) => (
                                    <tr
                                        key={service.id}
                                        onClick={() =>
                                            router.push(
                                                `/employee/services/${service.id}/edit`
                                            )
                                        }
                                        className="cursor-pointer border-b border-line/70 transition last:border-b-0 hover:bg-surface-raised"
                                    >
                                        <td className="max-w-72 px-6 py-4">
                                            <Link
                                                href={`/employee/services/${service.id}/edit`}
                                                className="font-medium hover:text-accent"
                                                onClick={(event) =>
                                                    event.stopPropagation()
                                                }
                                            >
                                                {service.name}
                                            </Link>
                                            {service.description && (
                                                <p className="mt-1 truncate text-xs text-muted">
                                                    {service.description}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-muted">
                                            {service.startingPrice != null
                                                ? formatPrice(
                                                      service.startingPrice
                                                  )
                                                : "Sur devis"}
                                        </td>
                                        <td className="px-6 py-4 text-muted">
                                            {formatDuration(
                                                service.durationMinutes
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-muted">
                                            {service.displayOrder}
                                        </td>
                                        <td className="px-6 py-4">
                                            <ServiceActiveBadge
                                                active={service.active}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    void handleToggleActive(
                                                        service
                                                    );
                                                }}
                                                disabled={
                                                    togglingId === service.id
                                                }
                                                className="btn-ghost px-3 py-2 text-xs"
                                            >
                                                {togglingId === service.id
                                                    ? "..."
                                                    : service.active
                                                      ? "Désactiver"
                                                      : "Activer"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
