"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isAdmin, ROLE_LABELS } from "@/features/auth/lib/roles";
import type { UserRole } from "@/features/auth/types/auth.types";
import { isApiError } from "@/lib/api";
import * as usersApi from "@/features/users/api/users-api";
import type { AdminUser } from "@/features/users/types/user.types";
import {
    UserEnabledBadge,
    UserRoleBadge,
} from "@/features/users/components/user-badges";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingScreen } from "@/components/ui/loading-screen";

const ALL_ROLES = Object.keys(ROLE_LABELS) as UserRole[];

type StatusFilter = "" | "enabled" | "disabled";

export default function AdminUsersPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("");

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!user) {
            router.push("/login");
        } else if (!isAdmin(user)) {
            router.push("/dashboard");
        }
    }, [loading, user, router]);

    useEffect(() => {
        if (!user || !isAdmin(user)) {
            return;
        }

        let ignore = false;

        usersApi
            .getUsers()
            .then((result) => {
                if (!ignore) {
                    setUsers(result);
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
                        : "Impossible de charger les utilisateurs"
                );
            })
            .finally(() => {
                if (!ignore) {
                    setLoadingUsers(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, [user, router]);

    async function handleToggleEnabled(target: AdminUser) {
        setError(null);
        setSuccess(null);

        if (target.enabled) {
            const isSelf = target.id === user?.id;
            const message = isSelf
                ? `Vous êtes sur le point de désactiver VOTRE PROPRE compte (${target.email}). Vous perdrez immédiatement l'accès à l'application. Continuer ?`
                : `Désactiver le compte de ${target.firstName} ${target.lastName} (${target.email}) ? Cette personne ne pourra plus se connecter.`;

            if (!window.confirm(message)) {
                return;
            }
        }

        setTogglingId(target.id);

        try {
            const updated = await usersApi.updateUserEnabled(
                target.id,
                !target.enabled
            );

            setUsers((current) =>
                current.map((item) =>
                    item.id === updated.id ? updated : item
                )
            );
            setSuccess(
                updated.enabled
                    ? `Le compte de ${updated.firstName} ${updated.lastName} est réactivé.`
                    : `Le compte de ${updated.firstName} ${updated.lastName} est désactivé.`
            );
        } catch (error) {
            if (isApiError(error, 401)) {
                router.push("/login");
                return;
            }

            setError(
                error instanceof Error
                    ? error.message
                    : "Impossible de modifier ce compte"
            );
        } finally {
            setTogglingId(null);
        }
    }

    if (loading || !user || !isAdmin(user)) {
        return <LoadingScreen />;
    }

    const normalizedSearch = search.trim().toLowerCase();

    const filtered = users.filter((item) => {
        if (roleFilter && item.role !== roleFilter) {
            return false;
        }

        if (statusFilter === "enabled" && !item.enabled) {
            return false;
        }

        if (statusFilter === "disabled" && item.enabled) {
            return false;
        }

        if (!normalizedSearch) {
            return true;
        }

        return (
            item.firstName.toLowerCase().includes(normalizedSearch) ||
            item.lastName.toLowerCase().includes(normalizedSearch) ||
            item.email.toLowerCase().includes(normalizedSearch)
        );
    });

    return (
        <main className="flex-1">
            <PageHeader
                title="Utilisateurs"
                backHref="/dashboard"
                backLabel="Tableau de bord"
            />

            <section className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-6 sm:py-10">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="eyebrow">Administration</p>
                        <h2 className="mt-2 text-xl font-semibold tracking-tight">
                            Comptes de l&apos;application
                        </h2>
                    </div>
                    <Link
                        href="/admin/users/new"
                        className="btn-primary w-fit"
                    >
                        Nouvel utilisateur
                        <span aria-hidden>+</span>
                    </Link>
                </div>

                <div className="card flex flex-wrap items-end gap-4 p-4">
                    <div className="min-w-56 flex-1">
                        <label className="field-label" htmlFor="user-search">
                            Recherche
                        </label>
                        <input
                            id="user-search"
                            type="search"
                            className="input py-2.5"
                            placeholder="Nom, prénom ou email..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                        />
                    </div>

                    <div className="min-w-40 flex-1 sm:flex-none">
                        <label className="field-label" htmlFor="user-role">
                            Rôle
                        </label>
                        <select
                            id="user-role"
                            className="input py-2.5"
                            value={roleFilter}
                            onChange={(event) =>
                                setRoleFilter(
                                    event.target.value as UserRole | ""
                                )
                            }
                        >
                            <option value="">Tous les rôles</option>
                            {ALL_ROLES.map((role) => (
                                <option key={role} value={role}>
                                    {ROLE_LABELS[role]}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="min-w-40 flex-1 sm:flex-none">
                        <label className="field-label" htmlFor="user-status">
                            État
                        </label>
                        <select
                            id="user-status"
                            className="input py-2.5"
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target.value as StatusFilter
                                )
                            }
                        >
                            <option value="">Tous</option>
                            <option value="enabled">Actifs</option>
                            <option value="disabled">Désactivés</option>
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

                {loadingUsers ? (
                    <div className="empty-state">
                        Chargement des utilisateurs...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        {users.length === 0
                            ? "Aucun utilisateur enregistré."
                            : "Aucun utilisateur ne correspond aux filtres."}
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
                                        Rôle
                                    </th>
                                    <th className="px-6 py-4 font-semibold">
                                        État
                                    </th>
                                    <th className="px-6 py-4 font-semibold">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item) => (
                                    <tr
                                        key={item.id}
                                        onClick={() =>
                                            router.push(
                                                `/admin/users/${item.id}/edit`
                                            )
                                        }
                                        className="cursor-pointer border-b border-line/70 transition last:border-b-0 hover:bg-surface-raised"
                                    >
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/admin/users/${item.id}/edit`}
                                                className="font-medium hover:text-accent"
                                                onClick={(event) =>
                                                    event.stopPropagation()
                                                }
                                            >
                                                {item.lastName}{" "}
                                                {item.firstName}
                                            </Link>
                                            {item.id === user.id && (
                                                <span className="ml-2 font-mono text-[0.65rem] text-accent">
                                                    (vous)
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-muted">
                                            {item.email}
                                        </td>
                                        <td className="px-6 py-4">
                                            <UserRoleBadge role={item.role} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <UserEnabledBadge
                                                enabled={item.enabled}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    void handleToggleEnabled(
                                                        item
                                                    );
                                                }}
                                                disabled={
                                                    togglingId === item.id
                                                }
                                                className="btn-ghost px-3 py-2 text-xs"
                                            >
                                                {togglingId === item.id
                                                    ? "..."
                                                    : item.enabled
                                                      ? "Désactiver"
                                                      : "Réactiver"}
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
