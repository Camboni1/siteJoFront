"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
    usePathname,
    useRouter,
    useSearchParams,
} from "next/navigation";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { PageHeader } from "@/components/ui/page-header";
import { useStaffGuard } from "@/features/vehicles/hooks/use-staff-guard";
import * as workOrdersApi from "@/features/work-orders/api/work-orders-api";
import { WorkOrderPagination } from "@/features/work-orders/components/work-order-pagination";
import { WorkOrderStatusBadge } from "@/features/work-orders/components/work-order-status-badge";
import {
    WORK_ORDER_STATUSES,
    WORK_ORDER_STATUS_LABELS,
    workOrderErrorMessage,
} from "@/features/work-orders/lib/work-order";
import type {
    WorkOrderStatus,
    WorkOrderSummary,
} from "@/features/work-orders/types/work-order.types";
import type { PageResponse } from "@/features/invoices/types/invoice.types";
import { isApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

const PAGE_SIZE = 20;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type FilterValues = {
    status: WorkOrderStatus | "";
    date: string;
};

function isWorkOrderStatus(value: string): value is WorkOrderStatus {
    return (WORK_ORDER_STATUSES as string[]).includes(value);
}

function pageFromSearch(value: string | null) {
    const page = Number(value);
    return Number.isInteger(page) && page >= 0 ? page : 0;
}

function filtersFromSearch(search: URLSearchParams): FilterValues {
    const status = search.get("status") ?? "";
    const date = search.get("date") ?? "";

    return {
        status: isWorkOrderStatus(status) ? status : "",
        date: DATE_PATTERN.test(date) ? date : "",
    };
}

export function EmployeeWorkOrderList() {
    const searchParams = useSearchParams();
    const searchKey = searchParams.toString();
    const { loading, authorized } = useStaffGuard();

    if (loading || !authorized) {
        return <LoadingScreen />;
    }

    return <WorkOrderListContent key={searchKey} searchKey={searchKey} />;
}

export function WorkOrderListContent({ searchKey }: { searchKey: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const search = new URLSearchParams(searchKey);
    const appliedFilters = filtersFromSearch(search);
    const currentPage = pageFromSearch(search.get("page"));

    const [filters, setFilters] = useState<FilterValues>(appliedFilters);
    const [result, setResult] =
        useState<PageResponse<WorkOrderSummary> | null>(null);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        workOrdersApi
            .getWorkOrders({
                status: appliedFilters.status || undefined,
                date: appliedFilters.date || undefined,
                page: currentPage,
                size: PAGE_SIZE,
            })
            .then((page) => {
                if (!ignore) {
                    setResult(page);
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

                setResult(null);
                setError(
                    workOrderErrorMessage(
                        requestError,
                        "Impossible de charger les ordres de réparation."
                    )
                );
            })
            .finally(() => {
                if (!ignore) {
                    setLoadingOrders(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, [
        appliedFilters.date,
        appliedFilters.status,
        currentPage,
        router,
    ]);

    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const nextSearch = new URLSearchParams();

        if (filters.status) {
            nextSearch.set("status", filters.status);
        }
        if (filters.date) {
            nextSearch.set("date", filters.date);
        }
        nextSearch.set("page", "0");

        router.push(`${pathname}?${nextSearch.toString()}`);
    }

    function resetFilters() {
        setFilters({ status: "", date: "" });
        router.push(pathname);
    }

    function changePage(page: number) {
        const nextSearch = new URLSearchParams(searchKey);
        nextSearch.set("page", String(page));
        router.push(`${pathname}?${nextSearch.toString()}`);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    const hasActiveFilters = Boolean(
        appliedFilters.status || appliedFilters.date
    );

    return (
        <main className="flex-1">
            <PageHeader
                title="Ordres de réparation"
                backHref="/dashboard"
                backLabel="Tableau de bord"
            />

            <section className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-6 sm:py-10">
                <div>
                    <p className="eyebrow">Gestion atelier</p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight">
                        Dossiers atelier
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                        Suivez la réception, l’intervention et la restitution
                        des véhicules pris en charge par l’atelier.
                    </p>
                </div>

                <form onSubmit={applyFilters} className="card" noValidate>
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <p className="section-title">Filtres</p>
                            <h3 className="mt-2 text-lg font-semibold">
                                Affiner la liste
                            </h3>
                        </div>
                        <button
                            type="button"
                            className="btn-ghost w-fit"
                            onClick={resetFilters}
                        >
                            Réinitialiser
                        </button>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                        <div>
                            <label
                                className="field-label"
                                htmlFor="work-order-filter-status"
                            >
                                Statut
                            </label>
                            <select
                                id="work-order-filter-status"
                                className="input"
                                value={filters.status}
                                onChange={(event) =>
                                    setFilters((current) => ({
                                        ...current,
                                        status: event.target.value as
                                            | WorkOrderStatus
                                            | "",
                                    }))
                                }
                            >
                                <option value="">Tous les statuts</option>
                                {WORK_ORDER_STATUSES.map((status) => (
                                    <option key={status} value={status}>
                                        {WORK_ORDER_STATUS_LABELS[status]}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                className="field-label"
                                htmlFor="work-order-filter-date"
                            >
                                Date d’ouverture
                            </label>
                            <input
                                id="work-order-filter-date"
                                type="date"
                                className="input"
                                value={filters.date}
                                onChange={(event) =>
                                    setFilters((current) => ({
                                        ...current,
                                        date: event.target.value,
                                    }))
                                }
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary self-end"
                        >
                            Appliquer les filtres
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="alert-error" role="alert">
                        {error}
                    </div>
                )}

                {loadingOrders ? (
                    <div className="empty-state">
                        Chargement des ordres de réparation...
                    </div>
                ) : !result || result.content.length === 0 ? (
                    !error && (
                        <div className="empty-state">
                            {hasActiveFilters
                                ? "Aucun ordre de réparation ne correspond aux filtres sélectionnés."
                                : "Aucun ordre de réparation n’a encore été créé."}
                        </div>
                    )
                ) : (
                    <>
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-sm text-muted">
                                {result.totalElements} ordre
                                {result.totalElements !== 1 ? "s" : ""}
                            </p>
                            <p className="font-mono text-xs text-faint">
                                Page {result.page + 1} / {result.totalPages}
                            </p>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
                            <table className="w-full min-w-[1000px] text-left text-sm">
                                <caption className="sr-only">
                                    Liste des ordres de réparation
                                </caption>
                                <thead className="border-b border-line bg-surface-soft font-mono text-[0.65rem] tracking-wider text-faint uppercase">
                                    <tr>
                                        <th className="px-5 py-4">Client</th>
                                        <th className="px-5 py-4">Véhicule</th>
                                        <th className="px-5 py-4">Statut</th>
                                        <th className="px-5 py-4">
                                            Employé assigné
                                        </th>
                                        <th className="px-5 py-4">Ouvert le</th>
                                        <th className="px-5 py-4">Modifié le</th>
                                        <th className="px-5 py-4">
                                            <span className="sr-only">
                                                Action
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.content.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="border-b border-line/70 last:border-0 hover:bg-surface-raised"
                                        >
                                            <td className="px-5 py-4 font-medium">
                                                {order.customerName}
                                            </td>
                                            <td className="px-5 py-4 text-muted">
                                                {order.vehicleLabel}
                                            </td>
                                            <td className="px-5 py-4">
                                                <WorkOrderStatusBadge
                                                    status={order.status}
                                                />
                                            </td>
                                            <td className="px-5 py-4 text-muted">
                                                {order.assignedEmployeeName ??
                                                    "Non assigné"}
                                            </td>
                                            <td className="px-5 py-4 text-muted">
                                                {formatDateTime(order.openedAt)}
                                            </td>
                                            <td className="px-5 py-4 text-muted">
                                                {formatDateTime(order.updatedAt)}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <Link
                                                    href={`/employee/work-orders/${order.id}`}
                                                    className="btn-ghost px-3 py-2"
                                                >
                                                    Ouvrir le dossier
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <WorkOrderPagination
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
