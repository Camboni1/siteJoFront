"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as vehiclesApi from "@/features/vehicles/api/vehicles-api";
import type {
    PageResponse,
    VehicleResponse,
} from "@/features/vehicles/types/vehicle.types";
import { useStaffGuard } from "@/features/vehicles/hooks/use-staff-guard";
import { isApiError } from "@/lib/api";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { PageHeader } from "@/components/ui/page-header";
import { VehicleImage } from "@/features/vehicles/components/vehicle-image";
import { VehicleStatusBadge } from "@/features/vehicles/components/vehicle-status-badge";
import { VehiclePagination } from "@/features/vehicles/components/vehicle-pagination";
import { formatDateTime, formatPrice } from "@/lib/format";

const PAGE_SIZE = 10;

function currentPage(value: string | null) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export function EmployeeVehicleList() {
    const searchParams = useSearchParams();
    const { loading: loadingUser, authorized } = useStaffGuard();
    const page = currentPage(searchParams.get("page"));

    if (loadingUser || !authorized) {
        return <LoadingScreen />;
    }

    return <EmployeeVehicleListContent key={page} page={page} />;
}

function EmployeeVehicleListContent({ page }: { page: number }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [result, setResult] = useState<PageResponse<VehicleResponse> | null>(
        null
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        vehiclesApi
            .getEmployeeVehicles(page, PAGE_SIZE)
            .then((response) => {
                if (!ignore) {
                    setResult(response);
                }
            })
            .catch((requestError) => {
                if (ignore) {
                    return;
                }

                if (isApiError(requestError, 401)) {
                    router.push("/login");
                    return;
                }
                if (isApiError(requestError, 403)) {
                    router.push("/dashboard");
                    return;
                }

                setError(
                    requestError instanceof Error
                        ? requestError.message
                        : "Impossible de charger les véhicules"
                );
            })
            .finally(() => {
                if (!ignore) {
                    setLoading(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, [page, router]);

    function changePage(nextPage: number) {
        const search = new URLSearchParams(searchParams.toString());
        search.set("page", String(nextPage));
        router.push(`${pathname}?${search.toString()}`);
    }

    return (
        <main className="flex-1">
            <PageHeader
                title="Véhicules d’occasion"
                backHref="/dashboard"
                backLabel="Tableau de bord"
                action={
                    <Link href="/employee/vehicles/new" className="btn-primary">
                        Nouveau véhicule <span aria-hidden>+</span>
                    </Link>
                }
            />

            <section className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-6 sm:py-10">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <p className="eyebrow">Gestion du stock</p>
                        <h2 className="mt-2 text-xl font-semibold">
                            Tous les véhicules
                        </h2>
                    </div>
                    {result && (
                        <span className="font-mono text-xs text-muted">
                            {result.totalElements} véhicule
                            {result.totalElements !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>

                {error && (
                    <div className="alert-error" role="alert">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="empty-state">Chargement des véhicules...</div>
                ) : !result || result.content.length === 0 ? (
                    <div className="empty-state">
                        Aucun véhicule enregistré pour le moment.
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
                            <table className="w-full min-w-[850px] text-left text-sm">
                                <thead className="border-b border-line bg-surface-soft font-mono text-[0.65rem] tracking-wider text-faint uppercase">
                                    <tr>
                                        <th className="px-5 py-4">Véhicule</th>
                                        <th className="px-5 py-4">Année</th>
                                        <th className="px-5 py-4">Prix</th>
                                        <th className="px-5 py-4">Statut</th>
                                        <th className="px-5 py-4">Mise en avant</th>
                                        <th className="px-5 py-4">Modification</th>
                                        <th className="px-5 py-4">
                                            <span className="sr-only">Action</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.content.map((vehicle) => {
                                        const name = `${vehicle.brand} ${vehicle.model}`;
                                        const image = vehicle.images[0];

                                        return (
                                            <tr
                                                key={vehicle.id}
                                                className="border-b border-line/70 last:border-0 hover:bg-surface-raised"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-line">
                                                            <VehicleImage
                                                                src={image?.url}
                                                                alt={image?.altText || name}
                                                            />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <Link
                                                                href={`/employee/vehicles/${vehicle.id}/edit`}
                                                                className="font-semibold hover:text-accent"
                                                            >
                                                                {name}
                                                            </Link>
                                                            <p className="mt-1 max-w-56 truncate text-xs text-muted">
                                                                {vehicle.version ?? "Version non précisée"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-muted">
                                                    {vehicle.year ?? "—"}
                                                </td>
                                                <td className="px-5 py-4 font-medium">
                                                    {vehicle.price != null
                                                        ? formatPrice(vehicle.price)
                                                        : "Sur demande"}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <VehicleStatusBadge status={vehicle.status} />
                                                </td>
                                                <td className="px-5 py-4 text-muted">
                                                    {vehicle.highlighted ? "Oui" : "Non"}
                                                </td>
                                                <td className="px-5 py-4 text-xs text-muted">
                                                    {formatDateTime(vehicle.updatedAt)}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <Link
                                                        href={`/employee/vehicles/${vehicle.id}/edit`}
                                                        className="btn-ghost px-3 py-2"
                                                    >
                                                        Modifier
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
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
