import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import * as workOrdersApi from "@/features/work-orders/api/work-orders-api";
import { workOrderErrorMessage } from "@/features/work-orders/lib/work-order";
import type {
    WorkOrder,
    WorkOrderLineRequest,
} from "@/features/work-orders/types/work-order.types";

const fetchMock = vi.fn();

const order: WorkOrder = {
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

const lineRequest: WorkOrderLineRequest = {
    garageServiceId: null,
    description: "Diagnostic",
    quantity: 1,
    unitPrice: 50,
    vatRate: 21,
    displayOrder: 0,
};

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe("work-orders-api", () => {
    it("liste avec filtres, pagination et credentials", async () => {
        const page = {
            content: [],
            page: 2,
            size: 20,
            totalElements: 0,
            totalPages: 0,
            first: false,
            last: true,
        };
        fetchMock.mockResolvedValue(jsonResponse(page));

        await expect(
            workOrdersApi.getWorkOrders({
                status: "IN_PROGRESS",
                date: "2026-07-26",
                customerId: "customer id",
                page: 2,
                size: 20,
            })
        ).resolves.toEqual(page);

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toContain("/api/v1/employee/work-orders?");
        expect(url).toContain("status=IN_PROGRESS");
        expect(url).toContain("date=2026-07-26");
        expect(url).toContain("customerId=customer+id");
        expect(url).toContain("page=2");
        expect(init).toEqual(
            expect.objectContaining({
                method: "GET",
                credentials: "include",
            })
        );
    });

    it("charge un détail avec un identifiant encodé", async () => {
        fetchMock.mockResolvedValue(jsonResponse(order));

        await workOrdersApi.getWorkOrder("order/1");

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringMatching(
                /\/api\/v1\/employee\/work-orders\/order%2F1$/
            ),
            expect.objectContaining({ method: "GET" })
        );
    });

    it("crée un ordre depuis un rendez-vous avec le payload exact", async () => {
        const request = {
            assignedEmployeeId: null,
            mileageAtReception: 45000,
            internalNotes: null,
            initialServiceLineVatRate: null,
        };
        fetchMock.mockResolvedValue(jsonResponse(order, 201));

        await workOrdersApi.createWorkOrderFromAppointment(
            "appointment/1",
            request
        );

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringMatching(
                /\/api\/v1\/employee\/appointments\/appointment%2F1\/work-order$/
            ),
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify(request),
                credentials: "include",
            })
        );
    });

    it("modifie les informations atelier sans endpoint de statut", async () => {
        const request = {
            assignedEmployeeId: "employee-1",
            mileageAtReception: 51000,
            customerComplaint: null,
            diagnostic: "Usure",
            workPerformed: null,
            internalNotes: null,
        };
        fetchMock.mockResolvedValue(jsonResponse(order));

        await workOrdersApi.updateWorkOrder("order-1", request);

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringMatching(/\/work-orders\/order-1$/),
            expect.objectContaining({
                method: "PUT",
                body: JSON.stringify(request),
            })
        );
    });

    it("modifie le statut avec PATCH", async () => {
        fetchMock.mockResolvedValue(
            jsonResponse({ ...order, status: "PLANNED" })
        );

        await workOrdersApi.updateWorkOrderStatus("order-1", "PLANNED");

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringMatching(/\/work-orders\/order-1\/status$/),
            expect.objectContaining({
                method: "PATCH",
                body: JSON.stringify({ status: "PLANNED" }),
            })
        );
    });

    it("ajoute une ligne", async () => {
        fetchMock.mockResolvedValue(jsonResponse(order, 201));

        await workOrdersApi.addWorkOrderLine("order-1", lineRequest);

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringMatching(/\/work-orders\/order-1\/lines$/),
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify(lineRequest),
            })
        );
    });

    it("modifie une ligne avec les deux identifiants encodés", async () => {
        fetchMock.mockResolvedValue(jsonResponse(order));

        await workOrdersApi.updateWorkOrderLine(
            "order/1",
            "line/1",
            lineRequest
        );

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringMatching(
                /\/work-orders\/order%2F1\/lines\/line%2F1$/
            ),
            expect.objectContaining({ method: "PUT" })
        );
    });

    it("traite une suppression 204 sans lire de JSON", async () => {
        fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

        await expect(
            workOrdersApi.deleteWorkOrderLine("order-1", "line-1")
        ).resolves.toBeUndefined();
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringMatching(/\/work-orders\/order-1\/lines\/line-1$/),
            expect.objectContaining({
                method: "DELETE",
                credentials: "include",
            })
        );
    });

    it("conserve un message métier sûr", async () => {
        fetchMock.mockResolvedValue(
            jsonResponse(
                {
                    message:
                        "Transition de statut interdite : DRAFT -> DELIVERED",
                },
                409
            )
        );

        const error = await workOrdersApi
            .updateWorkOrderStatus("order-1", "DELIVERED")
            .catch((requestError) => requestError);

        expect(error).toBeInstanceOf(ApiError);
        expect(
            workOrderErrorMessage(
                error,
                "Impossible de modifier le statut."
            )
        ).toBe("Transition de statut interdite : DRAFT -> DELIVERED");
    });

    it("assainit une erreur technique inconnue", async () => {
        fetchMock.mockResolvedValue(
            jsonResponse(
                {
                    message:
                        'SQL duplicate key on table work_orders constraint "internal_name"',
                },
                500
            )
        );

        const error = await workOrdersApi
            .addWorkOrderLine("order-1", lineRequest)
            .catch((requestError) => requestError);
        const message = workOrderErrorMessage(
            error,
            "Impossible d’enregistrer la ligne."
        );

        expect(message).toBe("Impossible d’enregistrer la ligne.");
        expect(message).not.toMatch(/SQL|table|constraint|duplicate/i);
    });
});
