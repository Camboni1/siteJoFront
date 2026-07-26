import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api";

vi.mock("@/features/work-orders/api/work-orders-api");

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushMock }),
}));

import type { Appointment } from "@/features/appointments/types/appointment.types";
import * as workOrdersApi from "@/features/work-orders/api/work-orders-api";
import { CreateWorkOrderFromAppointment } from "@/features/work-orders/components/create-work-order-from-appointment";
import type { WorkOrder } from "@/features/work-orders/types/work-order.types";

const appointment: Appointment = {
    id: "appointment-1",
    customerId: "customer-1",
    serviceId: "service-1",
    serviceName: "Entretien",
    customerVehicleId: "vehicle-1",
    customerFirstName: "Marie",
    customerLastName: "Dupont",
    customerEmail: "marie@example.be",
    customerPhone: "+3212345678",
    vehicleBrand: "Peugeot",
    vehicleModel: "308",
    licensePlate: "1-ABC-234",
    startAt: "2026-07-27T08:00:00Z",
    endAt: "2026-07-27T09:00:00Z",
    status: "CONFIRMED",
    message: null,
    googleCalendarEventId: null,
    whatsappMessageId: null,
    createdAt: "2026-07-20T08:00:00Z",
    updatedAt: "2026-07-20T08:00:00Z",
};

const createdOrder: WorkOrder = {
    id: "order-1",
    appointmentId: appointment.id,
    customerId: "customer-1",
    customerVehicleId: "vehicle-1",
    assignedEmployeeId: null,
    status: "PLANNED",
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

async function openForm(user: ReturnType<typeof userEvent.setup>) {
    await user.click(
        screen.getByRole("button", { name: "Ouvrir un dossier atelier" })
    );
}

beforeEach(() => {
    pushMock.mockReset();
    vi.mocked(
        workOrdersApi.createWorkOrderFromAppointment
    ).mockReset();
});

describe("CreateWorkOrderFromAppointment", () => {
    it("affiche l’action lorsqu’un véhicule client est associé", () => {
        render(
            <CreateWorkOrderFromAppointment appointment={appointment} />
        );

        expect(
            screen.getByRole("button", {
                name: "Ouvrir un dossier atelier",
            })
        ).toBeInTheDocument();
    });

    it("n’affiche aucune action et n’appelle aucune API sans véhicule client", () => {
        render(
            <CreateWorkOrderFromAppointment
                appointment={{ ...appointment, customerVehicleId: null }}
            />
        );

        expect(
            screen.queryByRole("button", {
                name: "Ouvrir un dossier atelier",
            })
        ).not.toBeInTheDocument();
        expect(
            screen.getByText(/saisie de véhicule libre/i)
        ).toBeInTheDocument();
        expect(
            workOrdersApi.createWorkOrderFromAppointment
        ).not.toHaveBeenCalled();
    });

    it("envoie null pour une TVA et des champs facultatifs vides", async () => {
        const user = userEvent.setup();
        vi.mocked(
            workOrdersApi.createWorkOrderFromAppointment
        ).mockResolvedValue(createdOrder);
        render(
            <CreateWorkOrderFromAppointment appointment={appointment} />
        );
        await openForm(user);

        await user.click(
            screen.getByRole("button", { name: "Créer le dossier" })
        );

        await waitFor(() =>
            expect(
                workOrdersApi.createWorkOrderFromAppointment
            ).toHaveBeenCalledWith("appointment-1", {
                assignedEmployeeId: null,
                mileageAtReception: null,
                internalNotes: null,
                initialServiceLineVatRate: null,
            })
        );
        expect(pushMock).toHaveBeenCalledWith(
            "/employee/work-orders/order-1"
        );
    });

    it("envoie le kilométrage, les notes et la TVA renseignés", async () => {
        const user = userEvent.setup();
        vi.mocked(
            workOrdersApi.createWorkOrderFromAppointment
        ).mockResolvedValue(createdOrder);
        render(
            <CreateWorkOrderFromAppointment appointment={appointment} />
        );
        await openForm(user);

        await user.type(
            screen.getByLabelText(
                "Kilométrage à la réception (facultatif)"
            ),
            "52000"
        );
        await user.type(
            screen.getByLabelText("Notes internes (facultatives)"),
            "Prévenir avant travaux"
        );
        await user.type(
            screen.getByLabelText(
                "TVA de la ligne initiale (facultative)"
            ),
            "6.5"
        );
        await user.click(
            screen.getByRole("button", { name: "Créer le dossier" })
        );

        await waitFor(() =>
            expect(
                workOrdersApi.createWorkOrderFromAppointment
            ).toHaveBeenCalledWith("appointment-1", {
                assignedEmployeeId: null,
                mileageAtReception: 52000,
                internalNotes: "Prévenir avant travaux",
                initialServiceLineVatRate: 6.5,
            })
        );
    });

    it("refuse une TVA hors limites ou trop précise", async () => {
        const user = userEvent.setup();
        render(
            <CreateWorkOrderFromAppointment appointment={appointment} />
        );
        await openForm(user);
        await user.type(
            screen.getByLabelText(
                "TVA de la ligne initiale (facultative)"
            ),
            "21.123"
        );

        await user.click(
            screen.getByRole("button", { name: "Créer le dossier" })
        );

        expect(screen.getByRole("alert")).toHaveTextContent(
            "Le taux de TVA doit être compris entre 0 et 100"
        );
        expect(
            workOrdersApi.createWorkOrderFromAppointment
        ).not.toHaveBeenCalled();
    });

    it("affiche le doublon et un lien vers la liste sans inventer d’identifiant", async () => {
        const user = userEvent.setup();
        vi.mocked(
            workOrdersApi.createWorkOrderFromAppointment
        ).mockRejectedValue(
            new ApiError(
                "Un ordre de réparation existe déjà pour ce rendez-vous",
                409
            )
        );
        render(
            <CreateWorkOrderFromAppointment appointment={appointment} />
        );
        await openForm(user);

        await user.click(
            screen.getByRole("button", { name: "Créer le dossier" })
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Un ordre de réparation existe déjà pour ce rendez-vous"
        );
        expect(
            screen.getByRole("link", {
                name: "Consulter les ordres de réparation",
            })
        ).toHaveAttribute("href", "/employee/work-orders");
        expect(pushMock).not.toHaveBeenCalled();
    });

    it("assainit une erreur technique", async () => {
        const user = userEvent.setup();
        vi.mocked(
            workOrdersApi.createWorkOrderFromAppointment
        ).mockRejectedValue(
            new Error("SQL work_orders constraint internal")
        );
        render(
            <CreateWorkOrderFromAppointment appointment={appointment} />
        );
        await openForm(user);

        await user.click(
            screen.getByRole("button", { name: "Créer le dossier" })
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Impossible de créer le dossier atelier."
        );
        expect(screen.queryByText(/SQL|constraint/)).not.toBeInTheDocument();
    });
});
