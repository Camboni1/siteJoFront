import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApiError } from "@/lib/api";

vi.mock("@/features/customer-vehicles/api/customer-vehicles-api");
vi.mock("@/features/customer-vehicles/hooks/use-customer-guard");

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({ replace: replaceMock }),
}));

import * as customerVehiclesApi from "@/features/customer-vehicles/api/customer-vehicles-api";
import { CustomerVehicleList } from "@/features/customer-vehicles/components/customer-vehicle-list";
import { useCustomerGuard } from "@/features/customer-vehicles/hooks/use-customer-guard";
import type { CustomerVehicleSummary } from "@/features/customer-vehicles/types/customer-vehicle.types";

const activeVehicle: CustomerVehicleSummary = {
    id: "vehicle-active",
    brand: "Peugeot",
    model: "308",
    licensePlate: "1-ABC-234",
    active: true,
};

const inactiveVehicle: CustomerVehicleSummary = {
    id: "vehicle-inactive",
    brand: "Renault",
    model: "Clio",
    licensePlate: null,
    active: false,
};

beforeEach(() => {
    replaceMock.mockReset();
    vi.mocked(useCustomerGuard).mockReturnValue({
        user: {
            id: "user-1",
            firstName: "Lina",
            lastName: "Client",
            email: "lina@example.be",
            role: "ROLE_CUSTOMER",
        },
        loading: false,
        authorized: true,
    });
    vi.mocked(customerVehiclesApi.getMyCustomerVehicles).mockReset();
});

describe("CustomerVehicleList", () => {
    it("affiche le chargement initial", () => {
        vi.mocked(
            customerVehiclesApi.getMyCustomerVehicles
        ).mockReturnValue(new Promise(() => {}));

        render(<CustomerVehicleList />);

        expect(
            screen.getByText("Chargement de vos véhicules...")
        ).toBeInTheDocument();
    });

    it("affiche une liste remplie avec les statuts actif et désactivé", async () => {
        vi.mocked(
            customerVehiclesApi.getMyCustomerVehicles
        ).mockResolvedValue([activeVehicle, inactiveVehicle]);

        render(<CustomerVehicleList />);

        expect(await screen.findByText("Peugeot 308")).toBeInTheDocument();
        expect(screen.getByText("Renault Clio")).toBeInTheDocument();
        expect(screen.getByText("Actif")).toBeInTheDocument();
        expect(screen.getByText("Désactivé")).toBeInTheDocument();
        expect(screen.getByText("Plaque non renseignée")).toBeInTheDocument();
        expect(
            screen.getByText(/il n’est plus disponible/i)
        ).toBeInTheDocument();
    });

    it("affiche l'état vide attendu", async () => {
        vi.mocked(
            customerVehiclesApi.getMyCustomerVehicles
        ).mockResolvedValue([]);

        render(<CustomerVehicleList />);

        expect(
            await screen.findByText("Aucun véhicule enregistré.")
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                /Ajoutez votre véhicule pour le sélectionner plus rapidement/i
            )
        ).toBeInTheDocument();
    });

    it("propose la navigation vers la création", async () => {
        vi.mocked(
            customerVehiclesApi.getMyCustomerVehicles
        ).mockResolvedValue([]);

        render(<CustomerVehicleList />);

        expect(
            await screen.findByRole("link", {
                name: /Ajouter un véhicule/,
            })
        ).toHaveAttribute("href", "/dashboard/vehicles/new");
    });

    it("propose la navigation vers la modification", async () => {
        vi.mocked(
            customerVehiclesApi.getMyCustomerVehicles
        ).mockResolvedValue([activeVehicle]);

        render(<CustomerVehicleList />);

        expect(
            await screen.findByRole("link", {
                name: "Modifier Peugeot 308",
            })
        ).toHaveAttribute(
            "href",
            "/dashboard/vehicles/vehicle-active/edit"
        );
    });

    it("affiche une erreur générique sans détail technique", async () => {
        vi.mocked(
            customerVehiclesApi.getMyCustomerVehicles
        ).mockRejectedValue(new Error("SQL customer_vehicles internal"));

        render(<CustomerVehicleList />);

        expect(
            await screen.findByRole("alert")
        ).toHaveTextContent(
            "Impossible de charger vos véhicules pour le moment."
        );
        expect(screen.queryByText(/SQL customer_vehicles/)).not.toBeInTheDocument();
    });

    it("redirige une réponse non autorisée vers la connexion", async () => {
        vi.mocked(
            customerVehiclesApi.getMyCustomerVehicles
        ).mockRejectedValue(new ApiError("Non authentifié", 401));

        render(<CustomerVehicleList />);

        await vi.waitFor(() => {
            expect(replaceMock).toHaveBeenCalledWith("/login");
        });
    });

    it("affiche le message de succès transmis par la route", async () => {
        vi.mocked(
            customerVehiclesApi.getMyCustomerVehicles
        ).mockResolvedValue([]);

        render(
            <CustomerVehicleList successMessage="Le véhicule a bien été ajouté." />
        );

        expect(await screen.findByRole("status")).toHaveTextContent(
            "Le véhicule a bien été ajouté."
        );
    });
});
