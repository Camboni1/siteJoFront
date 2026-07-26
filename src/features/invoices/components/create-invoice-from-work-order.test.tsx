import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { localIsoDate } from "@/lib/date";
import * as invoicesApi from "@/features/invoices/api/invoices-api";
import { CreateInvoiceFromWorkOrder } from "@/features/invoices/components/create-invoice-from-work-order";
import { invoiceFixture } from "@/features/invoices/testing/invoice-fixture";
import type {
    WorkOrder,
    WorkOrderStatus,
} from "@/features/work-orders/types/work-order.types";

vi.mock("@/features/invoices/api/invoices-api");

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushMock }),
}));

function orderFixture(
    status: WorkOrderStatus = "READY",
    hasLines = true
): WorkOrder {
    return {
        id: "order-1",
        appointmentId: "appointment-1",
        customerId: "customer-1",
        customerVehicleId: "vehicle-1",
        assignedEmployeeId: "employee-1",
        status,
        mileageAtReception: 45000,
        customerComplaint: "Bruit au freinage",
        diagnostic: "Plaquettes usées",
        workPerformed: "Remplacement",
        internalNotes: null,
        openedAt: "2026-07-26T08:00:00Z",
        startedAt: "2026-07-26T09:00:00Z",
        completedAt: null,
        deliveredAt: null,
        lines: hasLines
            ? [
                  {
                      id: "line-1",
                      garageServiceId: null,
                      description: "Freinage",
                      quantity: 1,
                      unitPrice: 100,
                      vatRate: 21,
                      displayOrder: 0,
                      amountExcludingVat: 100,
                      vatAmount: 21,
                      amountIncludingVat: 121,
                  },
              ]
            : [],
        amountExcludingVat: hasLines ? 100 : 0,
        vatAmount: hasLines ? 21 : 0,
        amountIncludingVat: hasLines ? 121 : 0,
        createdAt: "2026-07-26T08:00:00Z",
        updatedAt: "2026-07-26T09:00:00Z",
    };
}

function openForm(order = orderFixture()) {
    render(<CreateInvoiceFromWorkOrder order={order} />);
    fireEvent.click(
        screen.getByRole("button", {
            name: "Créer le brouillon de facture",
        })
    );
}

beforeEach(() => {
    pushMock.mockReset();
    vi.mocked(invoicesApi.createInvoiceDraftFromWorkOrder).mockReset();
});

describe("CreateInvoiceFromWorkOrder", () => {
    it.each(["READY", "DELIVERED"] satisfies WorkOrderStatus[])(
        "affiche l’action pour le statut %s",
        (status) => {
            render(<CreateInvoiceFromWorkOrder order={orderFixture(status)} />);

            expect(
                screen.getByRole("button", {
                    name: "Créer le brouillon de facture",
                })
            ).toBeInTheDocument();
        }
    );

    it.each([
        "DRAFT",
        "PLANNED",
        "IN_PROGRESS",
        "WAITING_FOR_PARTS",
        "CANCELLED",
    ] satisfies WorkOrderStatus[])("masque l’action pour le statut %s", (status) => {
        render(<CreateInvoiceFromWorkOrder order={orderFixture(status)} />);

        expect(
            screen.queryByRole("button", {
                name: "Créer le brouillon de facture",
            })
        ).not.toBeInTheDocument();
    });

    it("bloque localement un ordre sans prestation", () => {
        render(
            <CreateInvoiceFromWorkOrder order={orderFixture("READY", false)} />
        );

        expect(
            screen.getByText(
                "Ajoutez au moins une prestation avant de créer la facture."
            )
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("button", {
                name: "Créer le brouillon de facture",
            })
        ).not.toBeInTheDocument();
        expect(
            invoicesApi.createInvoiceDraftFromWorkOrder
        ).not.toHaveBeenCalled();
    });

    it("initialise uniquement les dates locales, la devise et les notes", () => {
        openForm();

        const today = localIsoDate();
        expect(screen.getByLabelText("Date d'émission")).toHaveValue(today);
        expect(screen.getByLabelText("Date d'échéance")).toHaveValue(today);
        expect(screen.getByLabelText("Devise")).toHaveValue("EUR");
        expect(screen.getByLabelText("Notes")).toHaveValue("");
        expect(screen.queryByLabelText("Client")).not.toBeInTheDocument();
        expect(screen.queryByLabelText("Quantité")).not.toBeInTheDocument();
        expect(
            screen.getByText(
                /Le client, les prestations et les montants seront repris automatiquement/
            )
        ).toBeInTheDocument();
    });

    it("valide les dates, la devise et la longueur des notes", () => {
        openForm();
        const submit = screen.getByRole("button", {
            name: "Créer le brouillon de facture",
        });
        const invoiceDate = screen.getByLabelText("Date d'émission");
        const dueDate = screen.getByLabelText("Date d'échéance");
        const currency = screen.getByLabelText("Devise");
        const notes = screen.getByLabelText("Notes");

        fireEvent.change(invoiceDate, { target: { value: "" } });
        fireEvent.click(submit);
        expect(
            screen.getByText("La date d'émission est obligatoire")
        ).toBeInTheDocument();

        fireEvent.change(invoiceDate, { target: { value: "2026-07-27" } });
        fireEvent.change(dueDate, { target: { value: "2026-07-26" } });
        fireEvent.click(submit);
        expect(
            screen.getByText(
                "La date d'échéance ne peut pas précéder la date d'émission"
            )
        ).toBeInTheDocument();

        fireEvent.change(dueDate, { target: { value: "2026-07-27" } });
        fireEvent.change(currency, { target: { value: "EU" } });
        fireEvent.click(submit);
        expect(
            screen.getByText(
                "La devise doit être un code ISO de trois lettres majuscules"
            )
        ).toBeInTheDocument();

        fireEvent.change(currency, { target: { value: "EUR" } });
        fireEvent.change(notes, { target: { value: "x".repeat(5001) } });
        fireEvent.click(submit);
        expect(
            screen.getByText(
                "Les notes ne peuvent pas dépasser 5000 caractères"
            )
        ).toBeInTheDocument();
        expect(
            invoicesApi.createInvoiceDraftFromWorkOrder
        ).not.toHaveBeenCalled();
    });

    it("envoie le payload exact et ouvre automatiquement la facture créée", async () => {
        vi.mocked(
            invoicesApi.createInvoiceDraftFromWorkOrder
        ).mockResolvedValue(
            invoiceFixture({
                id: "invoice-created",
                workOrderId: "order-1",
            })
        );
        openForm();

        fireEvent.click(
            screen.getByRole("button", {
                name: "Créer le brouillon de facture",
            })
        );

        await waitFor(() => {
            expect(
                invoicesApi.createInvoiceDraftFromWorkOrder
            ).toHaveBeenCalledWith("order-1", {
                invoiceDate: localIsoDate(),
                dueDate: localIsoDate(),
                currency: "EUR",
                notes: null,
            });
        });
        expect(pushMock).toHaveBeenCalledWith(
            "/employee/invoices/invoice-created"
        );
    });

    it("empêche une double soumission et désactive le formulaire", async () => {
        let resolveRequest:
            | ((value: ReturnType<typeof invoiceFixture>) => void)
            | undefined;
        vi.mocked(
            invoicesApi.createInvoiceDraftFromWorkOrder
        ).mockReturnValue(
            new Promise((resolve) => {
                resolveRequest = resolve;
            })
        );
        openForm();
        const submit = screen.getByRole("button", {
            name: "Créer le brouillon de facture",
        });

        fireEvent.click(submit);
        fireEvent.click(submit);

        expect(
            invoicesApi.createInvoiceDraftFromWorkOrder
        ).toHaveBeenCalledTimes(1);
        expect(screen.getByRole("button", { name: "Création..." })).toBeDisabled();
        expect(screen.getByLabelText("Date d'émission")).toBeDisabled();
        expect(screen.getByLabelText("Date d'échéance")).toBeDisabled();
        expect(screen.getByLabelText("Devise")).toBeDisabled();
        expect(screen.getByLabelText("Notes")).toBeDisabled();
        expect(screen.getByRole("status")).toHaveTextContent(
            "Création du brouillon en cours."
        );

        await act(async () => {
            resolveRequest?.(
                invoiceFixture({
                    id: "invoice-created",
                    workOrderId: "order-1",
                })
            );
        });
        expect(pushMock).toHaveBeenCalledWith(
            "/employee/invoices/invoice-created"
        );
    });

    it.each([
        "L'ordre de réparation doit être prêt ou livré avant sa facturation",
        "L'ordre de réparation doit contenir au moins une ligne avant sa facturation",
    ])("affiche l’erreur métier sûre « %s »", async (message) => {
        vi.mocked(
            invoicesApi.createInvoiceDraftFromWorkOrder
        ).mockRejectedValue(new ApiError(message, 409));
        openForm();

        fireEvent.click(
            screen.getByRole("button", {
                name: "Créer le brouillon de facture",
            })
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(message);
    });

    it("affiche le doublon sans inventer l’identifiant de facture", async () => {
        vi.mocked(
            invoicesApi.createInvoiceDraftFromWorkOrder
        ).mockRejectedValue(
            new ApiError(
                "Une facture existe déjà pour cet ordre de réparation",
                409
            )
        );
        openForm();

        fireEvent.click(
            screen.getByRole("button", {
                name: "Créer le brouillon de facture",
            })
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Une facture existe déjà pour cet ordre de réparation."
        );
        expect(
            screen.getByRole("link", { name: "Consulter les factures" })
        ).toHaveAttribute("href", "/employee/invoices");
    });

    it("assainit une erreur technique sans rendre la chaîne SQL", async () => {
        vi.mocked(
            invoicesApi.createInvoiceDraftFromWorkOrder
        ).mockRejectedValue(
            new Error("SQL table invoices constraint uq_invoices_work_order")
        );
        openForm();

        fireEvent.click(
            screen.getByRole("button", {
                name: "Créer le brouillon de facture",
            })
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Impossible de créer le brouillon de facture."
        );
        expect(screen.queryByText(/SQL|constraint/)).not.toBeInTheDocument();
    });

    it.each([
        [401, "/login"],
        [403, "/dashboard"],
    ])("redirige une réponse %s vers %s", async (status, destination) => {
        vi.mocked(
            invoicesApi.createInvoiceDraftFromWorkOrder
        ).mockRejectedValue(new ApiError("Refus", status));
        openForm();

        fireEvent.click(
            screen.getByRole("button", {
                name: "Créer le brouillon de facture",
            })
        );

        await waitFor(() => {
            expect(pushMock).toHaveBeenCalledWith(destination);
        });
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
});
