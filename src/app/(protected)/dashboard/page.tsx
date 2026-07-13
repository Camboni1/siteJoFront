"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isStaff, ROLE_LABELS } from "@/features/auth/lib/roles";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading, logout } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [loading, user, router]);

    async function handleLogout() {
        await logout();
        router.push("/login");
        router.refresh();
    }

    if (loading) {
        return <LoadingScreen />;
    }

    if (!user) {
        return null;
    }

    return (
        <main className="min-h-screen">
            <PageHeader
                title="Dashboard"
                action={
                    <button onClick={handleLogout} className="btn-ghost">
                        Déconnexion
                    </button>
                }
            />

            <section className="mx-auto max-w-6xl space-y-10 px-6 py-10">
                <div className="card">
                    <p className="text-sm text-neutral-400">
                        Connecté en tant que
                    </p>

                    <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                        {user.firstName} {user.lastName}
                    </h2>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl border border-white/10 bg-neutral-950/60 p-4">
                            <p className="text-xs text-neutral-500">Email</p>
                            <p className="mt-1 truncate text-sm">
                                {user.email}
                            </p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-neutral-950/60 p-4">
                            <p className="text-xs text-neutral-500">Rôle</p>
                            <p className="mt-1 text-sm">
                                {ROLE_LABELS[user.role]}
                            </p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-neutral-950/60 p-4">
                            <p className="text-xs text-neutral-500">
                                Identifiant
                            </p>
                            <p className="mt-1 truncate text-sm text-neutral-400">
                                {user.id}
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="section-title">Mon espace</h3>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <Link
                            href="/dashboard/appointments"
                            className="card group transition hover:border-white/25"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Rendez-vous</h3>
                                <span
                                    aria-hidden
                                    className="text-neutral-500 transition group-hover:translate-x-1 group-hover:text-white"
                                >
                                    →
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-neutral-400">
                                Prendre un rendez-vous et suivre tes demandes.
                            </p>
                        </Link>

                        <div className="card opacity-60">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Véhicules</h3>
                                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-neutral-500">
                                    Bientôt
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-neutral-400">
                                Véhicules d&apos;occasion du garage.
                            </p>
                        </div>

                        <div className="card opacity-60">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Factures</h3>
                                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-neutral-500">
                                    Bientôt
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-neutral-400">
                                Documents et factures.
                            </p>
                        </div>
                    </div>
                </div>

                {isStaff(user) && (
                    <div>
                        <h3 className="section-title">Espace employé</h3>

                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                            <Link
                                href="/employee/appointments"
                                className="card group transition hover:border-white/25"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">
                                        Rendez-vous du garage
                                    </h3>
                                    <span
                                        aria-hidden
                                        className="text-neutral-500 transition group-hover:translate-x-1 group-hover:text-white"
                                    >
                                        →
                                    </span>
                                </div>
                                <p className="mt-2 text-sm text-neutral-400">
                                    Confirmer, annuler et clôturer les
                                    rendez-vous des clients.
                                </p>
                            </Link>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}
