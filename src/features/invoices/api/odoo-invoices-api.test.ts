import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import {
    downloadOdooOfficialPdf,
    getOdooInvoiceState,
    postInvoiceToOdoo,
    refreshOdooInvoice,
    synchronizeInvoiceWithOdoo,
} from "@/features/invoices/api/odoo-invoices-api";
import type { OdooInvoiceIntegrationResponse } from "@/features/invoices/types/odoo-invoice.types";

const SAMPLE_STATE: OdooInvoiceIntegrationResponse = {
    invoiceId: "inv-1",
    odooPartnerId: 42,
    odooInvoiceId: 100,
    syncStatus: "SYNCED",
    accountingStatus: "POSTED",
    paymentStatus: "PAID",
    peppolStatus: "DONE",
    accountingNumber: "INV/2026/0001",
    currencyCode: "EUR",
    amountUntaxed: 100,
    amountTax: 21,
    amountTotal: 121,
    lastRequestId: "req-1",
    lastAttemptAt: "2026-07-24T10:00:00Z",
    lastSuccessfulSyncAt: "2026-07-24T10:00:05Z",
    lastErrorCode: null,
    lastErrorMessage: null,
    activeOperation: null,
    operationStartedAt: null,
    canPost: false,
    canDownloadOfficialPdf: true,
};

const fetchMock = vi.fn();

function jsonResponse(
    body: unknown,
    { status = 200, headers = {} }: { status?: number; headers?: Record<string, string> } = {}
) {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: new Headers(headers),
        json: async () => body,
    } as unknown as Response;
}

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe("odoo-invoices-api URLs et cookies", () => {
    it("construit l'URL GET de l'état et envoie les cookies", async () => {
        fetchMock.mockResolvedValue(jsonResponse(SAMPLE_STATE));

        const result = await getOdooInvoiceState("inv-1");

        expect(result).toEqual(SAMPLE_STATE);
        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toMatch(/\/api\/v1\/employee\/invoices\/inv-1\/odoo$/);
        expect(options).toMatchObject({
            method: "GET",
            credentials: "include",
        });
    });

    it("construit l'URL POST /sync", async () => {
        fetchMock.mockResolvedValue(jsonResponse(SAMPLE_STATE));

        await synchronizeInvoiceWithOdoo("inv-1");

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toMatch(/\/api\/v1\/employee\/invoices\/inv-1\/odoo\/sync$/);
        expect(options).toMatchObject({ method: "POST", credentials: "include" });
    });

    it("construit l'URL POST /post", async () => {
        fetchMock.mockResolvedValue(jsonResponse(SAMPLE_STATE));

        await postInvoiceToOdoo("inv-1");

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toMatch(/\/api\/v1\/employee\/invoices\/inv-1\/odoo\/post$/);
        expect(options).toMatchObject({ method: "POST", credentials: "include" });
    });

    it("construit l'URL POST /refresh", async () => {
        fetchMock.mockResolvedValue(jsonResponse(SAMPLE_STATE));

        await refreshOdooInvoice("inv-1");

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toMatch(
            /\/api\/v1\/employee\/invoices\/inv-1\/odoo\/refresh$/
        );
        expect(options).toMatchObject({ method: "POST", credentials: "include" });
    });

    it("parse le JSON renvoyé", async () => {
        fetchMock.mockResolvedValue(jsonResponse(SAMPLE_STATE));

        await expect(getOdooInvoiceState("inv-1")).resolves.toEqual(SAMPLE_STATE);
    });
});

describe("odoo-invoices-api gestion des erreurs", () => {
    it("transforme une erreur HTTP JSON en ApiError avec code et requestId", async () => {
        fetchMock.mockResolvedValue(
            jsonResponse(
                {
                    status: 409,
                    error: "Erreur d'intégration Odoo",
                    message: "Une opération Odoo est déjà en cours pour cette facture.",
                    code: "ODOO_OPERATION_IN_PROGRESS",
                    requestId: "req-123",
                },
                { status: 409 }
            )
        );

        const error = await synchronizeInvoiceWithOdoo("inv-1").catch((e) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(409);
        expect(error.message).toBe(
            "Une opération Odoo est déjà en cours pour cette facture."
        );
        expect(error.code).toBe("ODOO_OPERATION_IN_PROGRESS");
        expect(error.requestId).toBe("req-123");
    });

    it("rejette lorsqu'un corps 200 contient un JSON invalide", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers(),
            json: async () => {
                throw new SyntaxError("Unexpected token");
            },
        } as unknown as Response);

        await expect(getOdooInvoiceState("inv-1")).rejects.toBeInstanceOf(
            SyntaxError
        );
    });
});

describe("odoo-invoices-api téléchargement PDF", () => {
    let createObjectURL: ReturnType<typeof vi.fn>;
    let revokeObjectURL: ReturnType<typeof vi.fn>;
    let anchor: HTMLAnchorElement;
    let clickSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        createObjectURL = vi.fn(() => "blob:mock-url");
        revokeObjectURL = vi.fn();
        URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL;
        URL.revokeObjectURL = revokeObjectURL as unknown as typeof URL.revokeObjectURL;

        const realCreateElement = document.createElement.bind(document);
        anchor = realCreateElement("a");
        clickSpy = vi.spyOn(anchor, "click").mockImplementation(() => {});
        vi.spyOn(document, "createElement").mockImplementation((tag: string) =>
            tag === "a" ? anchor : realCreateElement(tag)
        );
    });

    it("récupère le PDF en Blob, lit le nom du fichier et déclenche le téléchargement", async () => {
        vi.useFakeTimers();
        const pdfBlob = new Blob(["%PDF-1.4"], { type: "application/pdf" });
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers({
                "content-type": "application/pdf",
                "content-disposition":
                    "attachment; filename*=utf-8''facture%20officielle.pdf",
            }),
            blob: async () => pdfBlob,
        } as unknown as Response);

        await downloadOdooOfficialPdf("inv-9");

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toMatch(/\/api\/v1\/employee\/invoices\/inv-9\/odoo\/pdf$/);
        expect(options).toMatchObject({ credentials: "include" });
        expect(createObjectURL).toHaveBeenCalledWith(pdfBlob);
        expect(anchor.download).toBe("facture officielle.pdf");
        expect(anchor.href).toContain("blob:mock-url");
        expect(clickSpy).toHaveBeenCalledTimes(1);

        vi.runAllTimers();
        expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
        vi.useRealTimers();
    });

    it("utilise un nom de repli quand Content-Disposition est absent", async () => {
        const pdfBlob = new Blob(["%PDF-1.4"], { type: "application/pdf" });
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers({ "content-type": "application/pdf" }),
            blob: async () => pdfBlob,
        } as unknown as Response);

        await downloadOdooOfficialPdf("inv-9");

        expect(anchor.download).toBe("facture-odoo-inv-9.pdf");
    });

    it("lève une erreur HTTP avant de traiter la réponse comme un PDF", async () => {
        fetchMock.mockResolvedValue(
            jsonResponse(
                {
                    message: "La réponse d'Odoo est invalide.",
                    code: "ODOO_INVALID_RESPONSE",
                },
                { status: 502 }
            )
        );

        const error = await downloadOdooOfficialPdf("inv-9").catch((e) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(502);
        expect(createObjectURL).not.toHaveBeenCalled();
        expect(clickSpy).not.toHaveBeenCalled();
    });
});
