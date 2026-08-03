import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/providers/auth-provider");
vi.mock("@/features/invoices/api/invoices-api");
vi.mock(
    "@/features/invoices/components/odoo-integration-panel",
    () => ({
        OdooIntegrationPanel: ({
            invoiceId,
            localInvoiceStatus,
        }: {
            invoiceId: string;
            localInvoiceStatus: string;
        }) => (
            <div data-testid="odoo-panel">
                Odoo {invoiceId} {localInvoiceStatus}
            </div>
        ),
    })
);

const pushMock = vi.fn();
const routerMock = { push: pushMock };

vi.mock("next/navigation", () => ({
    useParams: () => ({ id: "invoice-1" }),
    useRouter: () => routerMock,
}));

import EmployeeInvoiceDetailPage from "@/app/(protected)/employee/invoices/[id]/page";
import { useAuth } from "@/components/providers/auth-provider";
import * as invoicesApi from "@/features/invoices/api/invoices-api";
import { invoiceFixture } from "@/features/invoices/testing/invoice-fixture";

beforeEach(() => {
    pushMock.mockReset();
    vi.mocked(invoicesApi.getEmployeeInvoice).mockReset();
    vi.mocked(invoicesApi.updateInvoiceStatus).mockReset();
    vi.mocked(useAuth).mockReturnValue({
        user: {
            id: "employee-1",
            firstName: "Alex",
            lastName: "Atelier",
            email: "alex@example.invalid",
            role: "ROLE_EMPLOYEE",
        },
        loading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
    });
});

describe("EmployeeInvoiceDetailPage", () => {
    it("affiche l’origine et le lien vers l’ordre d’une facture liée", async () => {
        vi.mocked(invoicesApi.getEmployeeInvoice).mockResolvedValue(
            invoiceFixture({ workOrderId: "order-1" })
        );

        render(<EmployeeInvoiceDetailPage />);

        expect(
            await screen.findByText(
                "Cette facture provient d'un ordre de réparation."
            )
        ).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: "Ouvrir le dossier atelier" })
        ).toHaveAttribute("href", "/employee/work-orders/order-1");
        expect(screen.getByTestId("odoo-panel")).toHaveTextContent(
            "Odoo invoice-1 DRAFT"
        );
    });

    it("n’affiche aucune origine pour une facture générique", async () => {
        vi.mocked(invoicesApi.getEmployeeInvoice).mockResolvedValue(
            invoiceFixture({ workOrderId: null })
        );

        render(<EmployeeInvoiceDetailPage />);

        expect(await screen.findByText("FAC-2026-0001")).toBeInTheDocument();
        expect(
            screen.queryByRole("link", { name: "Ouvrir le dossier atelier" })
        ).not.toBeInTheDocument();
        expect(screen.getByTestId("odoo-panel")).toBeInTheDocument();
    });

    it("conserve les transitions et le PDF d’une facture émise", async () => {
        const sentInvoice = invoiceFixture({
            status: "SENT",
            workOrderId: "order-1",
        });
        vi.mocked(invoicesApi.getEmployeeInvoice).mockResolvedValue(
            sentInvoice
        );
        vi.mocked(invoicesApi.updateInvoiceStatus).mockResolvedValue({
            ...sentInvoice,
            status: "PAID",
        });

        render(<EmployeeInvoiceDetailPage />);

        expect(
            await screen.findByRole("button", { name: "Télécharger le PDF" })
        ).toBeInTheDocument();
        fireEvent.click(
            screen.getByRole("button", { name: "Marquer payée" })
        );

        await waitFor(() => {
            expect(invoicesApi.updateInvoiceStatus).toHaveBeenCalledWith(
                "invoice-1",
                { status: "PAID" }
            );
        });
        expect(
            await screen.findByText("La facture est marquée comme payée.")
        ).toBeInTheDocument();
    });

    it("propage le statut React au panneau Odoo après l’émission", async () => {
        const draftInvoice = invoiceFixture({ status: "DRAFT" });
        vi.mocked(invoicesApi.getEmployeeInvoice).mockResolvedValue(
            draftInvoice
        );
        vi.mocked(invoicesApi.updateInvoiceStatus).mockResolvedValue({
            ...draftInvoice,
            status: "SENT",
        });
        vi.spyOn(window, "confirm").mockReturnValue(true);

        render(<EmployeeInvoiceDetailPage />);

        expect(await screen.findByTestId("odoo-panel")).toHaveTextContent(
            "Odoo invoice-1 DRAFT"
        );
        fireEvent.click(
            screen.getByRole("button", { name: "Émettre la facture" })
        );

        await waitFor(() => {
            expect(screen.getByTestId("odoo-panel")).toHaveTextContent(
                "Odoo invoice-1 SENT"
            );
        });
    });
});
