import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApiError } from "@/lib/api";

vi.mock("@/features/work-orders/api/work-orders-api");
vi.mock("@/features/customers/api/customers-api");
vi.mock("@/features/appointments/api/appointments-api");
vi.mock("@/features/garage-services/api/garage-services-api");
vi.mock("@/features/vehicles/hooks/use-staff-guard");

const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
    useParams: () => ({ id: "order-1" }),
    useRouter: () => ({ replace: replaceMock }),
}));

import * as appointmentsApi from "@/features/appointments/api/appointments-api";
import * as customersApi from "@/features/customers/api/customers-api";
import * as garageServicesApi from "@/features/garage-services/api/garage-services-api";
import { useStaffGuard } from "@/features/vehicles/hooks/use-staff-guard";
import * as workOrdersApi from "@/features/work-orders/api/work-orders-api";
import { WorkOrderDetail } from "@/features/work-orders/components/work-order-detail";
import type { Appointment } from "@/features/appointments/types/appointment.types";
import type { Customer } from "@/features/customers/types/customer.types";
import type { CustomerVehicle } from "@/features/customer-vehicles/types/customer-vehicle.types";
import type { WorkOrder } from "@/features/work-orders/types/work-order.types";

const order: WorkOrder = {
    id: "order-1",
    appointmentId: "appointment-1",
    customerId: "customer-1",
    customerVehicleId: "vehicle-1",
    assignedEmployeeId: "employee-1",
    status: "IN_PROGRESS",
    mileageAtReception: 45000,
    customerComplaint: "Bruit au freinage",
    diagnostic: "Plaquettes usées",
    workPerformed: "Remplacement des plaquettes",
    internalNotes: "Appeler avant essai",
    openedAt: "2026-07-26T08:00:00Z",
    startedAt: "2026-07-26T09:00:00Z",
    completedAt: null,
    deliveredAt: null,
    lines: [
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
    ],
    amountExcludingVat: 100,
    vatAmount: 21,
    amountIncludingVat: 121,
    createdAt: "2026-07-26T08:00:00Z",
    updatedAt: "2026-07-26T09:00:00Z",
};

const customer: Customer = {
    id: "customer-1",
    appUserId: null,
    firstName: "Marie",
    lastName: "Dupont",
    email: "marie@example.be",
    phone: "+3212345678",
    street: null,
    postalCode: null,
    city: null,
    country: null,
    vatNumber: null,
    notes: null,
    createdAt: "2026-07-01T08:00:00Z",
    updatedAt: "2026-07-01T08:00:00Z",
};

const vehicle: CustomerVehicle = {
    id: "vehicle-1",
    customerId: "customer-1",
    brand: "Peugeot",
    model: "308",
    licensePlate: "1-ABC-234",
    normalizedLicensePlate: "1ABC234",
    vin: null,
    firstRegistrationDate: null,
    fuelType: null,
    currentMileage: null,
    notes: null,
    active: true,
    createdAt: "2026-07-01T08:00:00Z",
    updatedAt: "2026-07-01T08:00:00Z",
};

const appointment: Appointment = {
    id: "appointment-1",
    customerId: "customer-1",
    serviceId: "service-1",
    serviceName: "Freinage",
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

beforeEach(() => {
    replaceMock.mockReset();
    vi.mocked(useStaffGuard).mockReturnValue({
        user: {
            id: "staff-1",
            firstName: "Alex",
            lastName: "Atelier",
            email: "staff@example.be",
            role: "ROLE_EMPLOYEE",
        },
        loading: false,
        authorized: true,
    });
    vi.mocked(workOrdersApi.getWorkOrder).mockReset();
    vi.mocked(
        workOrdersApi.getWorkOrderCustomerVehicle
    ).mockReset();
    vi.mocked(customersApi.getCustomer).mockReset();
    vi.mocked(appointmentsApi.getAppointment).mockReset();
    vi.mocked(garageServicesApi.getAllServices).mockResolvedValue([]);
});

function mockSuccessfulLoad(loadedOrder: WorkOrder = order) {
    vi.mocked(workOrdersApi.getWorkOrder).mockResolvedValue(loadedOrder);
    vi.mocked(customersApi.getCustomer).mockResolvedValue(customer);
    vi.mocked(
        workOrdersApi.getWorkOrderCustomerVehicle
    ).mockResolvedValue(vehicle);
    vi.mocked(appointmentsApi.getAppointment).mockResolvedValue(appointment);
}

describe("WorkOrderDetail", () => {
    it("affiche le chargement initial", () => {
        vi.mocked(workOrdersApi.getWorkOrder).mockReturnValue(
            new Promise(() => {})
        );

        render(<WorkOrderDetail />);

        expect(
            screen.getByText("Chargement du dossier atelier...")
        ).toBeInTheDocument();
    });

    it("affiche l’ordre, les informations liées et les totaux", async () => {
        mockSuccessfulLoad();

        render(<WorkOrderDetail />);

        expect(
            await screen.findByText("Peugeot 308 — 1-ABC-234")
        ).toBeInTheDocument();
        expect(screen.getAllByText("Marie Dupont").length).toBeGreaterThan(0);
        expect(
            screen.getAllByText("Bruit au freinage").length
        ).toBeGreaterThan(0);
        expect(
            screen.getAllByText("Plaquettes usées").length
        ).toBeGreaterThan(0);
        expect(screen.getByText("Total hors TVA")).toBeInTheDocument();
        expect(screen.getByText("Total TVA comprise")).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: "Ouvrir le rendez-vous" })
        ).toHaveAttribute(
            "href",
            "/employee/appointments/appointment-1"
        );
    });

    it("intègre la création de facture pour un ordre READY avec lignes", async () => {
        mockSuccessfulLoad({ ...order, status: "READY" });

        render(<WorkOrderDetail />);

        expect(
            await screen.findByRole("button", {
                name: "Créer le brouillon de facture",
            })
        ).toBeInTheDocument();
    });

    it("explique pourquoi un ordre READY sans ligne ne peut pas être facturé", async () => {
        mockSuccessfulLoad({
            ...order,
            status: "READY",
            lines: [],
            amountExcludingVat: 0,
            vatAmount: 0,
            amountIncludingVat: 0,
        });

        render(<WorkOrderDetail />);

        expect(
            await screen.findByText(
                "Ajoutez au moins une prestation avant de créer la facture."
            )
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("button", {
                name: "Créer le brouillon de facture",
            })
        ).not.toBeInTheDocument();
    });

    it("affiche l’ordre avec des libellés de repli si les données liées échouent", async () => {
        vi.mocked(workOrdersApi.getWorkOrder).mockResolvedValue(order);
        vi.mocked(customersApi.getCustomer).mockRejectedValue(
            new Error("customer unavailable")
        );
        vi.mocked(
            workOrdersApi.getWorkOrderCustomerVehicle
        ).mockRejectedValue(new Error("vehicle unavailable"));
        vi.mocked(appointmentsApi.getAppointment).mockRejectedValue(
            new Error("appointment unavailable")
        );

        render(<WorkOrderDetail />);

        expect(
            await screen.findByText("Véhicule vehicle-")
        ).toBeInTheDocument();
        expect(screen.getAllByText("Client customer").length).toBeGreaterThan(0);
        expect(screen.getByText("Freinage")).toBeInTheDocument();
    });

    it("affiche un état introuvable pour une réponse 404", async () => {
        vi.mocked(workOrdersApi.getWorkOrder).mockRejectedValue(
            new ApiError("Ordre de réparation introuvable", 404)
        );

        render(<WorkOrderDetail />);

        expect(
            await screen.findByText(
                "Cet ordre de réparation est introuvable."
            )
        ).toBeInTheDocument();
    });

    it("masque une erreur technique du chargement principal", async () => {
        vi.mocked(workOrdersApi.getWorkOrder).mockRejectedValue(
            new Error("SQL table work_orders secret")
        );

        render(<WorkOrderDetail />);

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Impossible de charger le dossier atelier."
        );
        expect(screen.queryByText(/SQL|secret/)).not.toBeInTheDocument();
    });
});
