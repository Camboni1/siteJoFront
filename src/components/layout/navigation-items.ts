import type { AuthUser } from "@/features/auth/types/auth.types";

export type NavigationItem = {
    href: string;
    label: string;
    exact?: boolean;
};

export type NavigationConfig = {
    primary: NavigationItem[];
    secondary: NavigationItem[];
    menuLabel: string;
};

const PUBLIC_NAVIGATION: NavigationConfig = {
    primary: [
        { href: "/", label: "Accueil", exact: true },
        { href: "/vehicles", label: "Occasions" },
        { href: "/#services", label: "Prestations" },
    ],
    secondary: [{ href: "/#atelier", label: "L’atelier" }],
    menuLabel: "Découvrir",
};

const CUSTOMER_NAVIGATION: NavigationConfig = {
    primary: [
        { href: "/dashboard", label: "Tableau de bord", exact: true },
        {
            href: "/dashboard/appointments",
            label: "Mes rendez-vous",
        },
    ],
    secondary: [
        { href: "/dashboard/vehicles", label: "Mes véhicules" },
        { href: "/dashboard/invoices", label: "Mes factures" },
        { href: "/vehicles", label: "Occasions" },
    ],
    menuLabel: "Mon espace",
};

const STAFF_SECONDARY_NAVIGATION: NavigationItem[] = [
    {
        href: "/employee/work-orders",
        label: "Ordres de réparation",
    },
    { href: "/employee/customers", label: "Clients" },
    { href: "/employee/services", label: "Prestations" },
    { href: "/employee/vehicles", label: "Véhicules" },
    { href: "/employee/invoices", label: "Factures" },
    { href: "/vehicles", label: "Occasions" },
];

const ADMIN_NAVIGATION_ITEM: NavigationItem = {
    href: "/admin/users",
    label: "Utilisateurs",
};

export function navigationForUser(
    user: AuthUser | null
): NavigationConfig {
    if (!user) {
        return PUBLIC_NAVIGATION;
    }

    if (user.role === "ROLE_CUSTOMER") {
        return CUSTOMER_NAVIGATION;
    }

    return {
        primary: [
            { href: "/dashboard", label: "Tableau de bord", exact: true },
            {
                href: "/employee/appointments",
                label: "Planning atelier",
            },
        ],
        secondary:
            user.role === "ROLE_ADMIN"
                ? [...STAFF_SECONDARY_NAVIGATION, ADMIN_NAVIGATION_ITEM]
                : STAFF_SECONDARY_NAVIGATION,
        menuLabel: "Espace garage",
    };
}
