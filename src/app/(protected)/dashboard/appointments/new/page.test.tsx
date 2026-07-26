import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/features/appointments/api/appointments-api");
vi.mock("@/features/garage-services/api/garage-services-api");
vi.mock("@/features/customer-vehicles/api/customer-vehicles-api");
vi.mock("@/features/customer-vehicles/hooks/use-customer-guard");

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

import NewAppointmentPage from "@/app/(protected)/dashboard/appointments/new/page";
import * as appointmentsApi from "@/features/appointments/api/appointments-api";
import * as garageServicesApi from "@/features/garage-services/api/garage-services-api";
import * as customerVehiclesApi from "@/features/customer-vehicles/api/customer-vehicles-api";
import { useCustomerGuard } from "@/features/customer-vehicles/hooks/use-customer-guard";
import type { Appointment } from "@/features/appointments/types/appointment.types";

const startAt = "2026-07-26T09:00:00";
const endAt = "2026-07-26T10:00:00";

const createdAppointment = {
    id: "appointment-1",
    customerVehicleId: null,
} as Appointment;

beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-07-26T08:00:00"));
    pushMock.mockReset();
    vi.mocked(useCustomerGuard).mockReturnValue({
        user: {
            id: "user-1",
            firstName: "Lina",
            lastName: "Client",
            email: "lina@example.be",
            role: "ROLE_CUSTOMER",
        },
        loading: false,
        authorized: true,
    });
    vi.mocked(garageServicesApi.getActiveServices).mockResolvedValue([]);
    vi.mocked(appointmentsApi.getAvailability).mockResolvedValue({
        date: "2026-07-26",
        serviceId: null,
        durationMinutes: 60,
        slots: [{ startAt, endAt, available: true }],
    });
    vi.mocked(appointmentsApi.createAppointment).mockResolvedValue(
        createdAppointment
    );
    vi.mocked(customerVehiclesApi.getMyCustomerVehicles).mockResolvedValue([
        {
            id: "vehicle-active",
            brand: "Peugeot",
            model: "308",
            licensePlate: "1-ABC-234",
            active: true,
        },
        {
            id: "vehicle-inactive",
            brand: "Renault",
            model: "Clio",
            licensePlate: "2-DEF-567",
            active: false,
        },
    ]);
});

afterEach(() => {
    vi.useRealTimers();
});

async function selectAvailableSlot(user: ReturnType<typeof userEvent.setup>) {
    const slot = await screen.findByRole("button", {
        name: /09:00.*10:00/,
    });
    await user.click(slot);
}

describe("NewAppointmentPage avec véhicule client", () => {
    it("envoie l'identifiant enregistré sans valeurs manuelles", async () => {
        const user = userEvent.setup({
            advanceTimers: vi.advanceTimersByTime,
        });
        render(<NewAppointmentPage />);

        await selectAvailableSlot(user);
        await user.type(
            screen.getByLabelText("Téléphone"),
            "+32 470 00 00 00"
        );
        await user.click(
            await screen.findByRole("radio", {
                name: /Utiliser un véhicule enregistré/,
            })
        );
        await user.selectOptions(
            screen.getByLabelText("Véhicule enregistré"),
            "vehicle-active"
        );
        await user.click(
            screen.getByRole("button", {
                name: /Demander ce rendez-vous/,
            })
        );

        await waitFor(() =>
            expect(appointmentsApi.createAppointment).toHaveBeenCalledTimes(1)
        );
        expect(appointmentsApi.createAppointment).toHaveBeenCalledWith(
            expect.objectContaining({
                customerVehicleId: "vehicle-active",
                vehicleBrand: null,
                vehicleModel: null,
                licensePlate: null,
                customerPhone: "+32 470 00 00 00",
                startAt,
                endAt,
            })
        );
        expect(
            screen.queryByRole("option", { name: /Renault Clio/ })
        ).not.toBeInTheDocument();
        expect(pushMock).toHaveBeenCalledWith("/dashboard/appointments");
    });

    it("envoie la saisie manuelle avec customerVehicleId à null", async () => {
        const user = userEvent.setup({
            advanceTimers: vi.advanceTimersByTime,
        });
        render(<NewAppointmentPage />);

        await selectAvailableSlot(user);
        await user.type(
            screen.getByLabelText("Téléphone"),
            "+32 470 00 00 00"
        );
        await user.type(
            screen.getByLabelText("Marque du véhicule"),
            "Citroën"
        );
        await user.type(screen.getByLabelText("Modèle"), "C3");
        await user.type(
            screen.getByLabelText("Plaque d’immatriculation"),
            "1-xyz-987"
        );
        await user.click(
            screen.getByRole("button", {
                name: /Demander ce rendez-vous/,
            })
        );

        await waitFor(() =>
            expect(appointmentsApi.createAppointment).toHaveBeenCalledTimes(1)
        );
        expect(appointmentsApi.createAppointment).toHaveBeenCalledWith(
            expect.objectContaining({
                customerVehicleId: null,
                vehicleBrand: "Citroën",
                vehicleModel: "C3",
                licensePlate: "1-XYZ-987",
            })
        );
    });

    it("continue à fonctionner si le chargement des véhicules échoue", async () => {
        vi.mocked(
            customerVehiclesApi.getMyCustomerVehicles
        ).mockRejectedValue(new Error("private SQL detail"));
        const user = userEvent.setup({
            advanceTimers: vi.advanceTimersByTime,
        });
        render(<NewAppointmentPage />);

        expect(
            await screen.findByText(/temporairement indisponibles/)
        ).toBeInTheDocument();
        expect(
            screen.getByLabelText("Marque du véhicule")
        ).toBeEnabled();

        await selectAvailableSlot(user);
        await user.type(screen.getByLabelText("Téléphone"), "0470000000");
        await user.click(
            screen.getByRole("button", {
                name: /Demander ce rendez-vous/,
            })
        );

        await waitFor(() =>
            expect(appointmentsApi.createAppointment).toHaveBeenCalled()
        );
        expect(screen.queryByText(/private SQL detail/)).not.toBeInTheDocument();
    });

    it("accepte une réponse de rendez-vous dont customerVehicleId vaut null", async () => {
        vi.mocked(appointmentsApi.createAppointment).mockResolvedValue({
            ...createdAppointment,
            customerVehicleId: null,
        });
        vi.mocked(
            customerVehiclesApi.getMyCustomerVehicles
        ).mockResolvedValue([]);
        const user = userEvent.setup({
            advanceTimers: vi.advanceTimersByTime,
        });
        render(<NewAppointmentPage />);

        await screen.findByText(/Aucun véhicule actif n’est disponible/);
        await selectAvailableSlot(user);
        await user.type(screen.getByLabelText("Téléphone"), "0470000000");
        await user.click(
            screen.getByRole("button", {
                name: /Demander ce rendez-vous/,
            })
        );

        await waitFor(() =>
            expect(pushMock).toHaveBeenCalledWith(
                "/dashboard/appointments"
            )
        );
    });
});
