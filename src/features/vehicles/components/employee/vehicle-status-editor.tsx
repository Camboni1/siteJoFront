"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as vehiclesApi from "@/features/vehicles/api/vehicles-api";
import type {
    VehicleResponse,
    VehicleStatus,
} from "@/features/vehicles/types/vehicle.types";
import {
    VEHICLE_STATUSES,
    VEHICLE_STATUS_LABELS,
} from "@/features/vehicles/lib/vehicle-status";
import { VehicleStatusBadge } from "@/features/vehicles/components/vehicle-status-badge";
import { isApiError } from "@/lib/api";

export function VehicleStatusEditor({
    vehicle,
    onUpdated,
}: {
    vehicle: VehicleResponse;
    onUpdated: (vehicle: VehicleResponse) => void;
}) {
    const router = useRouter();
    const [status, setStatus] = useState(vehicle.status);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    async function saveStatus() {
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const updated = await vehiclesApi.updateVehicleStatus(vehicle.id, {
                status,
            });
            onUpdated(updated);
            setSuccess("Le statut du véhicule a été mis à jour.");
        } catch (requestError) {
            if (isApiError(requestError, 401)) {
                router.push("/login");
                return;
            }
            if (isApiError(requestError, 403)) {
                router.push("/dashboard");
                return;
            }

            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Impossible de modifier le statut"
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="card">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="section-title">Cycle de vente</p>
                    <h2 className="mt-2 text-lg font-semibold">Statut</h2>
                    <div className="mt-3">
                        <VehicleStatusBadge status={vehicle.status} />
                    </div>
                </div>
                <div className="flex min-w-64 flex-col gap-2 sm:flex-row">
                    <select
                        className="input py-2.5"
                        value={status}
                        onChange={(event) =>
                            setStatus(event.target.value as VehicleStatus)
                        }
                    >
                        {VEHICLE_STATUSES.map((value) => (
                            <option key={value} value={value}>
                                {VEHICLE_STATUS_LABELS[value]}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        className="btn-primary whitespace-nowrap"
                        disabled={saving || status === vehicle.status}
                        onClick={() => void saveStatus()}
                    >
                        {saving ? "Mise à jour..." : "Changer le statut"}
                    </button>
                </div>
            </div>
            {error && <div className="alert-error mt-4">{error}</div>}
            {success && <div className="alert-success mt-4">{success}</div>}
        </section>
    );
}
