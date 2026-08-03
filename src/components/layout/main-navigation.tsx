"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import {
    navigationForUser,
    type NavigationItem,
} from "@/components/layout/navigation-items";

const COMPACT_NAVIGATION_ID = "main-navigation-panel";
const SECONDARY_NAVIGATION_ID = "secondary-navigation-panel";

export function MainNavigation() {
    const pathname = usePathname();

    return <MainNavigationContent key={pathname} pathname={pathname} />;
}

function MainNavigationContent({ pathname }: { pathname: string }) {
    const router = useRouter();
    const { user, loading, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const [logoutPending, setLogoutPending] = useState(false);
    const [logoutError, setLogoutError] = useState<string | null>(null);
    const desktopButtonRef = useRef<HTMLButtonElement>(null);
    const compactButtonRef = useRef<HTMLButtonElement>(null);
    const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
    const navigation = loading
        ? { primary: [], secondary: [], menuLabel: "Menu" }
        : navigationForUser(user);

    useEffect(() => {
        if (!open) {
            return;
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key !== "Escape") {
                return;
            }

            event.preventDefault();
            setOpen(false);
            lastTriggerRef.current?.focus();
        }

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [open]);

    function isActive(item: NavigationItem) {
        if (item.href.includes("#")) {
            return false;
        }

        return item.exact
            ? pathname === item.href
            : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
    }

    function closeNavigation() {
        setOpen(false);
    }

    function toggleNavigation(trigger: HTMLButtonElement) {
        lastTriggerRef.current = trigger;
        setOpen((current) => !current);
    }

    const secondaryActive = navigation.secondary.some(isActive);

    async function handleLogout() {
        setLogoutError(null);
        setLogoutPending(true);

        try {
            await logout();
            closeNavigation();
            router.push("/login");
            router.refresh();
        } catch {
            setLogoutError(
                "Déconnexion impossible pour le moment. Veuillez réessayer."
            );
        } finally {
            setLogoutPending(false);
        }
    }

    return (
        <div className="relative ml-auto flex min-w-0 items-center gap-2">
            <button
                ref={compactButtonRef}
                type="button"
                className="btn-ghost px-3 py-2 xl:hidden"
                aria-label={
                    open
                        ? "Fermer la navigation"
                        : "Ouvrir la navigation"
                }
                aria-expanded={open}
                aria-controls={COMPACT_NAVIGATION_ID}
                aria-haspopup="true"
                disabled={loading}
                onClick={(event) => toggleNavigation(event.currentTarget)}
            >
                <span
                    className="flex w-4 flex-col gap-1"
                    aria-hidden="true"
                >
                    <span
                        className={`h-px w-full bg-current transition ${
                            open ? "translate-y-1 rotate-45" : ""
                        }`}
                    />
                    <span
                        className={`h-px w-full bg-current transition ${
                            open ? "opacity-0" : ""
                        }`}
                    />
                    <span
                        className={`h-px w-full bg-current transition ${
                            open ? "-translate-y-1 -rotate-45" : ""
                        }`}
                    />
                </span>
                <span>Menu</span>
            </button>

            <nav
                id={COMPACT_NAVIGATION_ID}
                aria-label="Navigation principale"
                className={`${
                    open
                        ? "absolute top-[calc(100%+1.25rem)] right-0 z-30 flex"
                        : "hidden"
                } max-h-[calc(100vh-5rem)] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-y-auto overscroll-contain rounded-2xl border border-line bg-surface p-2 shadow-[0_24px_70px_rgba(0,0,0,0.4)] xl:static xl:z-auto xl:flex xl:max-h-none xl:w-auto xl:flex-row xl:items-center xl:overflow-visible xl:rounded-none xl:border-0 xl:bg-transparent xl:p-0 xl:shadow-none`}
            >
                <ul className="grid gap-1 xl:flex xl:items-center">
                    {navigation.primary.map((item) => (
                        <NavigationLink
                            key={item.href}
                            item={item}
                            active={isActive(item)}
                            onNavigate={closeNavigation}
                        />
                    ))}
                </ul>

                {navigation.secondary.length > 0 && (
                    <div className="relative xl:ml-1">
                        <button
                            ref={desktopButtonRef}
                            type="button"
                            className={
                                open || secondaryActive
                                    ? "site-nav-link-active hidden xl:inline-flex"
                                    : "site-nav-link hidden xl:inline-flex"
                            }
                            aria-expanded={open}
                            aria-controls={SECONDARY_NAVIGATION_ID}
                            aria-haspopup="true"
                            onClick={(event) =>
                                toggleNavigation(event.currentTarget)
                            }
                        >
                            {navigation.menuLabel}
                            <span
                                aria-hidden="true"
                                className={`text-xs transition ${
                                    open ? "rotate-180" : ""
                                }`}
                            >
                                ▾
                            </span>
                        </button>

                        <div
                            id={SECONDARY_NAVIGATION_ID}
                            hidden={!open}
                            className="mt-2 border-t border-line px-1 pt-2 xl:absolute xl:top-12 xl:right-0 xl:z-30 xl:mt-0 xl:w-72 xl:rounded-2xl xl:border xl:bg-surface xl:p-2 xl:shadow-[0_24px_70px_rgba(0,0,0,0.4)]"
                        >
                            <p className="px-3 py-2 font-mono text-[0.65rem] font-semibold tracking-[0.14em] text-faint uppercase">
                                {navigation.menuLabel}
                            </p>
                            <ul className="grid gap-1">
                                {navigation.secondary.map((item) => (
                                    <NavigationLink
                                        key={item.href}
                                        item={item}
                                        active={isActive(item)}
                                        onNavigate={closeNavigation}
                                    />
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                <div className="mt-2 border-t border-line p-2 pt-3 xl:hidden">
                    <UserSummary user={user} loading={loading} />
                    <UserActions
                        user={user}
                        loading={loading}
                        onNavigate={closeNavigation}
                        onLogout={handleLogout}
                        logoutPending={logoutPending}
                        logoutError={logoutError}
                        compact
                    />
                </div>
            </nav>

            <div className="hidden items-center gap-2 xl:flex">
                <UserSummary user={user} loading={loading} />
                <UserActions
                    user={user}
                    loading={loading}
                    onNavigate={closeNavigation}
                    onLogout={handleLogout}
                    logoutPending={logoutPending}
                    logoutError={logoutError}
                />
            </div>
        </div>
    );
}

function NavigationLink({
    item,
    active,
    onNavigate,
}: {
    item: NavigationItem;
    active: boolean;
    onNavigate: () => void;
}) {
    return (
        <li>
            <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={
                    active
                        ? "site-nav-link-active w-full justify-start xl:w-auto"
                        : "site-nav-link w-full justify-start xl:w-auto"
                }
            >
                {item.label}
            </Link>
        </li>
    );
}

function UserSummary({
    user,
    loading,
}: {
    user: ReturnType<typeof useAuth>["user"];
    loading: boolean;
}) {
    if (loading) {
        return (
            <div
                className="h-9 w-28 animate-pulse rounded-lg bg-surface-raised"
                aria-label="Chargement de l’utilisateur"
            />
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="mb-3 flex min-w-0 items-center gap-2.5 xl:mb-0 xl:ml-3 xl:border-l xl:border-line xl:pl-4">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-accent/25 bg-accent/8 font-mono text-[0.65rem] font-bold text-accent uppercase">
                {user.firstName.charAt(0)}
                {user.lastName.charAt(0)}
            </span>
            <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                    {user.firstName}
                </span>
                <span className="block truncate text-xs text-faint xl:hidden">
                    {user.email}
                </span>
            </span>
        </div>
    );
}

function UserActions({
    user,
    loading,
    onNavigate,
    onLogout,
    logoutPending,
    logoutError,
    compact = false,
}: {
    user: ReturnType<typeof useAuth>["user"];
    loading: boolean;
    onNavigate: () => void;
    onLogout: () => Promise<void>;
    logoutPending: boolean;
    logoutError: string | null;
    compact?: boolean;
}) {
    if (loading) {
        return null;
    }

    if (user) {
        return (
            <div className={compact ? "grid gap-2" : "relative"}>
                <button
                    type="button"
                    onClick={() => void onLogout()}
                    disabled={logoutPending}
                    className={
                        compact ? "btn-ghost w-full" : "btn-ghost px-3 py-2"
                    }
                >
                    {logoutPending ? "Déconnexion..." : "Déconnexion"}
                </button>
                {logoutError && (
                    <p
                        role="alert"
                        className={
                            compact
                                ? "text-xs text-red-300"
                                : "absolute top-[calc(100%+0.5rem)] right-0 z-40 w-72 rounded-xl border border-red-500/30 bg-surface px-3 py-2 text-xs text-red-300 shadow-xl"
                        }
                    >
                        {logoutError}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className={compact ? "grid gap-2" : "flex items-center gap-2"}>
            <Link
                href="/login"
                onClick={onNavigate}
                className={compact ? "btn-ghost w-full" : "site-nav-link"}
            >
                Connexion
            </Link>
            <Link
                href="/register"
                onClick={onNavigate}
                className={
                    compact
                        ? "btn-primary w-full"
                        : "btn-primary px-3.5 py-2"
                }
            >
                Créer un compte
            </Link>
        </div>
    );
}
