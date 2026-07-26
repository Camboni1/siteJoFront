"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import * as customerVehiclesApi from "@/features/customer-vehicles/api/customer-vehicles-api";
import { customerVehicleLabel } from "@/features/customer-vehicles/lib/customer-vehicle";
import type { CustomerVehicleSummary } from "@/features/customer-vehicles/types/customer-vehicle.types";

export type AppointmentVehicleSource = "saved" | "manual";

type AppointmentVehicleFieldsProps = {
    source: AppointmentVehicleSource;
    selectedVehicleId: string;
    vehicleBrand: string;
    vehicleModel: string;
    licensePlate: string;
    onSourceChange: (source: AppointmentVehicleSource) => void;
    onSelectedVehicleChange: (id: string) => void;
    onVehicleBrandChange: (value: string) => void;
    onVehicleModelChange: (value: string) => void;
    onLicensePlateChange: (value: string) => void;
};

export function AppointmentVehicleFields({
    source,
    selectedVehicleId,
    vehicleBrand,
    vehicleModel,
    licensePlate,
    onSourceChange,
    onSelectedVehicleChange,
    onVehicleBrandChange,
    onVehicleModelChange,
    onLicensePlateChange,
}: AppointmentVehicleFieldsProps) {
    const formId = useId();
    const [vehicles, setVehicles] = useState<CustomerVehicleSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        let ignore = false;

        customerVehiclesApi
            .getMyCustomerVehicles()
            .then((result) => {
                if (!ignore) {
                    setVehicles(result.filter((vehicle) => vehicle.active));
                    setLoadError(false);
                }
            })
            .catch(() => {
                if (!ignore) {
                    setVehicles([]);
                    setLoadError(true);
                }
            })
            .finally(() => {
                if (!ignore) {
                    setLoading(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, []);

    const savedVehiclesAvailable = vehicles.length > 0;

    return (
        <div className="mt-5 space-y-4">
            <fieldset>
                <legend className="field-label">Véhicule concerné</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                    <label
                        className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                            source === "saved"
                                ? "border-accent bg-accent/8"
                                : "border-line bg-surface-soft"
                        } ${
                            loading || !savedVehiclesAvailable
                                ? "cursor-not-allowed opacity-55"
                                : "cursor-pointer"
                        }`}
                    >
                        <input
                            type="radio"
                            name={`${formId}-vehicle-source`}
                            value="saved"
                            checked={source === "saved"}
                            disabled={loading || !savedVehiclesAvailable}
                            onChange={() => onSourceChange("saved")}
                            className="mt-0.5 accent-[var(--color-accent)]"
                        />
                        <span>
                            <span className="block text-sm font-medium">
                                Utiliser un véhicule enregistré
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-muted">
                                L’atelier utilisera les informations de votre
                                véhicule.
                            </span>
                        </span>
                    </label>

                    <label
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                            source === "manual"
                                ? "border-accent bg-accent/8"
                                : "border-line bg-surface-soft"
                        }`}
                    >
                        <input
                            type="radio"
                            name={`${formId}-vehicle-source`}
                            value="manual"
                            checked={source === "manual"}
                            onChange={() => {
                                onSourceChange("manual");
                                onSelectedVehicleChange("");
                            }}
                            className="mt-0.5 accent-[var(--color-accent)]"
                        />
                        <span>
                            <span className="block text-sm font-medium">
                                Saisir un autre véhicule
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-muted">
                                Ces informations seront utilisées uniquement
                                pour ce rendez-vous.
                            </span>
                        </span>
                    </label>
                </div>
            </fieldset>

            {loading && (
                <p className="text-xs text-muted" role="status">
                    Chargement de vos véhicules enregistrés...
                </p>
            )}

            {loadError && (
                <p className="text-xs leading-5 text-amber-200" role="status">
                    Vos véhicules enregistrés sont temporairement indisponibles.
                    Vous pouvez continuer avec la saisie manuelle.
                </p>
            )}

            {!loading && !loadError && !savedVehiclesAvailable && (
                <p className="text-xs leading-5 text-muted">
                    Aucun véhicule actif n’est disponible. Vous pouvez utiliser
                    la saisie manuelle ou{" "}
                    <Link
                        href="/dashboard/vehicles/new"
                        className="text-accent hover:underline"
                    >
                        ajouter un véhicule
                    </Link>
                    .
                </p>
            )}

            {source === "saved" && (
                <div>
                    <label
                        className="field-label"
                        htmlFor={`${formId}-saved-vehicle`}
                    >
                        Véhicule enregistré
                    </label>
                    <select
                        id={`${formId}-saved-vehicle`}
                        className="input"
                        value={selectedVehicleId}
                        onChange={(event) =>
                            onSelectedVehicleChange(event.target.value)
                        }
                        required
                    >
                        <option value="">Choisissez un véhicule</option>
                        {vehicles.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>
                                {customerVehicleLabel(vehicle)}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {source === "manual" && (
                <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                className="field-label"
                                htmlFor={`${formId}-vehicle-brand`}
                            >
                                Marque du véhicule
                            </label>
                            <input
                                id={`${formId}-vehicle-brand`}
                                className="input"
                                value={vehicleBrand}
                                onChange={(event) =>
                                    onVehicleBrandChange(event.target.value)
                                }
                                placeholder="Volkswagen"
                                maxLength={100}
                            />
                        </div>

                        <div>
                            <label
                                className="field-label"
                                htmlFor={`${formId}-vehicle-model`}
                            >
                                Modèle
                            </label>
                            <input
                                id={`${formId}-vehicle-model`}
                                className="input"
                                value={vehicleModel}
                                onChange={(event) =>
                                    onVehicleModelChange(event.target.value)
                                }
                                placeholder="Golf"
                                maxLength={100}
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            className="field-label"
                            htmlFor={`${formId}-license-plate`}
                        >
                            Plaque d’immatriculation
                        </label>
                        <input
                            id={`${formId}-license-plate`}
                            className="input font-mono uppercase"
                            value={licensePlate}
                            onChange={(event) =>
                                onLicensePlateChange(
                                    event.target.value.toUpperCase()
                                )
                            }
                            placeholder="1-ABC-123"
                            maxLength={30}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
