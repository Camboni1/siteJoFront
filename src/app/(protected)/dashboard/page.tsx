"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isAdmin, isStaff, ROLE_LABELS } from "@/features/auth/lib/roles";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [loading, user, router]);

    if (loading) {
        return <LoadingScreen />;
    }

    if (!user) {
        return null;
    }

    return (
        <main className="flex-1">
            <PageHeader title="Tableau de bord" />

            <section className="mx-auto max-w-6xl space-y-12 px-5 py-8 sm:px-6 sm:py-10">
                <div className="card reveal relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-48 w-48 translate-x-1/3 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" />
                    <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-end">
                        <div>
                            <p className="eyebrow">Espace personnel</p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                                Bonjour, {user.firstName}.
                            </h2>
                            <p className="mt-2 text-sm text-muted">
                                Retrouvez vos informations et gérez vos demandes
                                depuis cet espace.
                            </p>
                        </div>

                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/25 bg-accent/5 px-3 py-1.5 text-xs font-medium text-accent">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                            {ROLE_LABELS[user.role]}
                        </div>
                    </div>

                    <div className="relative mt-8 grid gap-3 border-t border-line pt-6 md:grid-cols-3">
                        <div className="surface-muted">
                            <p className="section-title">Nom complet</p>
                            <p className="mt-2 truncate text-sm font-medium">
                                {user.firstName} {user.lastName}
                            </p>
                        </div>

                        <div className="surface-muted">
                            <p className="section-title">Email</p>
                            <p className="mt-2 truncate text-sm font-medium">
                                {user.email}
                            </p>
                        </div>

                        <div className="surface-muted">
                            <p className="section-title">Identifiant</p>
                            <p className="mt-2 truncate font-mono text-xs text-muted">
                                {user.id}
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <p className="eyebrow">Accès rapide</p>
                            <h3 className="mt-2 text-xl font-semibold tracking-tight">
                                Mon espace
                            </h3>
                        </div>
                        <span className="hidden font-mono text-[0.65rem] tracking-[0.12em] text-faint uppercase sm:block">
                            CamboGarage / Client
                        </span>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <Link
                            href="/dashboard/appointments"
                            className="card-interactive group"
                        >
                            <div className="flex items-start justify-between">
                                <span className="grid h-10 w-10 place-items-center rounded-lg border border-accent/25 bg-accent/8 font-mono text-xs text-accent">
                                    RDV
                                </span>
                                <span
                                    aria-hidden
                                    className="text-faint transition group-hover:translate-x-1 group-hover:text-accent"
                                >
                                    →
                                </span>
                            </div>
                            <h3 className="mt-8 font-semibold">Rendez-vous</h3>
                            <p className="mt-2 text-sm leading-6 text-muted">
                                Prendre un rendez-vous et suivre vos demandes.
                            </p>
                        </Link>

                        <div className="card opacity-65">
                            <div className="flex items-start justify-between">
                                <span className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-surface-soft font-mono text-xs text-faint">
                                    AUTO
                                </span>
                                <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[0.6rem] text-faint uppercase">
                                    Bientôt
                                </span>
                            </div>
                            <h3 className="mt-8 font-semibold">Véhicules</h3>
                            <p className="mt-2 text-sm leading-6 text-muted">
                                Véhicules d&apos;occasion et dossier automobile.
                            </p>
                        </div>

                        <div className="card opacity-65">
                            <div className="flex items-start justify-between">
                                <span className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-surface-soft font-mono text-xs text-faint">
                                    DOC
                                </span>
                                <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[0.6rem] text-faint uppercase">
                                    Bientôt
                                </span>
                            </div>
                            <h3 className="mt-8 font-semibold">Factures</h3>
                            <p className="mt-2 text-sm leading-6 text-muted">
                                Documents et factures.
                            </p>
                        </div>
                    </div>
                </div>

                {isStaff(user) && (
                    <div>
                        <p className="eyebrow">Outils internes</p>
                        <h3 className="mt-2 text-xl font-semibold tracking-tight">
                            Espace employé
                        </h3>

                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                            <Link
                                href="/employee/appointments"
                                className="card-interactive group"
                            >
                                <div className="flex items-start justify-between">
                                    <span className="grid h-10 w-10 place-items-center rounded-lg border border-accent/25 bg-accent/8 font-mono text-xs text-accent">
                                        PRO
                                    </span>
                                    <span
                                        aria-hidden
                                        className="text-faint transition group-hover:translate-x-1 group-hover:text-accent"
                                    >
                                        →
                                    </span>
                                </div>
                                <h3 className="mt-8 font-semibold">
                                    Planning du garage
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-muted">
                                    Confirmer, annuler et clôturer les
                                    rendez-vous des clients.
                                </p>
                            </Link>

                            <Link
                                href="/employee/customers"
                                className="card-interactive group"
                            >
                                <div className="flex items-start justify-between">
                                    <span className="grid h-10 w-10 place-items-center rounded-lg border border-accent/25 bg-accent/8 font-mono text-xs text-accent">
                                        CLI
                                    </span>
                                    <span
                                        aria-hidden
                                        className="text-faint transition group-hover:translate-x-1 group-hover:text-accent"
                                    >
                                        →
                                    </span>
                                </div>
                                <h3 className="mt-8 font-semibold">Clients</h3>
                                <p className="mt-2 text-sm leading-6 text-muted">
                                    Rechercher, créer et mettre à jour les
                                    fiches clients.
                                </p>
                            </Link>

                            <Link
                                href="/employee/services"
                                className="card-interactive group"
                            >
                                <div className="flex items-start justify-between">
                                    <span className="grid h-10 w-10 place-items-center rounded-lg border border-accent/25 bg-accent/8 font-mono text-xs text-accent">
                                        SRV
                                    </span>
                                    <span
                                        aria-hidden
                                        className="text-faint transition group-hover:translate-x-1 group-hover:text-accent"
                                    >
                                        →
                                    </span>
                                </div>
                                <h3 className="mt-8 font-semibold">
                                    Prestations
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-muted">
                                    Gérer le catalogue, les prix et les durées
                                    des interventions.
                                </p>
                            </Link>

                            {isAdmin(user) && (
                                <Link
                                    href="/admin/users"
                                    className="card-interactive group"
                                >
                                    <div className="flex items-start justify-between">
                                        <span className="grid h-10 w-10 place-items-center rounded-lg border border-accent/25 bg-accent/8 font-mono text-xs text-accent">
                                            ADM
                                        </span>
                                        <span
                                            aria-hidden
                                            className="text-faint transition group-hover:translate-x-1 group-hover:text-accent"
                                        >
                                            →
                                        </span>
                                    </div>
                                    <h3 className="mt-8 font-semibold">
                                        Utilisateurs
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-muted">
                                        Créer les comptes, gérer les rôles et
                                        les accès.
                                    </p>
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}
