import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as customersApi from "@/features/customers/api/customers-api";
import { InvoiceForm } from "@/features/invoices/components/invoice-form";
import { invoiceFixture } from "@/features/invoices/testing/invoice-fixture";
import type { Customer } from "@/features/customers/types/customer.types";

vi.mock("@/features/customers/api/customers-api");

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushMock }),
}));

const customers: Customer[] = [
    {
        id: "customer-1",
        appUserId: null,
        firstName: "Marie",
        lastName: "Dupont",
        email: "marie@example.invalid",
        phone: null,
        street: null,
        postalCode: null,
        city: null,
        country: null,
        vatNumber: null,
        notes: null,
        createdAt: "2026-07-01T08:00:00Z",
        updatedAt: "2026-07-01T08:00:00Z",
    },
    {
        id: "customer-2",
        appUserId: null,
        firstName: "Luc",
        lastName: "Martin",
        email: "luc@example.invalid",
        phone: null,
        street: null,
        postalCode: null,
        city: null,
        country: null,
        vatNumber: null,
        notes: null,
        createdAt: "2026-07-01T08:00:00Z",
        updatedAt: "2026-07-01T08:00:00Z",
    },
];

beforeEach(() => {
    pushMock.mockReset();
    vi.mocked(customersApi.getCustomers).mockReset();
    vi.mocked(customersApi.getCustomers).mockResolvedValue(customers);
});

describe("InvoiceForm", () => {
    it("verrouille le client d’une facture liée sans charger la liste", async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        render(
            <InvoiceForm
                initialInvoice={invoiceFixture({
                    workOrderId: "order-1",
                    customerId: "customer-1",
                })}
                submitLabel="Enregistrer"
                submittingLabel="Enregistrement..."
                onSubmit={onSubmit}
                onCancel={vi.fn()}
            />
        );

        expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
        expect(screen.getByText("Marie Dupont")).toBeInTheDocument();
        expect(
            screen.getByText(
                "Le client est lié au dossier atelier et ne peut pas être modifié."
            )
        ).toBeInTheDocument();
        expect(customersApi.getCustomers).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({ customerId: "customer-1" })
            );
        });
    });

    it("conserve le sélecteur modifiable pour une facture générique", async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        render(
            <InvoiceForm
                initialInvoice={invoiceFixture({
                    workOrderId: null,
                    customerId: "customer-1",
                })}
                submitLabel="Enregistrer"
                submittingLabel="Enregistrement..."
                onSubmit={onSubmit}
                onCancel={vi.fn()}
            />
        );

        const customerSelect = await screen.findByRole("combobox", {
            name: /Client/,
        });
        expect(customersApi.getCustomers).toHaveBeenCalledTimes(1);
        expect(customerSelect).toBeEnabled();

        fireEvent.change(customerSelect, {
            target: { value: "customer-2" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({ customerId: "customer-2" })
            );
        });
    });

    it("conserve la création d’une facture générique", async () => {
        render(
            <InvoiceForm
                submitLabel="Créer la facture"
                submittingLabel="Création..."
                onSubmit={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        expect(
            await screen.findByRole("combobox", { name: /Client/ })
        ).toBeEnabled();
        expect(
            screen.queryByText(
                "Le client est lié au dossier atelier et ne peut pas être modifié."
            )
        ).not.toBeInTheDocument();
        expect(screen.getByText("Ligne 1")).toBeInTheDocument();
    });
});
