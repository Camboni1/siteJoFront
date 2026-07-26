import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/features/work-orders/api/work-orders-api");

import * as workOrdersApi from "@/features/work-orders/api/work-orders-api";
import { WorkOrderInfoForm } from "@/features/work-orders/components/work-order-info-form";
import type { WorkOrder } from "@/features/work-orders/types/work-order.types";

const order: WorkOrder = {
    id: "order-1",
    appointmentId: "appointment-1",
    customerId: "customer-1",
    customerVehicleId: "vehicle-1",
    assignedEmployeeId: "employee-1",
    status: "IN_PROGRESS",
    mileageAtReception: 45000,
    customerComplaint: "Bruit à l’avant",
    diagnostic: "À contrôler",
    workPerformed: null,
    internalNotes: "Appeler le client",
    openedAt: "2026-07-26T08:00:00Z",
    startedAt: "2026-07-26T09:00:00Z",
    completedAt: null,
    deliveredAt: null,
    lines: [],
    amountExcludingVat: 0,
    vatAmount: 0,
    amountIncludingVat: 0,
    createdAt: "2026-07-26T08:00:00Z",
    updatedAt: "2026-07-26T09:00:00Z",
};

beforeEach(() => {
    vi.mocked(workOrdersApi.updateWorkOrder).mockReset();
});

describe("WorkOrderInfoForm", () => {
    it("préserve assignedEmployeeId et transforme les chaînes vides en null", async () => {
        const user = userEvent.setup();
        const updated = {
            ...order,
            customerComplaint: null,
            diagnostic: null,
            internalNotes: null,
        };
        vi.mocked(workOrdersApi.updateWorkOrder).mockResolvedValue(updated);
        const onUpdated = vi.fn();
        render(<WorkOrderInfoForm order={order} onUpdated={onUpdated} />);

        await user.clear(screen.getByLabelText("Demande du client"));
        await user.clear(screen.getByLabelText("Diagnostic"));
        await user.clear(screen.getByLabelText("Notes internes"));
        await user.type(
            screen.getByLabelText("Travaux effectués"),
            "Remplacement"
        );
        await user.click(
            screen.getByRole("button", {
                name: "Enregistrer le dossier",
            })
        );

        await waitFor(() =>
            expect(workOrdersApi.updateWorkOrder).toHaveBeenCalledWith(
                "order-1",
                {
                    assignedEmployeeId: "employee-1",
                    mileageAtReception: 45000,
                    customerComplaint: null,
                    diagnostic: null,
                    workPerformed: "Remplacement",
                    internalNotes: null,
                }
            )
        );
        expect(onUpdated).toHaveBeenCalledWith(updated);
    });

    it("refuse un kilométrage négatif", async () => {
        const user = userEvent.setup();
        render(
            <WorkOrderInfoForm order={order} onUpdated={vi.fn()} />
        );

        await user.clear(
            screen.getByLabelText("Kilométrage à la réception")
        );
        await user.type(
            screen.getByLabelText("Kilométrage à la réception"),
            "-1"
        );
        await user.click(
            screen.getByRole("button", {
                name: "Enregistrer le dossier",
            })
        );

        expect(screen.getByRole("alert")).toHaveTextContent(
            "Le kilométrage d’entrée doit être un entier positif ou nul."
        );
        expect(workOrdersApi.updateWorkOrder).not.toHaveBeenCalled();
    });

    it.each(["DELIVERED", "CANCELLED"] as const)(
        "rend le formulaire non modifiable pour %s",
        (status) => {
            render(
                <WorkOrderInfoForm
                    order={{ ...order, status }}
                    onUpdated={vi.fn()}
                />
            );

            expect(
                screen.getByRole("button", {
                    name: "Enregistrer le dossier",
                })
            ).toBeDisabled();
            expect(
                screen.getByText(
                    "Un ordre livré ou annulé ne peut plus être modifié."
                )
            ).toBeInTheDocument();
        }
    );

    it("n’expose pas une erreur technique", async () => {
        const user = userEvent.setup();
        vi.mocked(workOrdersApi.updateWorkOrder).mockRejectedValue(
            new Error("SQL work_orders internal")
        );
        render(
            <WorkOrderInfoForm order={order} onUpdated={vi.fn()} />
        );

        await user.click(
            screen.getByRole("button", {
                name: "Enregistrer le dossier",
            })
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Impossible d’enregistrer le dossier atelier."
        );
        expect(screen.queryByText(/SQL|work_orders/)).not.toBeInTheDocument();
    });
});
