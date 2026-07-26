import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api";
import { CustomerVehicleForm } from "@/features/customer-vehicles/components/customer-vehicle-form";
import type {
    CreateCustomerVehicleRequest,
    CustomerVehicle,
} from "@/features/customer-vehicles/types/customer-vehicle.types";

const initialVehicle: CustomerVehicle = {
    id: "vehicle-1",
    customerId: "customer-1",
    brand: "Peugeot",
    model: "308",
    licensePlate: "1-ABC-234",
    normalizedLicensePlate: "1ABC234",
    vin: "VF3LPHNS0KS123456",
    firstRegistrationDate: "2020-03-14",
    fuelType: "PETROL",
    currentMileage: 56000,
    notes: "Véhicule principal",
    active: true,
    createdAt: "2026-07-20T10:00:00",
    updatedAt: "2026-07-20T10:00:00",
};

function renderCreate(
    onSubmit: (request: CreateCustomerVehicleRequest) => Promise<void> = vi
        .fn()
        .mockResolvedValue(undefined)
) {
    return {
        onSubmit,
        ...render(
            <CustomerVehicleForm
                mode="create"
                onSubmit={onSubmit}
                onCancel={vi.fn()}
            />
        ),
    };
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText(/Marque/), "Peugeot");
    await user.type(screen.getByLabelText(/Modèle/), "308");
}

beforeEach(() => {
    vi.restoreAllMocks();
});

describe("CustomerVehicleForm", () => {
    it("refuse une marque vide", async () => {
        const user = userEvent.setup();
        const { onSubmit } = renderCreate();
        await user.type(screen.getByLabelText(/Modèle/), "308");

        await user.click(
            screen.getByRole("button", { name: "Ajouter le véhicule" })
        );

        expect(
            screen.getByText("La marque est obligatoire")
        ).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("refuse un modèle vide", async () => {
        const user = userEvent.setup();
        const { onSubmit } = renderCreate();
        await user.type(screen.getByLabelText(/Marque/), "Peugeot");

        await user.click(
            screen.getByRole("button", { name: "Ajouter le véhicule" })
        );

        expect(
            screen.getByText("Le modèle est obligatoire")
        ).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("accepte un VIN vide et transforme les champs facultatifs vides", async () => {
        const user = userEvent.setup();
        const { onSubmit } = renderCreate();
        await fillRequiredFields(user);

        await user.click(
            screen.getByRole("button", { name: "Ajouter le véhicule" })
        );

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit).toHaveBeenCalledWith({
            brand: "Peugeot",
            model: "308",
            licensePlate: undefined,
            vin: undefined,
            firstRegistrationDate: undefined,
            fuelType: undefined,
            currentMileage: undefined,
            notes: undefined,
        });
    });

    it("accepte et normalise un VIN de 17 caractères", async () => {
        const user = userEvent.setup();
        const { onSubmit } = renderCreate();
        await fillRequiredFields(user);
        await user.type(
            screen.getByLabelText("VIN"),
            "vf3lphns0ks123456"
        );

        await user.click(
            screen.getByRole("button", { name: "Ajouter le véhicule" })
        );

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({ vin: "VF3LPHNS0KS123456" })
        );
    });

    it("refuse un VIN dont la longueur n'est pas 17", async () => {
        const user = userEvent.setup();
        const { onSubmit } = renderCreate();
        await fillRequiredFields(user);
        await user.type(screen.getByLabelText("VIN"), "ABC123");

        await user.click(
            screen.getByRole("button", { name: "Ajouter le véhicule" })
        );

        expect(
            screen.getByText(
                "Le VIN doit comporter exactement 17 caractères"
            )
        ).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("refuse un kilométrage négatif", async () => {
        const user = userEvent.setup();
        const { onSubmit } = renderCreate();
        await fillRequiredFields(user);
        await user.type(screen.getByLabelText("Kilométrage"), "-1");

        await user.click(
            screen.getByRole("button", { name: "Ajouter le véhicule" })
        );

        expect(
            screen.getByText(
                "Le kilométrage doit être un nombre entier positif ou nul"
            )
        ).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("normalise la plaque et convertit le kilométrage avant création", async () => {
        const user = userEvent.setup();
        const { onSubmit } = renderCreate();
        await fillRequiredFields(user);
        await user.type(
            screen.getByLabelText("Plaque d’immatriculation"),
            " 1-abc-234 "
        );
        await user.type(screen.getByLabelText("Kilométrage"), "42000");

        await user.click(
            screen.getByRole("button", { name: "Ajouter le véhicule" })
        );

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                licensePlate: "1-ABC-234",
                currentMileage: 42000,
            })
        );
    });

    it.each([
        "Un véhicule avec ce VIN existe déjà",
        "Un véhicule actif avec cette plaque existe déjà",
    ])("affiche le conflit métier « %s »", async (message) => {
        const user = userEvent.setup();
        const onSubmit = vi
            .fn()
            .mockRejectedValue(new ApiError(message, 409));
        renderCreate(onSubmit);
        await fillRequiredFields(user);

        await user.click(
            screen.getByRole("button", { name: "Ajouter le véhicule" })
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(message);
    });

    it("masque une erreur technique inattendue", async () => {
        const user = userEvent.setup();
        const onSubmit = vi
            .fn()
            .mockRejectedValue(new Error("SQL constraint internal_name"));
        renderCreate(onSubmit);
        await fillRequiredFields(user);

        await user.click(
            screen.getByRole("button", { name: "Ajouter le véhicule" })
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Impossible d’enregistrer le véhicule pour le moment."
        );
        expect(
            screen.queryByText(/SQL constraint internal_name/)
        ).not.toBeInTheDocument();
    });

    it("demande une confirmation explicite avant la désactivation", async () => {
        const user = userEvent.setup();
        const onDeactivate = vi.fn().mockResolvedValue(undefined);
        const confirmSpy = vi
            .spyOn(window, "confirm")
            .mockReturnValue(true);

        render(
            <CustomerVehicleForm
                mode="edit"
                initialVehicle={initialVehicle}
                onSubmit={vi.fn().mockResolvedValue(undefined)}
                onDeactivate={onDeactivate}
                onCancel={vi.fn()}
            />
        );

        await user.click(
            screen.getByRole("button", {
                name: "Désactiver ce véhicule",
            })
        );

        expect(confirmSpy).toHaveBeenCalledWith(
            expect.stringContaining(
                "Le véhicule restera visible dans votre historique"
            )
        );
        await waitFor(() =>
            expect(onDeactivate).toHaveBeenCalledTimes(1)
        );
    });
});
