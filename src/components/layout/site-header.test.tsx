import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/components/providers/auth-provider");

let pathname = "/dashboard";
const pushMock = vi.fn();
const refreshMock = vi.fn();
const logoutMock = vi.fn();

vi.mock("next/navigation", () => ({
    usePathname: () => pathname,
    useRouter: () => ({
        push: pushMock,
        refresh: refreshMock,
    }),
}));

import { useAuth } from "@/components/providers/auth-provider";
import { SiteHeader } from "@/components/layout/site-header";
import type { AuthUser } from "@/features/auth/types/auth.types";

const customer: AuthUser = {
    id: "customer-1",
    firstName: "Lina",
    lastName: "Client",
    email: "lina@example.be",
    role: "ROLE_CUSTOMER",
};

const employee: AuthUser = {
    id: "employee-1",
    firstName: "Alex",
    lastName: "Atelier",
    email: "alex@example.be",
    role: "ROLE_EMPLOYEE",
};

const admin: AuthUser = {
    id: "admin-1",
    firstName: "Anne",
    lastName: "Admin",
    email: "anne@example.be",
    role: "ROLE_ADMIN",
};

function mockAuth(user: AuthUser | null, loading = false) {
    vi.mocked(useAuth).mockReturnValue({
        user,
        loading,
        login: vi.fn(),
        register: vi.fn(),
        logout: logoutMock,
        refreshUser: vi.fn(),
    });
}

async function openDesktopMenu(
    user: ReturnType<typeof userEvent.setup>,
    name: string
) {
    const button = screen.getByRole("button", { name });
    await user.click(button);
    return button;
}

beforeEach(() => {
    pathname = "/dashboard";
    pushMock.mockReset();
    refreshMock.mockReset();
    logoutMock.mockReset();
    logoutMock.mockResolvedValue(undefined);
    mockAuth(customer);
});

describe("SiteHeader", () => {
    it("affiche la navigation client sans destination staff", async () => {
        const user = userEvent.setup();
        render(<SiteHeader />);

        expect(
            screen.getByRole("link", { name: "Tableau de bord" })
        ).toHaveAttribute("href", "/dashboard");
        expect(
            screen.getByRole("link", { name: "Mes rendez-vous" })
        ).toHaveAttribute("href", "/dashboard/appointments");
        await openDesktopMenu(user, "Mon espace");

        expect(
            screen.getByRole("link", { name: "Mes véhicules" })
        ).toHaveAttribute("href", "/dashboard/vehicles");
        expect(
            screen.getByRole("link", { name: "Mes factures" })
        ).toHaveAttribute("href", "/dashboard/invoices");
        expect(
            screen.queryByRole("link", {
                name: "Ordres de réparation",
            })
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole("link", { name: "Clients" })
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole("link", { name: "Planning atelier" })
        ).not.toBeInTheDocument();
    });

    it("affiche les destinations garage pour un employé", async () => {
        mockAuth(employee);
        const user = userEvent.setup();
        render(<SiteHeader />);

        expect(
            screen.getByRole("link", { name: "Planning atelier" })
        ).toHaveAttribute("href", "/employee/appointments");
        await openDesktopMenu(user, "Espace garage");

        expect(
            screen.getByRole("link", {
                name: "Ordres de réparation",
            })
        ).toHaveAttribute("href", "/employee/work-orders");
        expect(
            screen.getByRole("link", { name: "Clients" })
        ).toHaveAttribute("href", "/employee/customers");
        expect(
            screen.getByRole("link", { name: "Véhicules" })
        ).toHaveAttribute("href", "/employee/vehicles");
        expect(
            screen.queryByRole("link", { name: "Mes véhicules" })
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole("link", { name: "Utilisateurs" })
        ).not.toBeInTheDocument();
    });

    it("ajoute la gestion des utilisateurs pour un administrateur", async () => {
        mockAuth(admin);
        const user = userEvent.setup();
        render(<SiteHeader />);

        await openDesktopMenu(user, "Espace garage");

        expect(
            screen.getByRole("link", { name: "Utilisateurs" })
        ).toHaveAttribute("href", "/admin/users");
        expect(
            screen.getByRole("link", {
                name: "Ordres de réparation",
            })
        ).toBeInTheDocument();
    });

    it("laisse le menu fermé initialement", () => {
        mockAuth(employee);
        render(<SiteHeader />);

        expect(
            screen.getByRole("button", { name: "Espace garage" })
        ).toHaveAttribute("aria-expanded", "false");
        expect(
            screen.queryByRole("link", {
                name: "Ordres de réparation",
            })
        ).not.toBeInTheDocument();
    });

    it("ouvre et referme le menu desktop avec aria-expanded", async () => {
        mockAuth(employee);
        const user = userEvent.setup();
        render(<SiteHeader />);
        const button = screen.getByRole("button", {
            name: "Espace garage",
        });

        await user.click(button);
        expect(button).toHaveAttribute("aria-expanded", "true");
        expect(button).toHaveAttribute(
            "aria-controls",
            "secondary-navigation-panel"
        );
        expect(
            screen.getByRole("link", {
                name: "Ordres de réparation",
            })
        ).toBeInTheDocument();

        await user.click(button);
        expect(button).toHaveAttribute("aria-expanded", "false");
        expect(
            screen.queryByRole("link", {
                name: "Ordres de réparation",
            })
        ).not.toBeInTheDocument();
    });

    it("ferme le menu après navigation", async () => {
        mockAuth(employee);
        const user = userEvent.setup();
        render(<SiteHeader />);
        const button = await openDesktopMenu(user, "Espace garage");

        const workOrdersLink = screen.getByRole("link", {
            name: "Ordres de réparation",
        });
        workOrdersLink.addEventListener("click", (event) =>
            event.preventDefault()
        );
        await user.click(workOrdersLink);

        expect(button).toHaveAttribute("aria-expanded", "false");
        expect(
            screen.queryByRole("link", {
                name: "Ordres de réparation",
            })
        ).not.toBeInTheDocument();
    });

    it("ferme avec Escape et rend le focus au bouton", async () => {
        mockAuth(employee);
        const user = userEvent.setup();
        render(<SiteHeader />);
        const button = await openDesktopMenu(user, "Espace garage");

        await user.keyboard("{Escape}");

        expect(button).toHaveAttribute("aria-expanded", "false");
        expect(button).toHaveFocus();
    });

    it("ouvre le panneau compact avec le même contenu accessible", async () => {
        mockAuth(employee);
        const user = userEvent.setup();
        render(<SiteHeader />);
        const button = screen.getByRole("button", {
            name: "Ouvrir la navigation",
        });

        expect(button).toHaveAttribute("aria-expanded", "false");
        expect(button).toHaveAttribute(
            "aria-controls",
            "main-navigation-panel"
        );
        await user.click(button);

        expect(
            screen.getByRole("button", {
                name: "Fermer la navigation",
            })
        ).toHaveAttribute("aria-expanded", "true");
        expect(
            screen.getByRole("navigation", {
                name: "Navigation principale",
            })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("link", {
                name: "Ordres de réparation",
            })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: "Planning atelier" })
        ).toBeInTheDocument();
    });

    it("referme explicitement le panneau compact", async () => {
        mockAuth(employee);
        const user = userEvent.setup();
        render(<SiteHeader />);

        await user.click(
            screen.getByRole("button", {
                name: "Ouvrir la navigation",
            })
        );
        await user.click(
            screen.getByRole("button", {
                name: "Fermer la navigation",
            })
        );

        expect(
            screen.getByRole("button", {
                name: "Ouvrir la navigation",
            })
        ).toHaveAttribute("aria-expanded", "false");
    });

    it("identifie la route active sans dupliquer les liens", async () => {
        pathname = "/employee/work-orders/order-1";
        mockAuth(employee);
        const user = userEvent.setup();
        render(<SiteHeader />);

        await openDesktopMenu(user, "Espace garage");
        const links = screen.getAllByRole("link", {
            name: "Ordres de réparation",
        });

        expect(links).toHaveLength(1);
        expect(links[0]).toHaveAttribute("aria-current", "page");
    });

    it("ferme le menu lorsque le chemin change", async () => {
        mockAuth(employee);
        const user = userEvent.setup();
        const view = render(<SiteHeader />);
        await openDesktopMenu(user, "Espace garage");

        pathname = "/employee/customers";
        view.rerender(<SiteHeader />);

        expect(
            screen.getByRole("button", { name: "Espace garage" })
        ).toHaveAttribute("aria-expanded", "false");
    });

    it("conserve le logo d’accueil et la déconnexion", async () => {
        mockAuth(employee);
        const user = userEvent.setup();
        render(<SiteHeader />);

        expect(
            screen.getByRole("link", {
                name: "CamboGarage — accueil",
            })
        ).toHaveAttribute("href", "/");

        const logoutButtons = screen.getAllByRole("button", {
            name: "Déconnexion",
        });
        await user.click(logoutButtons[0]);

        expect(logoutMock).toHaveBeenCalledTimes(1);
        expect(pushMock).toHaveBeenCalledWith("/login");
        expect(refreshMock).toHaveBeenCalled();
    });

    it("n’appelle aucune action d’authentification à l’ouverture", async () => {
        mockAuth(employee);
        const user = userEvent.setup();
        render(<SiteHeader />);

        await openDesktopMenu(user, "Espace garage");

        expect(logoutMock).not.toHaveBeenCalled();
        expect(pushMock).not.toHaveBeenCalled();
    });

    it("reste stable pendant le chargement de l’utilisateur", () => {
        mockAuth(null, true);

        expect(() => render(<SiteHeader />)).not.toThrow();
        expect(
            screen.getByRole("button", {
                name: "Ouvrir la navigation",
            })
        ).toBeDisabled();
        expect(
            screen.getAllByLabelText("Chargement de l’utilisateur").length
        ).toBeGreaterThan(0);
    });
});
