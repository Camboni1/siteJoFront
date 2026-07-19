"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isStaff } from "@/features/auth/lib/roles";
import { isApiError } from "@/lib/api";
import * as customersApi from "@/features/customers/api/customers-api";
import type { Customer } from "@/features/customers/types/customer.types";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingScreen } from "@/components/ui/loading-screen";

const SEARCH_DEBOUNCE_MS = 300;

export default function EmployeeCustomersPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loadedSearch, setLoadedSearch] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const loadingCustomers = loadedSearch !== debouncedSearch;

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
        const timer = setTimeout(
            () => setDebouncedSearch(search),
            SEARCH_DEBOUNCE_MS
        );

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (!user || !isStaff(user)) {
            return;
        }

        let ignore = false;

        customersApi
            .getCustomers(debouncedSearch)
            .then((result) => {
                if (!ignore) {
                    setCustomers(result);
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
                        : "Impossible de charger les clients"
                );
            })
            .finally(() => {
                if (!ignore) {
                    setLoadedSearch(debouncedSearch);
                }
            });

        return () => {
            ignore = true;
        };
    }, [user, debouncedSearch, router]);

    if (loading || !user || !isStaff(user)) {
        return <LoadingScreen />;
    }

    return (
        <main className="flex-1">
            <PageHeader
                title="Clients du garage"
                backHref="/dashboard"
                backLabel="Tableau de bord"
            />

            <section className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-6 sm:py-10">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="eyebrow">Gestion atelier</p>
                        <h2 className="mt-2 text-xl font-semibold tracking-tight">
                            Tous les clients
                        </h2>
                    </div>
                    <Link
                        href="/employee/customers/new"
                        className="btn-primary w-fit"
                    >
                        Nouveau client
                        <span aria-hidden>+</span>
                    </Link>
                </div>

                <div className="card flex flex-wrap items-end gap-4 p-4">
                    <div className="min-w-64 flex-1">
                        <label
                            className="field-label"
                            htmlFor="customer-search"
                        >
                            Recherche
                        </label>
                        <input
                            id="customer-search"
                            type="search"
                            className="input py-2.5"
                            placeholder="Nom, prénom, email, téléphone ou TVA..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                        />
                    </div>

                    <span className="mb-1 rounded-full border border-line bg-surface-soft px-3 py-1 font-mono text-xs text-muted">
                        {String(customers.length).padStart(2, "0")} résultat
                        {customers.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {error && <div className="alert-error">{error}</div>}

                {loadingCustomers ? (
                    <div className="empty-state">Chargement des clients...</div>
                ) : customers.length === 0 ? (
                    <div className="empty-state">
                        {debouncedSearch.trim()
                            ? "Aucun client ne correspond à cette recherche."
                            : "Aucun client enregistré pour le moment."}
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-line bg-surface-soft font-mono text-[0.65rem] tracking-wider text-faint uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">
                                        Nom
                                    </th>
                                    <th className="px-6 py-4 font-semibold">
                                        Email
                                    </th>
                                    <th className="px-6 py-4 font-semibold">
                                        Téléphone
                                    </th>
                                    <th className="px-6 py-4 font-semibold">
                                        Ville
                                    </th>
                                    <th className="px-6 py-4 font-semibold">
                                        TVA
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((customer) => (
                                    <tr
                                        key={customer.id}
                                        onClick={() =>
                                            router.push(
                                                `/employee/customers/${customer.id}`
                                            )
                                        }
                                        className="cursor-pointer border-b border-line/70 transition last:border-b-0 hover:bg-surface-raised"
                                    >
                                        <td className="px-6 py-4 font-medium">
                                            <Link
                                                href={`/employee/customers/${customer.id}`}
                                                className="hover:text-accent"
                                                onClick={(event) =>
                                                    event.stopPropagation()
                                                }
                                            >
                                                {customer.lastName}{" "}
                                                {customer.firstName}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-muted">
                                            {customer.email ?? "—"}
                                        </td>
                                        <td className="px-6 py-4 text-muted">
                                            {customer.phone ?? "—"}
                                        </td>
                                        <td className="px-6 py-4 text-muted">
                                            {customer.city ?? "—"}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-muted">
                                            {customer.vatNumber ?? "—"}
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
