import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as vehiclesApi from "@/features/vehicles/api/vehicles-api";
import { FeaturedVehicles } from "@/features/vehicles/components/public/featured-vehicles";
import type {
    PageResponse,
    PublicVehicleResponse,
} from "@/features/vehicles/types/vehicle.types";

vi.mock("@/features/vehicles/api/vehicles-api");

function vehicle(
    id: string,
    overrides: Partial<PublicVehicleResponse> = {}
): PublicVehicleResponse {
    return {
        id,
        brand: "Volvo",
        model: "V60",
        version: "B4",
        year: 2022,
        mileage: 42_000,
        fuelType: "Essence",
        gearbox: "Automatique",
        color: "Bleu",
        price: 18_990,
        description: "Véhicule entretenu.",
        highlighted: false,
        status: "AVAILABLE",
        firstRegistrationDate: "2022-05-12",
        images: [],
        ...overrides,
    };
}

function page(
    content: PublicVehicleResponse[]
): PageResponse<PublicVehicleResponse> {
    return {
        content,
        page: 0,
        size: 12,
        totalElements: content.length,
        totalPages: content.length > 0 ? 1 : 0,
        first: true,
        last: true,
    };
}

beforeEach(() => {
    vi.mocked(vehiclesApi.getPublicVehicles).mockReset();
});

describe("FeaturedVehicles", () => {
    it("affiche un état de chargement pendant la récupération", () => {
        vi.mocked(vehiclesApi.getPublicVehicles).mockReturnValue(
            new Promise(() => {})
        );

        render(<FeaturedVehicles />);

        expect(
            screen.getByRole("status", {
                name: "Chargement des occasions à la une",
            })
        ).toBeInTheDocument();
    });

    it("demande douze annonces et affiche au maximum trois véhicules disponibles", async () => {
        vi.mocked(vehiclesApi.getPublicVehicles).mockResolvedValue(
            page([
                vehicle("available-1", {
                    brand: "Peugeot",
                    model: "208",
                }),
                vehicle("sold", {
                    brand: "Véhicule",
                    model: "Vendu",
                    highlighted: true,
                    status: "SOLD",
                }),
                vehicle("highlighted-1", {
                    brand: "Renault",
                    model: "Clio",
                    highlighted: true,
                }),
                vehicle("draft", {
                    brand: "Véhicule",
                    model: "Brouillon",
                    highlighted: true,
                    status: "DRAFT",
                }),
                vehicle("highlighted-2", {
                    brand: "Toyota",
                    model: "Yaris",
                    highlighted: true,
                }),
                vehicle("available-2", {
                    brand: "Ford",
                    model: "Focus",
                }),
            ])
        );

        render(<FeaturedVehicles />);

        const headings = await screen.findAllByRole("heading", { level: 3 });

        expect(vehiclesApi.getPublicVehicles).toHaveBeenCalledTimes(1);
        expect(vehiclesApi.getPublicVehicles).toHaveBeenCalledWith({
            page: 0,
            size: 12,
        });
        expect(headings.map((heading) => heading.textContent)).toEqual([
            "Renault Clio",
            "Toyota Yaris",
            "Peugeot 208",
        ]);
        expect(screen.queryByText("Véhicule Vendu")).not.toBeInTheDocument();
        expect(screen.queryByText("Véhicule Brouillon")).not.toBeInTheDocument();
    });

    it("ouvre la fiche réelle et réutilise les formats et le placeholder existants", async () => {
        vi.mocked(vehiclesApi.getPublicVehicles).mockResolvedValue(
            page([vehicle("vehicle-42")])
        );

        render(<FeaturedVehicles />);

        expect(
            await screen.findByRole("link", { name: /Volvo V60/ })
        ).toHaveAttribute("href", "/vehicles/vehicle-42");
        expect(screen.getByText(/18[.\s]990,00/)).toBeInTheDocument();
        expect(screen.getByText(/42[.\s]000 km/)).toBeInTheDocument();
        expect(
            screen.getByRole("img", {
                name: "Volvo V60 — image indisponible",
            })
        ).toBeInTheDocument();
    });

    it("affiche honnêtement un catalogue sans véhicule disponible", async () => {
        vi.mocked(vehiclesApi.getPublicVehicles).mockResolvedValue(
            page([
                vehicle("sold", { status: "SOLD" }),
                vehicle("draft", { status: "DRAFT" }),
            ])
        );

        const { container } = render(<FeaturedVehicles />);

        expect(
            await screen.findByText("Aucune occasion disponible actuellement.")
        ).toBeInTheDocument();
        expect(
            container.querySelector('a[href^="/vehicles/"]')
        ).not.toBeInTheDocument();
    });

    it("isole une erreur API sans exposer son détail technique", async () => {
        vi.mocked(vehiclesApi.getPublicVehicles).mockRejectedValue(
            new Error("SQL vehicles internal")
        );

        render(<FeaturedVehicles />);

        const alert = await screen.findByRole("alert");

        expect(alert).toHaveTextContent(
            "Le catalogue est momentanément indisponible."
        );
        expect(alert).not.toHaveTextContent("SQL vehicles internal");
        expect(
            screen.getByRole("link", { name: "Ouvrir le catalogue" })
        ).toHaveAttribute("href", "/vehicles");
    });
});
