import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/features/invoices/api/odoo-invoices-api");

import * as odooApi from "@/features/invoices/api/odoo-invoices-api";
import { ApiError } from "@/lib/api";
import { OdooIntegrationPanel } from "@/features/invoices/components/odoo-integration-panel";
import type { OdooInvoiceIntegrationResponse } from "@/features/invoices/types/odoo-invoice.types";

function makeState(
    overrides: Partial<OdooInvoiceIntegrationResponse> = {}
): OdooInvoiceIntegrationResponse {
    return {
        invoiceId: "inv-1",
        odooPartnerId: null,
        odooInvoiceId: null,
        syncStatus: "NOT_SYNCED",
        accountingStatus: "UNKNOWN",
        paymentStatus: "UNKNOWN",
        peppolStatus: "UNKNOWN",
        accountingNumber: null,
        currencyCode: null,
        amountUntaxed: null,
        amountTax: null,
        amountTotal: null,
        lastRequestId: null,
        lastAttemptAt: null,
        lastSuccessfulSyncAt: null,
        lastErrorCode: null,
        lastErrorMessage: null,
        activeOperation: null,
        operationStartedAt: null,
        canPost: false,
        canDownloadOfficialPdf: false,
        ...overrides,
    };
}

// Facture jamais synchronisée (aucune liaison Odoo).
const neverSynced = () => makeState();

// Facture liée, brouillon Odoo (peut être comptabilisée).
const syncedDraft = (overrides: Partial<OdooInvoiceIntegrationResponse> = {}) =>
    makeState({
        odooPartnerId: 42,
        odooInvoiceId: 100,
        syncStatus: "SYNCED",
        accountingStatus: "DRAFT",
        paymentStatus: "NOT_PAID",
        peppolStatus: "NOT_SENT",
        currencyCode: "EUR",
        amountUntaxed: 200,
        amountTax: 42,
        amountTotal: 242,
        lastSuccessfulSyncAt: "2026-07-24T10:00:05Z",
        lastAttemptAt: "2026-07-24T10:00:00Z",
        canPost: true,
        ...overrides,
    });

// Facture liée et comptabilisée dans Odoo.
const posted = (overrides: Partial<OdooInvoiceIntegrationResponse> = {}) =>
    syncedDraft({
        accountingStatus: "POSTED",
        accountingNumber: "FAC/2026/00002",
        canPost: false,
        canDownloadOfficialPdf: true,
        ...overrides,
    });

beforeEach(() => {
    vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(neverSynced());
    vi.mocked(odooApi.synchronizeInvoiceWithOdoo).mockResolvedValue(syncedDraft());
    vi.mocked(odooApi.postInvoiceToOdoo).mockResolvedValue(posted());
    vi.mocked(odooApi.refreshOdooInvoice).mockResolvedValue(syncedDraft());
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
    // « Actualiser les statuts » est toujours présent une fois l'état chargé.
    await screen.findByRole("button", { name: "Actualiser les statuts" });
    return view;
}

describe("OdooIntegrationPanel — libellés adaptatifs", () => {
    it("facture jamais synchronisée : action principale « Synchroniser avec Odoo »", async () => {
        vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(neverSynced());

        await renderReady();

        expect(
            screen.getByRole("button", { name: "Synchroniser avec Odoo" })
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Resynchroniser" })
        ).not.toBeInTheDocument();
        expect(
            screen.getByText(/pas encore synchronisée avec Odoo/)
        ).toBeInTheDocument();
    });

    it("facture liée en brouillon : « Resynchroniser » + « Comptabiliser »", async () => {
        vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(syncedDraft());

        await renderReady();

        expect(
            screen.getByRole("button", { name: "Resynchroniser" })
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Synchroniser avec Odoo" })
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Comptabiliser" })
        ).toBeInTheDocument();
    });

    it("facture comptabilisée : note « déjà comptabilisée », pas de « Comptabiliser », PDF disponible", async () => {
        vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(posted());

        await renderReady();

        expect(
            screen.getByText(/déjà comptabilisée dans Odoo/)
        ).toBeInTheDocument();
        // Le numéro comptable apparaît à la fois dans la note et dans le détail.
        expect(
            screen.getAllByText(/FAC\/2026\/00002/).length
        ).toBeGreaterThan(0);
        expect(
            screen.queryByRole("button", { name: "Comptabiliser" })
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Resynchroniser" })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Télécharger le PDF officiel" })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Actualiser les statuts" })
        ).toBeInTheDocument();
    });
});

describe("OdooIntegrationPanel — indisponibilité Odoo (récupérable)", () => {
    it("resync ODOO_UNAVAILABLE : conserve les infos Odoo et rassure sans prétendre jamais synchronisée", async () => {
        vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(syncedDraft());
        vi.mocked(odooApi.synchronizeInvoiceWithOdoo).mockRejectedValueOnce(
            new ApiError(
                "Odoo est temporairement indisponible.",
                503,
                "ODOO_UNAVAILABLE",
                "req-out-1"
            )
        );

        const user = userEvent.setup();
        await renderReady();
        await user.click(screen.getByRole("button", { name: "Resynchroniser" }));

        // Erreur fonctionnelle + message rassurant
        expect(
            await screen.findByText("Odoo est temporairement indisponible.")
        ).toBeInTheDocument();
        expect(
            screen.getByText(/déjà synchronisées avec Odoo sont conservées/)
        ).toBeInTheDocument();
        // Les données Odoo restent visibles (liaison conservée)
        expect(screen.getByText("100")).toBeInTheDocument(); // odooInvoiceId
        expect(screen.getByText(/242,00/)).toBeInTheDocument(); // montant total
        // Ne prétend jamais qu'elle n'a jamais été synchronisée
        expect(
            screen.queryByText(/pas encore synchronisée avec Odoo/)
        ).not.toBeInTheDocument();
    });

    it("rétablissement : une resync réussie remplace l'état et efface l'erreur", async () => {
        vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(
            syncedDraft({
                lastErrorCode: "ODOO_UNAVAILABLE",
                lastErrorMessage: "Odoo est temporairement indisponible.",
            })
        );
        vi.mocked(odooApi.synchronizeInvoiceWithOdoo).mockResolvedValue(
            syncedDraft() // état propre, sans erreur
        );

        const user = userEvent.setup();
        await renderReady();
        // L'ancienne erreur est visible au départ
        expect(screen.getByText(/Code : ODOO_UNAVAILABLE/)).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Resynchroniser" }));

        await waitFor(() =>
            expect(
                screen.getByText("La facture a été synchronisée avec Odoo.")
            ).toBeInTheDocument()
        );
        expect(
            screen.queryByText(/Code : ODOO_UNAVAILABLE/)
        ).not.toBeInTheDocument();
    });
});

describe("OdooIntegrationPanel — affichage & montants", () => {
    it("affiche les statuts et montants", async () => {
        vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(
            syncedDraft({ peppolStatus: "DONE" })
        );

        await renderReady();

        expect(screen.getByText("Synchronisée")).toBeInTheDocument();
        expect(screen.getByText("Brouillon")).toBeInTheDocument();
        expect(screen.getByText("Envoyée")).toBeInTheDocument();
        expect(screen.getByText(/^200,00/)).toBeInTheDocument();
        expect(screen.getByText(/^42,00/)).toBeInTheDocument();
        expect(screen.getByText(/^242,00/)).toBeInTheDocument();
    });
});

describe("OdooIntegrationPanel — désactivation & opération active", () => {
    it("désactive les actions quand une opération backend est active", async () => {
        vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(
            syncedDraft({ activeOperation: "SYNC" })
        );

        await renderReady();

        expect(screen.getByText(/déjà en cours côté Odoo/)).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Resynchroniser" })
        ).toBeDisabled();
        expect(
            screen.getByRole("button", { name: "Comptabiliser" })
        ).toBeDisabled();
        expect(
            screen.getByRole("button", { name: "Actualiser les statuts" })
        ).toBeDisabled();
    });

    it("désactive et bascule le libellé pendant une resync en cours", async () => {
        vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(syncedDraft());
        let resolveSync: (value: OdooInvoiceIntegrationResponse) => void =
            () => {};
        vi.mocked(odooApi.synchronizeInvoiceWithOdoo).mockReturnValue(
            new Promise((resolve) => {
                resolveSync = resolve;
            })
        );

        const user = userEvent.setup();
        await renderReady();
        await user.click(screen.getByRole("button", { name: "Resynchroniser" }));

        const pendingButton = screen.getByRole("button", {
            name: "Resynchronisation...",
        });
        expect(pendingButton).toBeDisabled();
        expect(
            screen.getByRole("button", { name: "Actualiser les statuts" })
        ).toBeDisabled();

        resolveSync(syncedDraft());
    });
});

describe("OdooIntegrationPanel — déclenchement des actions", () => {
    it("déclenche la synchronisation initiale", async () => {
        vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(neverSynced());
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
        vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(syncedDraft());
        const user = userEvent.setup();
        await renderReady({ invoiceId: "inv-7" });

        await user.click(screen.getByRole("button", { name: "Comptabiliser" }));

        await waitFor(() =>
            expect(odooApi.postInvoiceToOdoo).toHaveBeenCalledWith("inv-7")
        );
    });

    it("déclenche l'actualisation des statuts", async () => {
        vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(syncedDraft());
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
        vi.mocked(odooApi.getOdooInvoiceState).mockResolvedValue(posted());
        const user = userEvent.setup();
        await renderReady({ invoiceId: "inv-7" });

        await user.click(
            screen.getByRole("button", {
                name: "Télécharger le PDF officiel",
            })
        );

        await waitFor(() =>
            expect(odooApi.downloadOdooOfficialPdf).toHaveBeenCalledWith("inv-7")
        );
    });
});

describe("OdooIntegrationPanel — contrôle des rôles", () => {
    it("ne rend rien et n'appelle aucune route pour un client ordinaire", () => {
        const { container } = render(
            <OdooIntegrationPanel invoiceId="inv-1" canManage={false} />
        );

        expect(container).toBeEmptyDOMElement();
        expect(odooApi.getOdooInvoiceState).not.toHaveBeenCalled();
    });
});
