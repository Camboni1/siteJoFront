import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/features/customer-vehicles/api/customer-vehicles-api");

import * as customerVehiclesApi from "@/features/customer-vehicles/api/customer-vehicles-api";
import {
    AppointmentVehicleFields,
    type AppointmentVehicleSource,
} from "@/features/appointments/components/appointment-vehicle-fields";
import type { CustomerVehicleSummary } from "@/features/customer-vehicles/types/customer-vehicle.types";

const activeVehicle: CustomerVehicleSummary = {
    id: "active-1",
    brand: "Peugeot",
    model: "308",
    licensePlate: "1-ABC-234",
    active: true,
};

const inactiveVehicle: CustomerVehicleSummary = {
    id: "inactive-1",
    brand: "Renault",
    model: "Clio",
    licensePlate: "2-DEF-567",
    active: false,
};

function ControlledFields() {
    const [source, setSource] =
        useState<AppointmentVehicleSource>("manual");
    const [selectedVehicleId, setSelectedVehicleId] = useState("");
    const [brand, setBrand] = useState("");
    const [model, setModel] = useState("");
    const [plate, setPlate] = useState("");

    return (
        <AppointmentVehicleFields
            source={source}
            selectedVehicleId={selectedVehicleId}
            vehicleBrand={brand}
            vehicleModel={model}
            licensePlate={plate}
            onSourceChange={setSource}
            onSelectedVehicleChange={setSelectedVehicleId}
            onVehicleBrandChange={setBrand}
            onVehicleModelChange={setModel}
            onLicensePlateChange={setPlate}
        />
    );
}

beforeEach(() => {
    vi.mocked(customerVehiclesApi.getMyCustomerVehicles).mockReset();
});

describe("AppointmentVehicleFields", () => {
    it("affiche le chargement puis uniquement les véhicules actifs", async () => {
        vi.mocked(
            customerVehiclesApi.getMyCustomerVehicles
        ).mockResolvedValue([activeVehicle, inactiveVehicle]);
        const user = userEvent.setup();

        render(<ControlledFields />);

        expect(
            screen.getByText("Chargement de vos véhicules enregistrés...")
        ).toBeInTheDocument();
        await waitFor(() =>
            expect(
                screen.getByRole("radio", {
                    name: /Utiliser un véhicule enregistré/,
                })
            ).toBeEnabled()
        );
        await user.click(
            screen.getByRole("radio", {
                name: /Utiliser un véhicule enregistré/,
            })
        );

        expect(
            await screen.findByRole("option", {
                name: "Peugeot 308 — 1-ABC-234",
            })
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("option", {
                name: /Renault Clio/,
            })
        ).not.toBeInTheDocument();
    });

    it("sélectionne un véhicule enregistré", async () => {
        vi.mocked(
            customerVehiclesApi.getMyCustomerVehicles
        ).mockResolvedValue([activeVehicle]);
        const user = userEvent.setup();

        render(<ControlledFields />);

        await waitFor(() =>
            expect(
                screen.getByRole("radio", {
                    name: /Utiliser un véhicule enregistré/,
                })
            ).toBeEnabled()
        );
        await user.click(
            screen.getByRole("radio", {
                name: /Utiliser un véhicule enregistré/,
            })
        );
        await user.selectOptions(
            screen.getByLabelText("Véhicule enregistré"),
            "active-1"
        );

        expect(
            screen.getByLabelText("Véhicule enregistré")
        ).toHaveValue("active-1");
        expect(
            screen.queryByLabelText("Marque du véhicule")
        ).not.toBeInTheDocument();
    });

    it("préserve la saisie manuelle après un aller-retour", async () => {
        vi.mocked(
            customerVehiclesApi.getMyCustomerVehicles
        ).mockResolvedValue([activeVehicle]);
        const user = userEvent.setup();

        render(<ControlledFields />);

        await user.type(
            screen.getByLabelText("Marque du véhicule"),
            "Citroën"
        );
        await waitFor(() =>
            expect(
                screen.getByRole("radio", {
                    name: /Utiliser un véhicule enregistré/,
                })
            ).toBeEnabled()
        );
        await user.click(
            screen.getByRole("radio", {
                name: /Utiliser un véhicule enregistré/,
            })
        );
        await user.click(
            screen.getByRole("radio", {
                name: /Saisir un autre véhicule/,
            })
        );

        expect(
            screen.getByLabelText("Marque du véhicule")
        ).toHaveValue("Citroën");
    });

    it("garde la saisie manuelle disponible lorsque le chargement échoue", async () => {
        vi.mocked(
            customerVehiclesApi.getMyCustomerVehicles
        ).mockRejectedValue(new Error("private backend detail"));

        render(<ControlledFields />);

        expect(
            await screen.findByText(/temporairement indisponibles/)
        ).toBeInTheDocument();
        expect(
            screen.getByLabelText("Marque du véhicule")
        ).toBeEnabled();
        expect(
            screen.queryByText(/private backend detail/)
        ).not.toBeInTheDocument();
    });

    it("reste compatible avec un compte sans véhicule", async () => {
        vi.mocked(
            customerVehiclesApi.getMyCustomerVehicles
        ).mockResolvedValue([]);

        render(<ControlledFields />);

        expect(
            await screen.findByText(/Aucun véhicule actif n’est disponible/)
        ).toBeInTheDocument();
        expect(
            screen.getByRole("radio", {
                name: /Utiliser un véhicule enregistré/,
            })
        ).toBeDisabled();
        expect(
            screen.getByRole("radio", {
                name: /Saisir un autre véhicule/,
            })
        ).toBeChecked();
    });
});
