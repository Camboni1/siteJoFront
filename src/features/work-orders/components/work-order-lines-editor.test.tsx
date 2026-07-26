import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/features/work-orders/api/work-orders-api");
vi.mock("@/features/garage-services/api/garage-services-api");

import * as garageServicesApi from "@/features/garage-services/api/garage-services-api";
import * as workOrdersApi from "@/features/work-orders/api/work-orders-api";
import { WorkOrderLinesEditor } from "@/features/work-orders/components/work-order-lines-editor";
import type { GarageService } from "@/features/garage-services/types/garage-service.types";
import type {
    WorkOrder,
    WorkOrderLine,
} from "@/features/work-orders/types/work-order.types";

const line: WorkOrderLine = {
    id: "line-1",
    garageServiceId: "service-1",
    description: "Entretien complet",
    quantity: 1,
    unitPrice: 100,
    vatRate: 21,
    displayOrder: 0,
    amountExcludingVat: 100,
    vatAmount: 21,
    amountIncludingVat: 121,
};

const order: WorkOrder = {
    id: "order-1",
    appointmentId: "appointment-1",
    customerId: "customer-1",
    customerVehicleId: "vehicle-1",
    assignedEmployeeId: null,
    status: "IN_PROGRESS",
    mileageAtReception: null,
    customerComplaint: null,
    diagnostic: null,
    workPerformed: null,
    internalNotes: null,
    openedAt: "2026-07-26T08:00:00Z",
    startedAt: "2026-07-26T09:00:00Z",
    completedAt: null,
    deliveredAt: null,
    lines: [line],
    amountExcludingVat: 100,
    vatAmount: 21,
    amountIncludingVat: 121,
    createdAt: "2026-07-26T08:00:00Z",
    updatedAt: "2026-07-26T09:00:00Z",
};

const service: GarageService = {
    id: "service-1",
    name: "Entretien",
    description: "Entretien recommandé",
    startingPrice: 89.5,
    durationMinutes: 60,
    active: true,
    displayOrder: 0,
    createdAt: "2026-07-01T08:00:00Z",
    updatedAt: "2026-07-01T08:00:00Z",
};

async function openAddForm(user: ReturnType<typeof userEvent.setup>) {
    await user.click(
        screen.getByRole("button", { name: "Ajouter une ligne" })
    );
}

async function fillValidLine(user: ReturnType<typeof userEvent.setup>) {
    await user.type(
        screen.getByLabelText("Description"),
        "Diagnostic libre"
    );
    await user.type(
        screen.getByLabelText("Prix unitaire hors TVA"),
        "50"
    );
    await user.type(screen.getByLabelText("Taux de TVA (%)"), "21");
}

beforeEach(() => {
    vi.mocked(garageServicesApi.getAllServices).mockReset();
    vi.mocked(garageServicesApi.getAllServices).mockResolvedValue([service]);
    vi.mocked(workOrdersApi.addWorkOrderLine).mockReset();
    vi.mocked(workOrdersApi.updateWorkOrderLine).mockReset();
    vi.mocked(workOrdersApi.deleteWorkOrderLine).mockReset();
    vi.mocked(workOrdersApi.getWorkOrder).mockReset();
    vi.restoreAllMocks();
});

describe("WorkOrderLinesEditor", () => {
    it("affiche les lignes et les totaux fournis par le backend", async () => {
        render(
            <WorkOrderLinesEditor order={order} onUpdated={vi.fn()} />
        );

        expect(screen.getByText("Entretien complet")).toBeInTheDocument();
        expect(screen.getByText("Total hors TVA")).toBeInTheDocument();
        expect(screen.getByText("Total TVA comprise")).toBeInTheDocument();
        expect(screen.getAllByText(/121[,.]00/).length).toBeGreaterThan(0);
    });

    it("ajoute une prestation libre et actualise depuis la réponse backend", async () => {
        const user = userEvent.setup();
        const updated = {
            ...order,
            amountIncludingVat: 181.5,
            updatedAt: "2026-07-26T10:00:00Z",
        };
        vi.mocked(workOrdersApi.addWorkOrderLine).mockResolvedValue(updated);
        const onUpdated = vi.fn();
        render(<WorkOrderLinesEditor order={order} onUpdated={onUpdated} />);
        await openAddForm(user);
        await fillValidLine(user);

        await user.click(
            screen.getByRole("button", { name: "Ajouter la ligne" })
        );

        await waitFor(() =>
            expect(workOrdersApi.addWorkOrderLine).toHaveBeenCalledWith(
                "order-1",
                {
                    garageServiceId: null,
                    description: "Diagnostic libre",
                    quantity: 1,
                    unitPrice: 50,
                    vatRate: 21,
                    displayOrder: 1,
                }
            )
        );
        expect(onUpdated).toHaveBeenCalledWith(updated);
    });

    it("propose les valeurs d’un service sans les imposer", async () => {
        const user = userEvent.setup();
        render(
            <WorkOrderLinesEditor order={order} onUpdated={vi.fn()} />
        );
        await openAddForm(user);
        await screen.findByRole("option", { name: "Entretien" });

        await user.selectOptions(
            screen.getByLabelText("Service du garage (facultatif)"),
            "service-1"
        );

        expect(screen.getByLabelText("Description")).toHaveValue(
            "Entretien recommandé"
        );
        expect(
            screen.getByLabelText("Prix unitaire hors TVA")
        ).toHaveValue("89.5");

        await user.clear(screen.getByLabelText("Description"));
        await user.type(
            screen.getByLabelText("Description"),
            "Texte personnalisé"
        );
        await user.selectOptions(
            screen.getByLabelText("Service du garage (facultatif)"),
            ""
        );
        await user.selectOptions(
            screen.getByLabelText("Service du garage (facultatif)"),
            "service-1"
        );
        expect(screen.getByLabelText("Description")).toHaveValue(
            "Texte personnalisé"
        );
    });

    it("modifie une ligne existante", async () => {
        const user = userEvent.setup();
        vi.mocked(workOrdersApi.updateWorkOrderLine).mockResolvedValue({
            ...order,
            updatedAt: "2026-07-26T11:00:00Z",
        });
        render(
            <WorkOrderLinesEditor order={order} onUpdated={vi.fn()} />
        );

        await user.click(screen.getByRole("button", { name: "Modifier" }));
        await user.clear(screen.getByLabelText("Description"));
        await user.type(
            screen.getByLabelText("Description"),
            "Entretien révisé"
        );
        await user.click(
            screen.getByRole("button", {
                name: "Enregistrer la ligne",
            })
        );

        await waitFor(() =>
            expect(workOrdersApi.updateWorkOrderLine).toHaveBeenCalledWith(
                "order-1",
                "line-1",
                expect.objectContaining({
                    description: "Entretien révisé",
                    garageServiceId: "service-1",
                })
            )
        );
    });

    it("supprime via 204 puis recharge l’ordre et ses totaux", async () => {
        const user = userEvent.setup();
        const refreshed = {
            ...order,
            lines: [],
            amountExcludingVat: 0,
            vatAmount: 0,
            amountIncludingVat: 0,
        };
        vi.spyOn(window, "confirm").mockReturnValue(true);
        vi.mocked(
            workOrdersApi.deleteWorkOrderLine
        ).mockResolvedValue(undefined);
        vi.mocked(workOrdersApi.getWorkOrder).mockResolvedValue(refreshed);
        const onUpdated = vi.fn();
        render(<WorkOrderLinesEditor order={order} onUpdated={onUpdated} />);

        await user.click(
            screen.getByRole("button", { name: "Supprimer" })
        );

        expect(window.confirm).toHaveBeenCalledWith(
            "Supprimer la prestation « Entretien complet » ?"
        );
        await waitFor(() =>
            expect(workOrdersApi.getWorkOrder).toHaveBeenCalledWith("order-1")
        );
        expect(onUpdated).toHaveBeenCalledWith(refreshed);
    });

    it.each([
        {
            field: "Description",
            value: "",
            message: "La description est obligatoire.",
        },
        {
            field: "Quantité",
            value: "0",
            message: "La quantité doit être strictement positive.",
        },
        {
            field: "Quantité",
            value: "1.2345",
            message: "La quantité doit comporter au maximum 3 décimales.",
        },
        {
            field: "Prix unitaire hors TVA",
            value: "-1",
            message:
                "Le prix unitaire hors TVA doit être positif ou nul.",
        },
        {
            field: "Prix unitaire hors TVA",
            value: "1.234",
            message:
                "Le prix unitaire doit comporter au maximum 2 décimales.",
        },
        {
            field: "Taux de TVA (%)",
            value: "101",
            message:
                "Le taux de TVA doit être compris entre 0 et 100.",
        },
        {
            field: "Taux de TVA (%)",
            value: "21.123",
            message:
                "Le taux de TVA doit comporter au maximum 2 décimales.",
        },
        {
            field: "Ordre d’affichage",
            value: "-1",
            message:
                "L’ordre d’affichage doit être un entier positif ou nul.",
        },
        {
            field: "Ordre d’affichage",
            value: "1.5",
            message:
                "L’ordre d’affichage doit être un entier positif ou nul.",
        },
    ])("valide $field avec $value", async ({ field, value, message }) => {
        const user = userEvent.setup();
        render(
            <WorkOrderLinesEditor
                order={{ ...order, lines: [] }}
                onUpdated={vi.fn()}
            />
        );
        await openAddForm(user);
        await fillValidLine(user);

        const input = screen.getByLabelText(field);
        await user.clear(input);
        if (value) {
            await user.type(input, value);
        }
        await user.click(
            screen.getByRole("button", { name: "Ajouter la ligne" })
        );

        expect(screen.getByText(message)).toBeInTheDocument();
        expect(workOrdersApi.addWorkOrderLine).not.toHaveBeenCalled();
    });

    it("refuse une description dépassant 500 caractères", async () => {
        const user = userEvent.setup();
        render(
            <WorkOrderLinesEditor
                order={{ ...order, lines: [] }}
                onUpdated={vi.fn()}
            />
        );
        await openAddForm(user);
        await fillValidLine(user);
        fireEvent.change(screen.getByLabelText("Description"), {
            target: { value: "a".repeat(501) },
        });

        await user.click(
            screen.getByRole("button", { name: "Ajouter la ligne" })
        );

        expect(
            screen.getByText(
                "La description ne peut pas dépasser 500 caractères."
            )
        ).toBeInTheDocument();
        expect(workOrdersApi.addWorkOrderLine).not.toHaveBeenCalled();
    });

    it.each(["DELIVERED", "CANCELLED"] as const)(
        "désactive les opérations pour un ordre %s",
        (status) => {
            render(
                <WorkOrderLinesEditor
                    order={{ ...order, status }}
                    onUpdated={vi.fn()}
                />
            );

            expect(
                screen.queryByRole("button", {
                    name: "Ajouter une ligne",
                })
            ).not.toBeInTheDocument();
            expect(
                screen.queryByRole("button", { name: "Modifier" })
            ).not.toBeInTheDocument();
            expect(
                screen.queryByRole("button", { name: "Supprimer" })
            ).not.toBeInTheDocument();
        }
    );
});
