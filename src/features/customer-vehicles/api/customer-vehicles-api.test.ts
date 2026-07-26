import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import {
    createMyCustomerVehicle,
    deactivateMyCustomerVehicle,
    getMyCustomerVehicle,
    getMyCustomerVehicles,
    updateMyCustomerVehicle,
} from "@/features/customer-vehicles/api/customer-vehicles-api";
import {
    CUSTOMER_VEHICLE_SAVE_ERROR,
    customerVehicleErrorMessage,
} from "@/features/customer-vehicles/lib/customer-vehicle";
import type {
    CreateCustomerVehicleRequest,
    CustomerVehicle,
    CustomerVehicleSummary,
    UpdateCustomerVehicleRequest,
} from "@/features/customer-vehicles/types/customer-vehicle.types";

const fetchMock = vi.fn();

const summary: CustomerVehicleSummary = {
    id: "vehicle-1",
    brand: "Peugeot",
    model: "308",
    licensePlate: "1-ABC-234",
    active: true,
};

const vehicle: CustomerVehicle = {
    ...summary,
    customerId: "customer-1",
    normalizedLicensePlate: "1ABC234",
    vin: "VF3LPHNS0KS123456",
    firstRegistrationDate: "2020-03-14",
    fuelType: "PETROL",
    currentMileage: 56000,
    notes: null,
    createdAt: "2026-07-20T10:00:00",
    updatedAt: "2026-07-20T10:00:00",
};

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe("customer-vehicles-api", () => {
    it("liste les véhicules du compte avec les credentials", async () => {
        fetchMock.mockResolvedValue(jsonResponse([summary]));

        await expect(getMyCustomerVehicles()).resolves.toEqual([summary]);
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringMatching(/\/api\/v1\/customer-vehicles$/),
            expect.objectContaining({
                method: "GET",
                credentials: "include",
            })
        );
    });

    it("crée un véhicule", async () => {
        const request: CreateCustomerVehicleRequest = {
            brand: "Peugeot",
            model: "308",
        };
        fetchMock.mockResolvedValue(jsonResponse(vehicle, 201));

        await expect(createMyCustomerVehicle(request)).resolves.toEqual(
            vehicle
        );
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringMatching(/\/api\/v1\/customer-vehicles$/),
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify(request),
                credentials: "include",
            })
        );
    });

    it("charge le détail d'un véhicule", async () => {
        fetchMock.mockResolvedValue(jsonResponse(vehicle));

        await expect(getMyCustomerVehicle("vehicle-1")).resolves.toEqual(
            vehicle
        );
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringMatching(
                /\/api\/v1\/customer-vehicles\/vehicle-1$/
            ),
            expect.objectContaining({ method: "GET" })
        );
    });

    it("modifie un véhicule", async () => {
        const request: UpdateCustomerVehicleRequest = {
            brand: "Peugeot",
            model: "308 SW",
            active: true,
        };
        fetchMock.mockResolvedValue(
            jsonResponse({ ...vehicle, model: "308 SW" })
        );

        await updateMyCustomerVehicle("vehicle-1", request);

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringMatching(
                /\/api\/v1\/customer-vehicles\/vehicle-1$/
            ),
            expect.objectContaining({
                method: "PUT",
                body: JSON.stringify(request),
            })
        );
    });

    it("traite une désactivation 204 sans lire de JSON", async () => {
        fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

        await expect(
            deactivateMyCustomerVehicle("vehicle-1")
        ).resolves.toBeUndefined();
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringMatching(
                /\/api\/v1\/customer-vehicles\/vehicle-1$/
            ),
            expect.objectContaining({
                method: "DELETE",
                credentials: "include",
            })
        );
    });

    it("conserve un conflit métier reconnu et assaini", async () => {
        fetchMock.mockResolvedValue(
            jsonResponse(
                { message: "Un véhicule avec ce VIN existe déjà" },
                409
            )
        );

        const error = await createMyCustomerVehicle({
            brand: "Peugeot",
            model: "308",
        }).catch((requestError) => requestError);

        expect(error).toBeInstanceOf(ApiError);
        expect(customerVehicleErrorMessage(error)).toBe(
            "Un véhicule avec ce VIN existe déjà"
        );
    });

    it("ne révèle pas une erreur technique inconnue", async () => {
        fetchMock.mockResolvedValue(
            jsonResponse(
                {
                    message:
                        'duplicate key on table customer_vehicles constraint "internal_name"',
                },
                500
            )
        );

        const error = await createMyCustomerVehicle({
            brand: "Peugeot",
            model: "308",
        }).catch((requestError) => requestError);

        expect(customerVehicleErrorMessage(error)).toBe(
            CUSTOMER_VEHICLE_SAVE_ERROR
        );
        expect(customerVehicleErrorMessage(error)).not.toMatch(
            /table|constraint|duplicate key/i
        );
    });
});
