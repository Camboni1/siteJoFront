"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isStaff } from "@/features/auth/lib/roles";
import { isApiError } from "@/lib/api";
import * as customersApi from "@/features/customers/api/customers-api";
import type { Customer } from "@/features/customers/types/customer.types";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function EmployeeCustomerDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { user, loading } = useAuth();

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loadingCustomer, setLoadingCustomer] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        if (!user || !isStaff(user) || !params.id) {
            return;
        }

        customersApi
            .getCustomer(params.id)
            .then(setCustomer)
            .catch((error) => {
                if (isApiError(error, 401)) {
                    router.push("/login");
                    return;
                }

                setError(
                    error instanceof Error
                        ? error.message
                        : "Client introuvable"
                );
            })
            .finally(() => setLoadingCustomer(false));
    }, [user, params.id, router]);

    if (loading || !user || !isStaff(user)) {
        return <LoadingScreen />;
    }

    const fullAddress = customer
        ? [
              customer.street,
              [customer.postalCode, customer.city].filter(Boolean).join(" "),
              customer.country,
          ].filter(Boolean)
        : [];

    return (
        <main className="flex-1">
            <PageHeader
                title="Fiche client"
                backHref="/employee/customers"
                backLabel="Clients du garage"
            />

            <section className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-6 sm:py-10">
                {error && <div className="alert-error">{error}</div>}

                {loadingCustomer ? (
                    <div className="empty-state">Chargement...</div>
                ) : !customer ? (
                    <div className="empty-state">
                        Ce client est introuvable.
                    </div>
                ) : (
                    <>
                        <div className="card relative overflow-hidden">
                            <div className="absolute top-0 right-0 h-40 w-40 translate-x-1/3 -translate-y-1/2 rounded-full bg-accent/8 blur-3xl" />
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="relative">
                                    <p className="eyebrow">Client</p>
                                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                                        {customer.firstName} {customer.lastName}
                                    </p>
                                    <p className="mt-2 font-mono text-xs text-muted">
                                        Créé le{" "}
                                        {formatDateTime(customer.createdAt)}
                                    </p>
                                    <p className="mt-1 font-mono text-xs text-muted">
                                        Modifié le{" "}
                                        {formatDateTime(customer.updatedAt)}
                                    </p>
                                </div>

                                <span
                                    className={
                                        customer.appUserId
                                            ? "inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/5 px-3 py-1.5 text-xs font-medium text-accent"
                                            : "inline-flex items-center gap-2 rounded-full border border-line bg-surface-soft px-3 py-1.5 text-xs font-medium text-muted"
                                    }
                                >
                                    <span
                                        className={
                                            customer.appUserId
                                                ? "h-1.5 w-1.5 rounded-full bg-accent"
                                                : "h-1.5 w-1.5 rounded-full bg-faint"
                                        }
                                    />
                                    {customer.appUserId
                                        ? "Compte en ligne lié"
                                        : "Sans compte en ligne"}
                                </span>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link
                                    href={`/employee/customers/${customer.id}/edit`}
                                    className="btn-primary"
                                >
                                    Modifier la fiche
                                </Link>
                            </div>
                        </div>

                        <div className="card">
                            <p className="section-title">Contact</p>
                            <h2 className="mt-2 text-lg font-semibold">
                                Coordonnées
                            </h2>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <InfoField
                                    label="Email"
                                    value={customer.email}
                                />
                                <InfoField
                                    label="Téléphone"
                                    value={customer.phone}
                                />
                            </div>
                        </div>

                        <div className="card">
                            <p className="section-title">Localisation</p>
                            <h2 className="mt-2 text-lg font-semibold">
                                Adresse
                            </h2>

                            {fullAddress.length > 0 ? (
                                <p className="mt-4 text-sm leading-6">
                                    {fullAddress.map((line) => (
                                        <span
                                            key={line}
                                            className="block font-medium"
                                        >
                                            {line}
                                        </span>
                                    ))}
                                </p>
                            ) : (
                                <p className="mt-4 text-sm text-muted">
                                    Aucune adresse renseignée.
                                </p>
                            )}
                        </div>

                        <div className="card">
                            <p className="section-title">Facturation</p>
                            <h2 className="mt-2 text-lg font-semibold">
                                Numéro de TVA
                            </h2>
                            <p className="mt-4 font-mono text-sm font-medium">
                                {customer.vatNumber ?? "—"}
                            </p>
                        </div>

                        {customer.notes && (
                            <div className="card">
                                <p className="section-title">Suivi</p>
                                <h2 className="mt-2 text-lg font-semibold">
                                    Notes internes
                                </h2>
                                <p className="mt-4 whitespace-pre-line border-l-2 border-accent/40 pl-4 text-sm leading-6 text-muted">
                                    {customer.notes}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </section>
        </main>
    );
}

function InfoField({
    label,
    value,
}: {
    label: string;
    value: string | null | undefined;
}) {
    return (
        <div className="surface-muted">
            <p className="section-title">{label}</p>
            <p className="mt-2 text-sm font-medium">{value || "—"}</p>
        </div>
    );
}
