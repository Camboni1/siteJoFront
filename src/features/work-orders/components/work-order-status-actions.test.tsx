import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api";

vi.mock("@/features/work-orders/api/work-orders-api");

import * as workOrdersApi from "@/features/work-orders/api/work-orders-api";
import { WorkOrderStatusActions } from "@/features/work-orders/components/work-order-status-actions";
import type {
    WorkOrder,
    WorkOrderStatus,
} from "@/features/work-orders/types/work-order.types";

const baseOrder: WorkOrder = {
    id: "order-1",
    appointmentId: "appointment-1",
    customerId: "customer-1",
    customerVehicleId: "vehicle-1",
    assignedEmployeeId: null,
    status: "DRAFT",
    mileageAtReception: null,
    customerComplaint: null,
    diagnostic: null,
    workPerformed: null,
    internalNotes: null,
    openedAt: "2026-07-26T08:00:00Z",
    startedAt: null,
    completedAt: null,
    deliveredAt: null,
    lines: [],
    amountExcludingVat: 0,
    vatAmount: 0,
    amountIncludingVat: 0,
    createdAt: "2026-07-26T08:00:00Z",
    updatedAt: "2026-07-26T08:00:00Z",
};

function renderStatus(status: WorkOrderStatus, onUpdated = vi.fn()) {
    return {
        onUpdated,
        ...render(
            <WorkOrderStatusActions
                order={{ ...baseOrder, status }}
                onUpdated={onUpdated}
            />
        ),
    };
}

beforeEach(() => {
    vi.mocked(workOrdersApi.updateWorkOrderStatus).mockReset();
    vi.restoreAllMocks();
});

describe("WorkOrderStatusActions", () => {
    it.each([
        ["DRAFT", ["Planifier", "Annuler le dossier"]],
        ["PLANNED", ["Démarrer l’intervention", "Annuler le dossier"]],
        [
            "IN_PROGRESS",
            [
                "Mettre en attente de pièces",
                "Marquer comme prêt",
                "Annuler le dossier",
            ],
        ],
        [
            "WAITING_FOR_PARTS",
            [
                "Reprendre l’intervention",
                "Marquer comme prêt",
                "Annuler le dossier",
            ],
        ],
        ["READY", ["Marquer comme livré"]],
    ] as [WorkOrderStatus, string[]][])(
        "propose uniquement les transitions depuis %s",
        (status, labels) => {
            renderStatus(status);

            const buttons = screen.getAllByRole("button");
            expect(buttons.map((button) => button.textContent)).toEqual(labels);
        }
    );

    it.each(["DELIVERED", "CANCELLED"] as WorkOrderStatus[])(
        "ne propose aucune action depuis %s",
        (status) => {
            renderStatus(status);

            expect(screen.queryByRole("button")).not.toBeInTheDocument();
            expect(
                screen.getByText(
                    "Aucune transition n’est disponible depuis ce statut."
                )
            ).toBeInTheDocument();
        }
    );

    it("remplace l’ordre par la réponse backend avec ses dates métier", async () => {
        const user = userEvent.setup();
        const updated = {
            ...baseOrder,
            status: "IN_PROGRESS" as const,
            startedAt: "2026-07-26T09:00:00Z",
            updatedAt: "2026-07-26T09:00:00Z",
        };
        vi.mocked(
            workOrdersApi.updateWorkOrderStatus
        ).mockResolvedValue(updated);
        const { onUpdated } = renderStatus("PLANNED");

        await user.click(
            screen.getByRole("button", {
                name: "Démarrer l’intervention",
            })
        );

        await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(updated));
        expect(
            screen.getByText("Le statut du dossier a été mis à jour.")
        ).toBeInTheDocument();
    });

    it.each([
        ["DRAFT", "Annuler le dossier", "CANCELLED"],
        ["READY", "Marquer comme livré", "DELIVERED"],
    ] as [WorkOrderStatus, string, WorkOrderStatus][])(
        "demande confirmation avant %s -> %s",
        async (status, label, target) => {
            const user = userEvent.setup();
            const confirmSpy = vi
                .spyOn(window, "confirm")
                .mockReturnValue(false);
            renderStatus(status);

            await user.click(screen.getByRole("button", { name: label }));

            expect(confirmSpy).toHaveBeenCalled();
            expect(
                workOrdersApi.updateWorkOrderStatus
            ).not.toHaveBeenCalled();
            expect(target).toBeTruthy();
        }
    );

    it("bloque un double clic pendant la transition", async () => {
        const user = userEvent.setup();
        vi.mocked(
            workOrdersApi.updateWorkOrderStatus
        ).mockReturnValue(new Promise(() => {}));
        renderStatus("DRAFT");
        const button = screen.getByRole("button", { name: "Planifier" });

        await user.dblClick(button);

        expect(workOrdersApi.updateWorkOrderStatus).toHaveBeenCalledTimes(1);
        expect(button).toBeDisabled();
    });

    it("affiche proprement un conflit backend", async () => {
        const user = userEvent.setup();
        vi.mocked(
            workOrdersApi.updateWorkOrderStatus
        ).mockRejectedValue(
            new ApiError(
                "Transition de statut interdite : DRAFT -> DELIVERED",
                409
            )
        );
        renderStatus("DRAFT");

        await user.click(
            screen.getByRole("button", { name: "Planifier" })
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Transition de statut interdite : DRAFT -> DELIVERED"
        );
    });
});
