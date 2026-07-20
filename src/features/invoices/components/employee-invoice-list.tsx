"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
    usePathname,
    useRouter,
    useSearchParams,
} from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isStaff } from "@/features/auth/lib/roles";
import { isApiError } from "@/lib/api";
import { formatCurrency, formatDateShort } from "@/lib/format";
import * as customersApi from "@/features/customers/api/customers-api";
import type { Customer } from "@/features/customers/types/customer.types";
import * as invoicesApi from "@/features/invoices/api/invoices-api";
import type {
    EmployeeInvoiceFilters,
    InvoiceResponse,
    InvoiceStatus,
    PageResponse,
} from "@/features/invoices/types/invoice.types";
import {
    INVOICE_FILTER_STATUSES,
    INVOICE_STATUS_LABELS,
} from "@/features/invoices/lib/invoice-status";
import { InvoiceStatusBadge } from "@/features/invoices/components/invoice-status-badge";
import { InvoicePagination } from "@/features/invoices/components/invoice-pagination";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingScreen } from "@/components/ui/loading-screen";

const PAGE_SIZE = 20;
const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type FilterValues = {
    customerId: string;
    invoiceNumber: string;
    status: string;
    dateFrom: string;
    dateTo: string;
};

function isFilterStatus(value: string): value is InvoiceStatus {
    return (INVOICE_FILTER_STATUSES as string[]).includes(value);
}

// Les paramètres d'URL sont assainis pour n'envoyer au backend que des
// valeurs qu'il sait interpréter (UUID, statut connu, date ISO).
function sanitizedFilters(search: URLSearchParams): FilterValues {
    const customerId = search.get("customerId") ?? "";
    const status = search.get("status") ?? "";
    const dateFrom = search.get("dateFrom") ?? "";
    const dateTo = search.get("dateTo") ?? "";

    return {
        customerId: UUID_PATTERN.test(customerId) ? customerId : "",
        invoiceNumber: search.get("invoiceNumber") ?? "",
        status: isFilterStatus(status) ? status : "",
        dateFrom: DATE_PATTERN.test(dateFrom) ? dateFrom : "",
        dateTo: DATE_PATTERN.test(dateTo) ? dateTo : "",
    };
}

function nonNegativeInteger(value: string | null) {
    if (!value?.trim()) {
        return 0;
    }

    const parsed = Number(value);

    return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function requestFromSearch(search: URLSearchParams): EmployeeInvoiceFilters {
    const filters = sanitizedFilters(search);

    return {
        customerId: filters.customerId || undefined,
        invoiceNumber: filters.invoiceNumber.trim() || undefined,
        status: isFilterStatus(filters.status) ? filters.status : undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        page: nonNegativeInteger(search.get("page")),
        size: PAGE_SIZE,
    };
}

function customerDisplayName(invoice: InvoiceResponse) {
    return (
        [invoice.customer.firstName, invoice.customer.lastName]
            .filter(Boolean)
            .join(" ") || "—"
    );
}

export function EmployeeInvoiceList() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const searchParams = useSearchParams();
    const searchKey = searchParams.toString();

    const [customers, setCustomers] = useState<Customer[] | null>(null);

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

        customersApi
            .getCustomers()
            .then((result) => {
                if (!ignore) {
                    setCustomers(
                        [...result].sort((a, b) =>
                            `${a.lastName} ${a.firstName}`.localeCompare(
                                `${b.lastName} ${b.firstName}`,
                                "fr",
                                { sensitivity: "base" }
                            )
                        )
                    );
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

                if (isApiError(error, 403)) {
                    router.push("/dashboard");
                    return;
                }

                // Le filtre client devient indisponible mais la liste reste utilisable.
                setCustomers([]);
            });

        return () => {
            ignore = true;
        };
    }, [user, router]);

    if (loading || !user || !isStaff(user)) {
        return <LoadingScreen />;
    }

    return (
        <EmployeeInvoiceListContent
            key={searchKey}
            searchKey={searchKey}
            customers={customers}
        />
    );
}

function EmployeeInvoiceListContent({
    searchKey,
    customers,
}: {
    searchKey: string;
    customers: Customer[] | null;
}) {
    const router = useRouter();
    const pathname = usePathname();

    const [filters, setFilters] = useState<FilterValues>(() =>
        sanitizedFilters(new URLSearchParams(searchKey))
    );
    const [result, setResult] = useState<PageResponse<InvoiceResponse> | null>(
        null
    );
    const [loadingInvoices, setLoadingInvoices] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        invoicesApi
            .getEmployeeInvoices(
                requestFromSearch(new URLSearchParams(searchKey))
            )
            .then((page) => {
                if (!ignore) {
                    setResult(page);
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

                setResult(null);
                setError(
                    requestError instanceof Error
                        ? requestError.message
                        : "Impossible de charger les factures"
                );
            })
            .finally(() => {
                if (!ignore) {
                    setLoadingInvoices(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, [searchKey, router]);

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
        setFilters({
            customerId: "",
            invoiceNumber: "",
            status: "",
            dateFrom: "",
            dateTo: "",
        });
        router.push(pathname);
    }

    function changePage(page: number) {
        const search = new URLSearchParams(searchKey);
        search.set("page", String(page));
        router.push(`${pathname}?${search.toString()}`);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    const hasActiveFilters = Object.values(
        sanitizedFilters(new URLSearchParams(searchKey))
    ).some((value) => value.trim() !== "");

    return (
        <main className="flex-1">
            <PageHeader
                title="Factures"
                backHref="/dashboard"
                backLabel="Tableau de bord"
            />

            <section className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-6 sm:py-10">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="eyebrow">Gestion atelier</p>
                        <h2 className="mt-2 text-xl font-semibold tracking-tight">
                            Factures sortantes
                        </h2>
                    </div>
                    <Link
                        href="/employee/invoices/new"
                        className="btn-primary w-fit"
                    >
                        Nouvelle facture
                        <span aria-hidden>+</span>
                    </Link>
                </div>

                <form onSubmit={applyFilters} className="card" noValidate>
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <p className="section-title">Recherche</p>
                            <h3 className="mt-2 text-lg font-semibold">
                                Filtrer les factures
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

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label
                                className="field-label"
                                htmlFor="invoice-filter-customer"
                            >
                                Client
                            </label>
                            <select
                                id="invoice-filter-customer"
                                className="input"
                                value={filters.customerId}
                                onChange={(event) =>
                                    updateFilter(
                                        "customerId",
                                        event.target.value
                                    )
                                }
                                disabled={customers === null}
                            >
                                <option value="">
                                    {customers === null
                                        ? "Chargement des clients..."
                                        : "Tous les clients"}
                                </option>
                                {(customers ?? []).map((customer) => (
                                    <option
                                        key={customer.id}
                                        value={customer.id}
                                    >
                                        {customer.lastName} {customer.firstName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                className="field-label"
                                htmlFor="invoice-filter-number"
                            >
                                Numéro
                            </label>
                            <input
                                id="invoice-filter-number"
                                type="search"
                                className="input"
                                value={filters.invoiceNumber}
                                onChange={(event) =>
                                    updateFilter(
                                        "invoiceNumber",
                                        event.target.value
                                    )
                                }
                                placeholder="Numéro de facture"
                            />
                        </div>

                        <div>
                            <label
                                className="field-label"
                                htmlFor="invoice-filter-status"
                            >
                                Statut
                            </label>
                            <select
                                id="invoice-filter-status"
                                className="input"
                                value={filters.status}
                                onChange={(event) =>
                                    updateFilter("status", event.target.value)
                                }
                            >
                                <option value="">Tous les statuts</option>
                                {INVOICE_FILTER_STATUSES.map((status) => (
                                    <option key={status} value={status}>
                                        {INVOICE_STATUS_LABELS[status]}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                className="field-label"
                                htmlFor="invoice-filter-date-from"
                            >
                                Émises à partir du
                            </label>
                            <input
                                id="invoice-filter-date-from"
                                type="date"
                                className="input"
                                value={filters.dateFrom}
                                onChange={(event) =>
                                    updateFilter("dateFrom", event.target.value)
                                }
                            />
                        </div>

                        <div>
                            <label
                                className="field-label"
                                htmlFor="invoice-filter-date-to"
                            >
                                Émises jusqu&apos;au
                            </label>
                            <input
                                id="invoice-filter-date-to"
                                type="date"
                                className="input"
                                value={filters.dateTo}
                                onChange={(event) =>
                                    updateFilter("dateTo", event.target.value)
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

                {loadingInvoices ? (
                    <div className="empty-state">
                        Chargement des factures...
                    </div>
                ) : !result || result.content.length === 0 ? (
                    !error && (
                        <div className="empty-state">
                            {hasActiveFilters
                                ? "Aucune facture ne correspond à ces critères."
                                : "Aucune facture enregistrée pour le moment."}
                        </div>
                    )
                ) : (
                    <>
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-sm text-muted">
                                {result.totalElements} facture
                                {result.totalElements !== 1 ? "s" : ""}
                            </p>
                            <p className="font-mono text-xs text-faint">
                                Page {result.page + 1} / {result.totalPages}
                            </p>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
                            <table className="w-full text-left text-sm">
                                <caption className="sr-only">
                                    Liste des factures sortantes
                                </caption>
                                <thead className="border-b border-line bg-surface-soft font-mono text-[0.65rem] tracking-wider text-faint uppercase">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 font-semibold"
                                        >
                                            Numéro
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 font-semibold"
                                        >
                                            Client
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 font-semibold"
                                        >
                                            Date
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 font-semibold"
                                        >
                                            Échéance
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 font-semibold"
                                        >
                                            Statut
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 text-right font-semibold"
                                        >
                                            Total TVAC
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.content.map((invoice) => (
                                        <tr
                                            key={invoice.id}
                                            onClick={() =>
                                                router.push(
                                                    `/employee/invoices/${invoice.id}`
                                                )
                                            }
                                            className="cursor-pointer border-b border-line/70 transition last:border-b-0 hover:bg-surface-raised"
                                        >
                                            <td className="px-6 py-4 font-mono text-xs font-medium">
                                                <Link
                                                    href={`/employee/invoices/${invoice.id}`}
                                                    className="hover:text-accent"
                                                    onClick={(event) =>
                                                        event.stopPropagation()
                                                    }
                                                >
                                                    {invoice.invoiceNumber}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 font-medium">
                                                {customerDisplayName(invoice)}
                                            </td>
                                            <td className="px-6 py-4 text-muted">
                                                {formatDateShort(
                                                    invoice.invoiceDate
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-muted">
                                                {invoice.dueDate
                                                    ? formatDateShort(
                                                          invoice.dueDate
                                                      )
                                                    : "—"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <InvoiceStatusBadge
                                                    status={invoice.status}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium">
                                                {formatCurrency(
                                                    invoice.amountIncludingVat,
                                                    invoice.currency
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <InvoicePagination
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
