"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

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
        return (
            <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
                <p className="text-neutral-400">Chargement...</p>
            </main>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <main className="min-h-screen bg-neutral-950 text-white">
            <header className="border-b border-white/10 bg-neutral-900">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                    <div>
                        <p className="text-sm text-neutral-400">Garage Jojo</p>
                        <h1 className="text-2xl font-bold">Dashboard</h1>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-200 transition hover:bg-white hover:text-neutral-950"
                    >
                        Déconnexion
                    </button>
                </div>
            </header>

            <section className="mx-auto max-w-6xl px-6 py-8">
                <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
                    <p className="text-neutral-400">Connecté en tant que</p>

                    <h2 className="mt-2 text-2xl font-bold">
                        {user.firstName} {user.lastName}
                    </h2>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl border border-white/10 bg-neutral-950 p-4">
                            <p className="text-sm text-neutral-500">Email</p>
                            <p className="mt-1">{user.email}</p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-neutral-950 p-4">
                            <p className="text-sm text-neutral-500">Rôle</p>
                            <p className="mt-1">{user.role}</p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-neutral-950 p-4">
                            <p className="text-sm text-neutral-500">ID</p>
                            <p className="mt-1 truncate">{user.id}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                    <Link
                        href="/dashboard/appointments"
                        className="rounded-2xl border border-white/10 bg-neutral-900 p-6 transition hover:border-white/30"
                    >
                        <h3 className="text-lg font-semibold">Rendez-vous</h3>
                        <p className="mt-2 text-sm text-neutral-400">
                            Prendre un rendez-vous et suivre tes demandes.
                        </p>
                    </Link>

                    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
                        <h3 className="text-lg font-semibold">Véhicules</h3>
                        <p className="mt-2 text-sm text-neutral-400">
                            Gestion des véhicules d’occasion.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
                        <h3 className="text-lg font-semibold">Factures</h3>
                        <p className="mt-2 text-sm text-neutral-400">
                            Documents, factures et uploads.
                        </p>
                    </div>
                </div>

                {(user.role === "ROLE_EMPLOYEE" || user.role === "ROLE_ADMIN") && (
                    <div className="mt-8">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                            Espace employé
                        </h3>

                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                            <Link
                                href="/employee/appointments"
                                className="rounded-2xl border border-white/10 bg-neutral-900 p-6 transition hover:border-white/30"
                            >
                                <h3 className="text-lg font-semibold">
                                    Rendez-vous du garage
                                </h3>
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