import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/features/invoices/api/odoo-invoices-api");

import * as odooApi from "@/features/invoices/api/odoo-invoices-api";
import { OdooIntegrationPanel } from "@/features/invoices/components/odoo-integration-panel";
import type { OdooInvoiceIntegrationResponse } from "@/features/invoices/types/odoo-invoice.types";

function makeState(
    overrides: Partial<OdooInvoiceIntegrationResponse> = {}
): OdooInvoiceIntegrationResponse {
    return {
        invoiceId: "inv-1",
        odooPartnerId: 42,
        odooInvoiceId: 100,
        syncStatus: "SYNCED",
        accountingStatus: "DRAFT",
        paymentStatus: "NOT_PAID",
        peppolStatus: "NOT_SENT",
        accountingNumber: null,
        currencyCode: "EUR",
        amountUntaxed: 100,
        amountTax: 21,
        amountTotal: 121,
        lastRequestId: null,
        lastAttemptAt: "2026-07-24T10:00:00Z",
        lastSuccessfulSyncAt: "2026-07-24T10:00:05Z",
        lastErrorCode: null,
        lastErrorMessage: null,
        activeOperation: null,
        operationStartedAt: null,
        canPost: false,
        canDownloadOfficialPdf: false,
        ...overrides,
    };
}

beforeEach(() => {
    vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(makeState());
    vi.mocked(odooApi.synchronizeInvoiceWithOdoo).mockResolvedValue(makeState());
    vi.mocked(odooApi.postInvoiceToOdoo).mockResolvedValue(makeState());
    vi.mocked(odooApi.refreshOdooInvoice).mockResolvedValue(makeState());
    vi.mocked(odooApi.downloadOdooOfficialPdf).mockResolvedValue(undefined);
});

afterEach(() => {
    vi.clearAllMocks();
});

async function renderReady(
    props: { invoiceId?: string; canManage?: boolean } = {}
) {
    const view = render(
        <OdooIntegrationPanel
            invoiceId={props.invoiceId ?? "inv-1"}
            canManage={props.canManage ?? true}
        />
    );
    // Attend la fin du chargement initial (le bouton n'apparaît qu'ensuite).
    await screen.findByRole("button", { name: "Synchroniser avec Odoo" });
    return view;
}

describe("OdooIntegrationPanel affichage", () => {
    it("affiche les libellés de statuts", async () => {
        vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(
            makeState({
                syncStatus: "SYNCED",
                accountingStatus: "POSTED",
                paymentStatus: "PAID",
                peppolStatus: "DONE",
            })
        );

        await renderReady();

        expect(screen.getByText("Synchronisée")).toBeInTheDocument();
        expect(screen.getByText("Comptabilisée")).toBeInTheDocument();
        expect(screen.getByText("Payée")).toBeInTheDocument();
        expect(screen.getByText("Envoyée")).toBeInTheDocument();
    });

    it("affiche les montants formatés avec la devise du backend", async () => {
        vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(
            makeState({
                amountUntaxed: 100,
                amountTax: 21,
                amountTotal: 121,
                currencyCode: "EUR",
            })
        );

        await renderReady();

        expect(screen.getByText(/^100,00/)).toBeInTheDocument();
        expect(screen.getByText(/^21,00/)).toBeInTheDocument();
        expect(screen.getByText(/^121,00/)).toBeInTheDocument();
    });

    it("affiche la dernière erreur fonctionnelle et son code", async () => {
        vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(
            makeState({
                lastErrorMessage: "Odoo est temporairement indisponible.",
                lastErrorCode: "ODOO_UNAVAILABLE",
            })
        );

        await renderReady();

        expect(
            screen.getByText("Odoo est temporairement indisponible.")
        ).toBeInTheDocument();
        expect(screen.getByText(/ODOO_UNAVAILABLE/)).toBeInTheDocument();
    });
});

describe("OdooIntegrationPanel boutons conditionnels", () => {
    it("affiche « Comptabiliser » uniquement si canPost est vrai", async () => {
        vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(
            makeState({ canPost: true })
        );

        await renderReady();

        expect(
            screen.getByRole("button", { name: "Comptabiliser" })
        ).toBeInTheDocument();
    });

    it("masque « Comptabiliser » quand canPost est faux", async () => {
        vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(
            makeState({ canPost: false })
        );

        await renderReady();

        expect(
            screen.queryByRole("button", { name: "Comptabiliser" })
        ).not.toBeInTheDocument();
    });

    it("affiche le bouton PDF uniquement si canDownloadOfficialPdf est vrai", async () => {
        vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(
            makeState({ canDownloadOfficialPdf: true })
        );

        await renderReady();

        expect(
            screen.getByRole("button", {
                name: "Télécharger le PDF officiel",
            })
        ).toBeInTheDocument();
    });

    it("masque le bouton PDF quand canDownloadOfficialPdf est faux", async () => {
        vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(
            makeState({ canDownloadOfficialPdf: false })
        );

        await renderReady();

        expect(
            screen.queryByRole("button", {
                name: "Télécharger le PDF officiel",
            })
        ).not.toBeInTheDocument();
    });
});

describe("OdooIntegrationPanel opérations et désactivation", () => {
    it("désactive les actions quand une opération backend est active", async () => {
        vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(
            makeState({ activeOperation: "SYNC", canPost: true })
        );

        await renderReady();

        expect(
            screen.getByText(/déjà en cours côté Odoo/)
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Synchroniser avec Odoo" })
        ).toBeDisabled();
        expect(
            screen.getByRole("button", { name: "Comptabiliser" })
        ).toBeDisabled();
        expect(
            screen.getByRole("button", { name: "Actualiser les statuts" })
        ).toBeDisabled();
    });

    it("désactive et bascule le libellé pendant une synchronisation en cours", async () => {
        let resolveSync: (value: OdooInvoiceIntegrationResponse) => void =
            () => {};
        vi.mocked(odooApi.synchronizeInvoiceWithOdoo).mockReturnValue(
            new Promise((resolve) => {
                resolveSync = resolve;
            })
        );

        const user = userEvent.setup();
        await renderReady();

        await user.click(
            screen.getByRole("button", { name: "Synchroniser avec Odoo" })
        );

        const pendingButton = screen.getByRole("button", {
            name: "Synchronisation...",
        });
        expect(pendingButton).toBeDisabled();
        expect(
            screen.getByRole("button", { name: "Actualiser les statuts" })
        ).toBeDisabled();

        resolveSync(makeState());
    });
});

describe("OdooIntegrationPanel déclenchement des actions", () => {
    it("déclenche la synchronisation", async () => {
        const user = userEvent.setup();
        await renderReady({ invoiceId: "inv-7" });

        await user.click(
            screen.getByRole("button", { name: "Synchroniser avec Odoo" })
        );

        await waitFor(() =>
            expect(odooApi.synchronizeInvoiceWithOdoo).toHaveBeenCalledWith(
                "inv-7"
            )
        );
    });

    it("déclenche la comptabilisation", async () => {
        vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(
            makeState({ canPost: true })
        );
        const user = userEvent.setup();
        await renderReady({ invoiceId: "inv-7" });

        await user.click(screen.getByRole("button", { name: "Comptabiliser" }));

        await waitFor(() =>
            expect(odooApi.postInvoiceToOdoo).toHaveBeenCalledWith("inv-7")
        );
    });

    it("déclenche l'actualisation des statuts", async () => {
        const user = userEvent.setup();
        await renderReady({ invoiceId: "inv-7" });

        await user.click(
            screen.getByRole("button", { name: "Actualiser les statuts" })
        );

        await waitFor(() =>
            expect(odooApi.refreshOdooInvoice).toHaveBeenCalledWith("inv-7")
        );
    });

    it("déclenche le téléchargement du PDF officiel", async () => {
        vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(
            makeState({ canDownloadOfficialPdf: true })
        );
        const user = userEvent.setup();
        await renderReady({ invoiceId: "inv-7" });

        await user.click(
            screen.getByRole("button", {
                name: "Télécharger le PDF officiel",
            })
        );

        await waitFor(() =>
            expect(odooApi.downloadOdooOfficialPdf).toHaveBeenCalledWith(
                "inv-7"
            )
        );
    });
});

describe("OdooIntegrationPanel contrôle des rôles", () => {
    it("ne rend rien et n'appelle aucune route pour un client ordinaire", () => {
        const { container } = render(
            <OdooIntegrationPanel invoiceId="inv-1" canManage={false} />
        );

        expect(container).toBeEmptyDOMElement();
        expect(odooApi.getOdooInvoiceState).not.toHaveBeenCalled();
    });
});
