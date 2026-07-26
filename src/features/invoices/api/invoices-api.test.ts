import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import * as invoicesApi from "@/features/invoices/api/invoices-api";
import { invoiceFixture } from "@/features/invoices/testing/invoice-fixture";

const fetchMock = vi.fn();

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

describe("invoices-api", () => {
    it("crée le brouillon depuis l’ordre avec l’endpoint et le payload exacts", async () => {
        const response = invoiceFixture({ workOrderId: "order/1" });
        const request = {
            invoiceDate: "2026-07-26",
            dueDate: "2026-07-26",
            currency: "EUR",
            notes: null,
        };
        fetchMock.mockResolvedValue(jsonResponse(response, 201));

        await expect(
            invoicesApi.createInvoiceDraftFromWorkOrder("order/1", request)
        ).resolves.toEqual(response);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toMatch(
            /\/api\/v1\/employee\/work-orders\/order%2F1\/invoice-draft$/
        );
        expect(init).toEqual(
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify(request),
                credentials: "include",
            })
        );
        expect(JSON.parse(init.body as string)).toEqual(request);
        expect(JSON.parse(init.body as string)).not.toHaveProperty(
            "customerId"
        );
        expect(JSON.parse(init.body as string)).not.toHaveProperty("lines");
    });

    it("reste compatible avec une facture générique sans ordre", async () => {
        const response = invoiceFixture({ workOrderId: null });
        fetchMock.mockResolvedValue(jsonResponse(response, 201));

        await expect(
            invoicesApi.createInvoiceDraftFromWorkOrder("order-1", {
                invoiceDate: "2026-07-26",
                dueDate: "2026-07-26",
                currency: "EUR",
                notes: "Contrôle",
            })
        ).resolves.toMatchObject({ id: "invoice-1", workOrderId: null });
    });

    it("propage une erreur métier structurée au composant", async () => {
        fetchMock.mockResolvedValue(
            jsonResponse(
                {
                    message:
                        "Une facture existe déjà pour cet ordre de réparation",
                },
                409
            )
        );

        const error = await invoicesApi
            .createInvoiceDraftFromWorkOrder("order-1", {
                invoiceDate: "2026-07-26",
                dueDate: "2026-07-26",
                currency: "EUR",
                notes: null,
            })
            .catch((requestError) => requestError);

        expect(error).toBeInstanceOf(ApiError);
        expect(error).toMatchObject({
            status: 409,
            message: "Une facture existe déjà pour cet ordre de réparation",
        });
    });
});
