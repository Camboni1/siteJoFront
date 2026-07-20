"use client";

import { FormEvent, ReactNode, useId, useState } from "react";
import type {
    CreateVehicleRequest,
    UpdateVehicleRequest,
    VehicleResponse,
    VehicleStatus,
} from "@/features/vehicles/types/vehicle.types";
import {
    VEHICLE_STATUSES,
    VEHICLE_STATUS_LABELS,
} from "@/features/vehicles/lib/vehicle-status";

const NEXT_YEAR = new Date().getFullYear() + 1;

type FormValues = {
    brand: string;
    model: string;
    version: string;
    year: string;
    mileage: string;
    fuelType: string;
    gearbox: string;
    color: string;
    licensePlate: string;
    vin: string;
    price: string;
    description: string;
    highlighted: boolean;
    status: VehicleStatus;
    firstRegistrationDate: string;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

type VehicleFormProps =
    | {
          mode: "create";
          onSubmit: (request: CreateVehicleRequest) => Promise<void>;
          onCancel: () => void;
      }
    | {
          mode: "edit";
          initialVehicle: VehicleResponse;
          onSubmit: (request: UpdateVehicleRequest) => Promise<void>;
          onCancel: () => void;
      };

function formValues(vehicle?: VehicleResponse): FormValues {
    return {
        brand: vehicle?.brand ?? "",
        model: vehicle?.model ?? "",
        version: vehicle?.version ?? "",
        year: vehicle?.year != null ? String(vehicle.year) : "",
        mileage: vehicle?.mileage != null ? String(vehicle.mileage) : "",
        fuelType: vehicle?.fuelType ?? "",
        gearbox: vehicle?.gearbox ?? "",
        color: vehicle?.color ?? "",
        licensePlate: vehicle?.licensePlate ?? "",
        vin: vehicle?.vin ?? "",
        price: vehicle?.price != null ? String(vehicle.price) : "",
        description: vehicle?.description ?? "",
        highlighted: vehicle?.highlighted ?? false,
        status: vehicle?.status ?? "DRAFT",
        firstRegistrationDate: vehicle?.firstRegistrationDate ?? "",
    };
}

function localDateValue(date: Date) {
    const timezoneOffset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function validate(values: FormValues): FieldErrors {
    const errors: FieldErrors = {};

    if (!values.brand.trim()) {
        errors.brand = "La marque est obligatoire";
    } else if (values.brand.trim().length > 100) {
        errors.brand = "La marque ne peut pas dépasser 100 caractères";
    }

    if (!values.model.trim()) {
        errors.model = "Le modèle est obligatoire";
    } else if (values.model.trim().length > 100) {
        errors.model = "Le modèle ne peut pas dépasser 100 caractères";
    }

    const lengths: Array<[keyof FormValues, number, string]> = [
        ["version", 100, "La version"],
        ["fuelType", 50, "Le carburant"],
        ["gearbox", 50, "La boîte de vitesses"],
        ["color", 50, "La couleur"],
        ["licensePlate", 30, "L'immatriculation"],
        ["vin", 50, "Le VIN"],
    ];

    lengths.forEach(([field, maximum, label]) => {
        const value = values[field];
        if (typeof value === "string" && value.trim().length > maximum) {
            errors[field] = `${label} ne peut pas dépasser ${maximum} caractères`;
        }
    });

    if (values.year) {
        const year = Number(values.year);
        if (!Number.isInteger(year) || year < 1886 || year > NEXT_YEAR) {
            errors.year = `L'année doit être comprise entre 1886 et ${NEXT_YEAR}`;
        }
    }

    if (values.mileage) {
        const mileage = Number(values.mileage);
        if (!Number.isInteger(mileage) || mileage < 0) {
            errors.mileage =
                "Le kilométrage doit être un nombre entier positif ou nul";
        }
    }

    if (values.price) {
        const price = Number(values.price.replace(",", "."));
        if (!Number.isFinite(price) || price < 0) {
            errors.price = "Le prix doit être positif ou nul";
        }
    }

    if (
        values.firstRegistrationDate &&
        values.firstRegistrationDate > localDateValue(new Date())
    ) {
        errors.firstRegistrationDate =
            "La date de première immatriculation ne peut pas être future";
    }

    return errors;
}

function nullableText(value: string) {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

function nullableNumber(value: string) {
    return value.trim() ? Number(value.replace(",", ".")) : null;
}

function updateRequest(values: FormValues): UpdateVehicleRequest {
    return {
        brand: values.brand.trim(),
        model: values.model.trim(),
        version: nullableText(values.version),
        year: nullableNumber(values.year),
        mileage: nullableNumber(values.mileage),
        fuelType: nullableText(values.fuelType),
        gearbox: nullableText(values.gearbox),
        color: nullableText(values.color),
        licensePlate: nullableText(values.licensePlate),
        vin: nullableText(values.vin),
        price: nullableNumber(values.price),
        description: nullableText(values.description),
        highlighted: values.highlighted,
        firstRegistrationDate: nullableText(values.firstRegistrationDate),
    };
}

function Field({
    label,
    required,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    children: ReactNode;
}) {
    return (
        <label className="block">
            <span className="field-label">
                {label}
                {required && <span className="text-accent"> *</span>}
            </span>
            {children}
            {error && <span className="mt-1.5 block text-xs text-red-300">{error}</span>}
        </label>
    );
}

export function VehicleForm(props: VehicleFormProps) {
    const formId = useId();
    const initialVehicle = props.mode === "edit" ? props.initialVehicle : undefined;
    const [values, setValues] = useState<FormValues>(() =>
        formValues(initialVehicle)
    );
    const [errors, setErrors] = useState<FieldErrors>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    function setValue<K extends keyof FormValues>(key: K, value: FormValues[K]) {
        setValues((current) => ({ ...current, [key]: value }));
        setErrors((current) => ({ ...current, [key]: undefined }));
        setSuccess(null);
    }

    function textInput(
        key: keyof FormValues,
        options: {
            type?: string;
            maxLength?: number;
            min?: number;
            max?: number | string;
            step?: number | string;
            placeholder?: string;
        } = {}
    ) {
        return (
            <input
                id={`${formId}-${key}`}
                className="input"
                value={String(values[key])}
                onChange={(event) => setValue(key, event.target.value as never)}
                aria-invalid={errors[key] ? true : undefined}
                {...options}
            />
        );
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setApiError(null);
        setSuccess(null);

        const validationErrors = validate(values);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSubmitting(true);
        try {
            const request = updateRequest(values);
            if (props.mode === "create") {
                await props.onSubmit({ ...request, status: values.status });
            } else {
                await props.onSubmit(request);
            }
            setSuccess("Le véhicule a été enregistré.");
        } catch (requestError) {
            setApiError(
                requestError instanceof Error
                    ? requestError.message
                    : "Impossible d'enregistrer le véhicule"
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="card">
                <p className="section-title">Identification</p>
                <h2 className="mt-2 text-lg font-semibold">Véhicule</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Field label="Marque" required error={errors.brand}>
                        {textInput("brand", { maxLength: 100, placeholder: "Toyota" })}
                    </Field>
                    <Field label="Modèle" required error={errors.model}>
                        {textInput("model", { maxLength: 100, placeholder: "Corolla" })}
                    </Field>
                    <Field label="Version" error={errors.version}>
                        {textInput("version", {
                            maxLength: 100,
                            placeholder: "1.8 Hybrid Dynamic",
                        })}
                    </Field>
                    <Field label="Année" error={errors.year}>
                        {textInput("year", {
                            type: "number",
                            min: 1886,
                            max: NEXT_YEAR,
                            step: 1,
                            placeholder: "2024",
                        })}
                    </Field>
                </div>
            </div>

            <div className="card">
                <p className="section-title">Caractéristiques</p>
                <h2 className="mt-2 text-lg font-semibold">Configuration</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Field label="Kilométrage" error={errors.mileage}>
                        {textInput("mileage", {
                            type: "number",
                            min: 0,
                            step: 1,
                            placeholder: "25000",
                        })}
                    </Field>
                    <Field label="Carburant" error={errors.fuelType}>
                        {textInput("fuelType", {
                            maxLength: 50,
                            placeholder: "Essence",
                        })}
                    </Field>
                    <Field label="Boîte de vitesses" error={errors.gearbox}>
                        {textInput("gearbox", {
                            maxLength: 50,
                            placeholder: "Automatique",
                        })}
                    </Field>
                    <Field label="Couleur" error={errors.color}>
                        {textInput("color", {
                            maxLength: 50,
                            placeholder: "Bleu nuit",
                        })}
                    </Field>
                </div>
            </div>

            <div className="card">
                <p className="section-title">Données internes</p>
                <h2 className="mt-2 text-lg font-semibold">Identification administrative</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Field label="Immatriculation" error={errors.licensePlate}>
                        {textInput("licensePlate", {
                            maxLength: 30,
                            placeholder: "2-ABC-123",
                        })}
                    </Field>
                    <Field label="VIN" error={errors.vin}>
                        {textInput("vin", {
                            maxLength: 50,
                            placeholder: "Numéro de châssis",
                        })}
                    </Field>
                    <Field
                        label="Première immatriculation"
                        error={errors.firstRegistrationDate}
                    >
                        {textInput("firstRegistrationDate", {
                            type: "date",
                            max: localDateValue(new Date()),
                        })}
                    </Field>
                    <Field label="Prix (€)" error={errors.price}>
                        {textInput("price", {
                            type: "number",
                            min: 0,
                            step: "0.01",
                            placeholder: "24990.00",
                        })}
                    </Field>
                </div>
            </div>

            <div className="card">
                <p className="section-title">Publication</p>
                <h2 className="mt-2 text-lg font-semibold">Présentation</h2>
                <div className="mt-5 space-y-4">
                    <Field label="Description">
                        <textarea
                            id={`${formId}-description`}
                            className="input min-h-32"
                            rows={5}
                            value={values.description}
                            onChange={(event) =>
                                setValue("description", event.target.value)
                            }
                            placeholder="Équipements, état et informations utiles..."
                        />
                    </Field>

                    <label className="surface-muted flex cursor-pointer items-center justify-between gap-4">
                        <span>
                            <span className="block text-sm font-medium">
                                Mettre le véhicule en avant
                            </span>
                            <span className="mt-1 block text-xs text-muted">
                                Les véhicules mis en avant apparaissent en premier dans le catalogue.
                            </span>
                        </span>
                        <input
                            type="checkbox"
                            className="h-5 w-5 accent-[#e8a04b]"
                            checked={values.highlighted}
                            onChange={(event) =>
                                setValue("highlighted", event.target.checked)
                            }
                        />
                    </label>

                    {props.mode === "create" && (
                        <Field label="Statut à la création">
                            <select
                                className="input"
                                value={values.status}
                                onChange={(event) =>
                                    setValue(
                                        "status",
                                        event.target.value as VehicleStatus
                                    )
                                }
                            >
                                {VEHICLE_STATUSES.map((status) => (
                                    <option key={status} value={status}>
                                        {VEHICLE_STATUS_LABELS[status]}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    )}
                </div>
            </div>

            {apiError && (
                <div className="alert-error" role="alert">
                    {apiError}
                </div>
            )}
            {success && (
                <div className="alert-success" role="status">
                    {success}
                </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" className="btn-ghost" onClick={props.onCancel}>
                    Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting
                        ? "Enregistrement..."
                        : props.mode === "create"
                          ? "Créer le véhicule"
                          : "Enregistrer les modifications"}
                </button>
            </div>
        </form>
    );
}
