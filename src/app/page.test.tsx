import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HomePage from "@/app/page";

vi.mock(
    "@/features/vehicles/components/public/featured-vehicles",
    () => ({
        FeaturedVehicles: () => (
            <div data-testid="featured-vehicles-content">
                Sélection dynamique des occasions
            </div>
        ),
    })
);

describe("HomePage", () => {
    it("présente clairement le garage avec un seul titre principal", () => {
        render(<HomePage />);

        expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
        expect(
            screen.getByRole("heading", {
                level: 1,
                name: "Entretien et réparation automobile à Namur",
            })
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                /Prenez rendez-vous en ligne, suivez vos interventions/
            )
        ).toBeInTheDocument();
    });

    it("relie toutes les demandes de rendez-vous à la route existante", () => {
        render(<HomePage />);

        const appointmentLinks = screen.getAllByRole("link", {
            name: /Prendre rendez-vous|Demander un rendez-vous/,
        });

        expect(appointmentLinks).toHaveLength(4);
        expect(
            appointmentLinks.every(
                (link) =>
                    link.getAttribute("href") ===
                    "/dashboard/appointments/new"
            )
        ).toBe(true);
    });

    it("relie les occasions, l’espace client et les informations pratiques", () => {
        render(<HomePage />);

        const vehicleLinks = screen.getAllByRole("link", {
            name: /Voir les véhicules d’occasion|Consulter le catalogue/,
        });
        expect(vehicleLinks).toHaveLength(3);
        expect(
            vehicleLinks.every(
                (link) => link.getAttribute("href") === "/vehicles"
            )
        ).toBe(true);

        const dashboardLinks = screen.getAllByRole("link", {
            name: /Accéder à mon espace/,
        });
        expect(dashboardLinks).toHaveLength(2);
        expect(
            dashboardLinks.every(
                (link) => link.getAttribute("href") === "/dashboard"
            )
        ).toBe(true);
        expect(
            screen.getByRole("link", {
                name: "Coordonnées et horaires",
            })
        ).toHaveAttribute("href", "/#atelier");
    });

    it("affiche seulement des informations pratiques confirmées", () => {
        render(<HomePage />);

        expect(screen.getAllByText("Namur").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Garage indépendant").length).toBeGreaterThan(
            0
        );
        expect(screen.getAllByText("Rendez-vous en ligne").length).toBeGreaterThan(
            0
        );
        expect(screen.queryByText("+32 81 12 34 56")).not.toBeInTheDocument();
    });

    it("présente quatre services et un parcours compact en trois étapes", () => {
        render(<HomePage />);

        for (const service of [
            "Entretien",
            "Réparation",
            "Diagnostic",
            "Véhicules d’occasion",
        ]) {
            expect(
                screen.getByRole("heading", { level: 3, name: service })
            ).toBeInTheDocument();
        }

        for (const step of [
            "Choisissez une prestation",
            "Sélectionnez un créneau",
            "Suivez votre demande",
        ]) {
            expect(
                screen.getByRole("heading", { level: 3, name: step })
            ).toBeInTheDocument();
        }
    });

    it("place la sélection d’occasions avant les services et relie le catalogue", () => {
        const { container } = render(<HomePage />);

        expect(
            screen.getByRole("heading", {
                level: 2,
                name: "Nos occasions à la une",
            })
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "Découvrez une sélection de véhicules actuellement disponibles chez CamboGarage."
            )
        ).toBeInTheDocument();
        expect(
            screen.getByRole("link", {
                name: "Voir toutes les occasions",
            })
        ).toHaveAttribute("href", "/vehicles");
        expect(
            screen.getByTestId("featured-vehicles-content")
        ).toBeInTheDocument();

        const featuredSection = container.querySelector("#featured-vehicles");
        const servicesSection = container.querySelector("#services");

        expect(featuredSection).not.toBeNull();
        expect(servicesSection).not.toBeNull();
        if (!featuredSection || !servicesSection) {
            throw new Error("Les sections de l’accueil sont absentes");
        }

        expect(
            featuredSection.compareDocumentPosition(servicesSection) &
                Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
    });

    it("ne contient aucune donnée client fictive ni illustration décorative", () => {
        const { container } = render(<HomePage />);

        expect(screen.queryByText(/Prochaine visite/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/^Confirmé$/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Dossier #/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/^Votre véhicule$/i)).not.toBeInTheDocument();
        expect(container.querySelector("svg")).not.toBeInTheDocument();
        expect(container.querySelectorAll('a[href="#"]')).toHaveLength(0);
    });
});
