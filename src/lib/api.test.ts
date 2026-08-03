import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, apiFetchBlob } from "@/lib/api";

const fetchMock = vi.fn();

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("api", () => {
    it("appelle l'API via l'origine du frontend pour partager le cookie de session", async () => {
        fetchMock.mockResolvedValue(
            new Response(JSON.stringify({ id: "customer-1" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
        );

        await apiFetch("/api/v1/auth/me", { method: "GET" });

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/auth/me",
            expect.objectContaining({
                method: "GET",
                credentials: "include",
            })
        );
    });

    it("télécharge aussi les fichiers via l'origine du frontend", async () => {
        fetchMock.mockResolvedValue(
            new Response(new Blob(["pdf"]), {
                status: 200,
                headers: { "Content-Type": "application/pdf" },
            })
        );

        await apiFetchBlob("/api/v1/customers/invoices/invoice-1/pdf");

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/customers/invoices/invoice-1/pdf",
            { credentials: "include" }
        );
    });
});
