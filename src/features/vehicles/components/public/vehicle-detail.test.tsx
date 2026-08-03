import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as vehiclesApi from "@/features/vehicles/api/vehicles-api";
import { VehicleDetail } from "@/features/vehicles/components/public/vehicle-detail";
import type { PublicVehicleResponse } from "@/features/vehicles/types/vehicle.types";

vi.mock("@/features/vehicles/api/vehicles-api");

const availableVehicle: PublicVehicleResponse = {
    id: "vehicle-1",
    brand: "Volvo",
    model: "V60",
    version: "B4",
    year: 2022,
    mileage: 42_000,
    fuelType: "Essence",
    gearbox: "Automatique",
    color: "Bleu",
    price: 29_900,
    description: "Véhicule entretenu.",
    highlighted: true,
    status: "AVAILABLE",
    firstRegistrationDate: "2022-05-12",
    images: [],
};

beforeEach(() => {
    vi.mocked(vehiclesApi.getPublicVehicle).mockResolvedValue(availableVehicle);
});

describe("VehicleDetail — contact", () => {
    it("ouvre WhatsApp pour un véhicule disponible", async () => {
        render(<VehicleDetail id="vehicle-1" />);

        const whatsapp = await screen.findByRole("link", {
            name: /Demander des informations sur Volvo V60 via WhatsApp/,
        });
        expect(whatsapp).toHaveAttribute("target", "_blank");
        expect(whatsapp).toHaveAttribute(
            "rel",
            expect.stringContaining("noopener")
        );

        const href = whatsapp.getAttribute("href");
        expect(href).toMatch(/^https:\/\/wa\.me\/32475123456\?text=/);
        expect(decodeURIComponent(href ?? "")).toContain("Volvo V60");
    });

    it("masque l’action commerciale pour un véhicule vendu", async () => {
        vi.mocked(vehiclesApi.getPublicVehicle).mockResolvedValue({
            ...availableVehicle,
            status: "SOLD",
        });

        render(<VehicleDetail id="vehicle-1" />);

        expect(await screen.findByText("Vendu")).toBeInTheDocument();
        expect(
            screen.queryByRole("link", {
                name: /Demander des informations/,
            })
        ).not.toBeInTheDocument();
    });
});
