"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Brand } from "@/components/ui/brand";
import { isAdmin, isStaff } from "@/features/auth/lib/roles";

type NavItem = {
    href: string;
    label: string;
    exact?: boolean;
};

const PUBLIC_NAV: NavItem[] = [
    { href: "/", label: "Accueil", exact: true },
    { href: "/vehicles", label: "Occasions" },
    { href: "/#services", label: "Prestations" },
    { href: "/#atelier", label: "L’atelier" },
];

const CUSTOMER_NAV: NavItem[] = [
    { href: "/dashboard", label: "Tableau de bord", exact: true },
    { href: "/dashboard/appointments", label: "Mes rendez-vous" },
];

export function SiteHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading, logout } = useAuth();

    const navItems = loading
        ? []
        : user
          ? [
              { href: "/vehicles", label: "Occasions" },
              ...CUSTOMER_NAV,
              ...(isStaff(user)
                  ? [
                        {
                            href: "/employee/appointments",
                            label: "Planning atelier",
                        },
                        {
                            href: "/employee/customers",
                            label: "Clients",
                        },
                        {
                            href: "/employee/services",
                            label: "Prestations",
                        },
                        {
                            href: "/employee/vehicles",
                            label: "Véhicules",
                        },
                    ]
                  : []),
              ...(isAdmin(user)
                  ? [
                        {
                            href: "/admin/users",
                            label: "Utilisateurs",
                        },
                    ]
                  : []),
            ]
          : PUBLIC_NAV;

    function isActive(item: NavItem) {
        if (item.href.includes("#")) {
            return false;
        }

        return item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
    }

    async function handleLogout() {
        await logout();
        router.push("/login");
        router.refresh();
    }

    function closeMobileMenu(
        event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
    ) {
        event.currentTarget.closest("details")?.removeAttribute("open");
    }

    return (
        <header className="site-header">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-5 sm:px-6">
                <Link href="/" aria-label="CamboGarage — accueil" className="shrink-0">
                    <Brand />
                </Link>

                <nav
                    className="ml-auto hidden items-center gap-1 lg:flex"
                    aria-label="Navigation principale"
                >
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={
                                isActive(item)
                                    ? "site-nav-link-active"
                                    : "site-nav-link"
                            }
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="ml-3 hidden items-center gap-2 lg:flex">
                    {loading ? (
                        <div
                            className="h-9 w-28 animate-pulse rounded-lg bg-surface-raised"
                            aria-hidden
                        />
                    ) : user ? (
                        <>
                            <div className="mr-1 flex items-center gap-2.5 border-l border-line pl-4">
                                <span className="grid h-8 w-8 place-items-center rounded-lg border border-accent/25 bg-accent/8 font-mono text-[0.65rem] font-bold text-accent uppercase">
                                    {user.firstName.charAt(0)}
                                    {user.lastName.charAt(0)}
                                </span>
                                <span className="max-w-28 truncate text-sm font-medium">
                                    {user.firstName}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="btn-ghost px-3 py-2"
                            >
                                Déconnexion
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="site-nav-link">
                                Connexion
                            </Link>
                            <Link href="/register" className="btn-primary px-3.5 py-2">
                                Créer un compte
                            </Link>
                        </>
                    )}
                </div>

                <details className="group relative ml-auto lg:hidden">
                    <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-lg border border-line bg-surface-soft text-ink transition hover:border-faint hover:bg-surface-raised [&::-webkit-details-marker]:hidden">
                        <span className="sr-only">Ouvrir la navigation</span>
                        <span className="flex w-4 flex-col gap-1" aria-hidden>
                            <span className="h-px w-full bg-current" />
                            <span className="h-px w-full bg-current" />
                            <span className="h-px w-full bg-current" />
                        </span>
                    </summary>

                    <div className="absolute top-12 right-0 z-30 w-[min(20rem,calc(100vw-2.5rem))] rounded-2xl border border-line bg-surface p-2 shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
                        {user && (
                            <div className="mb-2 flex items-center gap-3 border-b border-line px-3 py-3">
                                <span className="grid h-9 w-9 place-items-center rounded-lg border border-accent/25 bg-accent/8 font-mono text-xs font-bold text-accent uppercase">
                                    {user.firstName.charAt(0)}
                                    {user.lastName.charAt(0)}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">
                                        {user.firstName} {user.lastName}
                                    </p>
                                    <p className="truncate text-xs text-faint">
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                        )}

                        <nav className="grid gap-1" aria-label="Navigation mobile">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={closeMobileMenu}
                                    className={
                                        isActive(item)
                                            ? "site-nav-link-active justify-start"
                                            : "site-nav-link justify-start"
                                    }
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        {!loading && (
                            <div className="mt-2 grid gap-2 border-t border-line p-2 pt-3">
                                {user ? (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            closeMobileMenu(event);
                                            void handleLogout();
                                        }}
                                        className="btn-ghost w-full"
                                    >
                                        Déconnexion
                                    </button>
                                ) : (
                                    <>
                                        <Link
                                            href="/login"
                                            onClick={closeMobileMenu}
                                            className="btn-ghost w-full"
                                        >
                                            Connexion
                                        </Link>
                                        <Link
                                            href="/register"
                                            onClick={closeMobileMenu}
                                            className="btn-primary w-full"
                                        >
                                            Créer un compte
                                        </Link>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </details>
            </div>
        </header>
    );
}
