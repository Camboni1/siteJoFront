"use client";

import {
    type FormEvent,
    type ReactNode,
    useId,
    useState,
} from "react";
import { CustomerVehicleStatusBadge } from "@/features/customer-vehicles/components/customer-vehicle-status-badge";
import {
    customerVehicleErrorMessage,
    FUEL_TYPE_LABELS,
    FUEL_TYPES,
} from "@/features/customer-vehicles/lib/customer-vehicle";
import type {
    CreateCustomerVehicleRequest,
    CustomerVehicle,
    FuelType,
    UpdateCustomerVehicleRequest,
} from "@/features/customer-vehicles/types/customer-vehicle.types";

type FormValues = {
    brand: string;
    model: string;
    licensePlate: string;
    vin: string;
    firstRegistrationDate: string;
    fuelType: FuelType | "";
    currentMileage: string;
    notes: string;
};

type FieldName = keyof FormValues;
type FieldErrors = Partial<Record<FieldName, string>>;

type CustomerVehicleFormProps =
    | {
          mode: "create";
          onSubmit: (request: CreateCustomerVehicleRequest) => Promise<void>;
          onCancel: () => void;
      }
    | {
          mode: "edit";
          initialVehicle: CustomerVehicle;
          onSubmit: (request: UpdateCustomerVehicleRequest) => Promise<void>;
          onDeactivate: () => Promise<void>;
          onCancel: () => void;
      };

function initialValues(vehicle?: CustomerVehicle): FormValues {
    return {
        brand: vehicle?.brand ?? "",
        model: vehicle?.model ?? "",
        licensePlate: vehicle?.licensePlate ?? "",
        vin: vehicle?.vin ?? "",
        firstRegistrationDate: vehicle?.firstRegistrationDate ?? "",
        fuelType: vehicle?.fuelType ?? "",
        currentMileage:
            vehicle?.currentMileage == null
                ? ""
                : String(vehicle.currentMileage),
        notes: vehicle?.notes ?? "",
    };
}

function validate(values: FormValues): FieldErrors {
    const errors: FieldErrors = {};
    const brand = values.brand.trim();
    const model = values.model.trim();
    const vin = values.vin.trim();
    const mileage = values.currentMileage.trim();

    if (!brand) {
        errors.brand = "La marque est obligatoire";
    } else if (brand.length > 100) {
        errors.brand = "La marque ne peut pas dépasser 100 caractères";
    }

    if (!model) {
        errors.model = "Le modèle est obligatoire";
    } else if (model.length > 100) {
        errors.model = "Le modèle ne peut pas dépasser 100 caractères";
    }

    if (values.licensePlate.trim().length > 30) {
        errors.licensePlate =
            "La plaque ne peut pas dépasser 30 caractères";
    }

    if (vin && vin.length !== 17) {
        errors.vin = "Le VIN doit comporter exactement 17 caractères";
    }

    if (mileage) {
        const parsedMileage = Number(mileage);

        if (!/^\d+$/.test(mileage) || !Number.isSafeInteger(parsedMileage)) {
            errors.currentMileage =
                "Le kilométrage doit être un nombre entier positif ou nul";
        }
    }

    return errors;
}

function optionalText(value: string) {
    const trimmed = value.trim();
    return trimmed || undefined;
}

function toCreateRequest(
    values: FormValues
): CreateCustomerVehicleRequest {
    const mileage = values.currentMileage.trim();

    return {
        brand: values.brand.trim(),
        model: values.model.trim(),
        licensePlate: optionalText(values.licensePlate)?.toUpperCase(),
        vin: optionalText(values.vin)?.toUpperCase(),
        firstRegistrationDate: optionalText(values.firstRegistrationDate),
        fuelType: values.fuelType || undefined,
        currentMileage: mileage ? Number(mileage) : undefined,
        notes: optionalText(values.notes),
    };
}

function Field({
    label,
    inputId,
    required,
    error,
    children,
}: {
    label: string;
    inputId: string;
    required?: boolean;
    error?: string;
    children: ReactNode;
}) {
    const errorId = `${inputId}-error`;

    return (
        <div>
            <label className="field-label" htmlFor={inputId}>
                {label}
                {required && (
                    <span aria-hidden className="text-accent">
                        {" "}
                        *
                    </span>
                )}
            </label>
            {children}
            {error && (
                <p
                    id={errorId}
                    className="mt-1.5 text-xs text-red-300"
                    role="alert"
                >
                    {error}
                </p>
            )}
        </div>
    );
}

const DEACTIVATION_CONFIRMATION =
    "Désactiver ce véhicule ? Le véhicule restera visible dans votre historique, mais ne pourra plus être sélectionné pour un nouveau rendez-vous.";

export function CustomerVehicleForm(props: CustomerVehicleFormProps) {
    const formId = useId();
    const vehicle =
        props.mode === "edit" ? props.initialVehicle : undefined;
    const [values, setValues] = useState<FormValues>(() =>
        initialValues(vehicle)
    );
    const [errors, setErrors] = useState<FieldErrors>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deactivating, setDeactivating] = useState(false);

    const busy = submitting || deactivating;

    function setValue<K extends FieldName>(field: K, value: FormValues[K]) {
        setValues((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: undefined }));
        setApiError(null);
    }

    function inputProps(field: FieldName) {
        const inputId = `${formId}-${field}`;
        const error = errors[field];

        return {
            id: inputId,
            "aria-invalid": error ? true : undefined,
            "aria-describedby": error ? `${inputId}-error` : undefined,
        };
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setApiError(null);

        const validationErrors = validate(values);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors({});
        setSubmitting(true);

        try {
            const request = toCreateRequest(values);

            if (props.mode === "create") {
                await props.onSubmit(request);
            } else {
                await props.onSubmit({
                    ...request,
                    active: props.initialVehicle.active,
                });
            }
        } catch (requestError) {
            setApiError(customerVehicleErrorMessage(requestError));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeactivate() {
        if (
            props.mode !== "edit" ||
            !props.initialVehicle.active ||
            !window.confirm(DEACTIVATION_CONFIRMATION)
        ) {
            return;
        }

        setApiError(null);
        setDeactivating(true);

        try {
            await props.onDeactivate();
        } catch (requestError) {
            setApiError(
                customerVehicleErrorMessage(
                    requestError,
                    "Impossible de désactiver le véhicule pour le moment."
                )
            );
        } finally {
            setDeactivating(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {props.mode === "edit" && (
                <div className="card flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="section-title">Statut</p>
                        <p className="mt-2 text-sm text-muted">
                            {props.initialVehicle.active
                                ? "Ce véhicule peut être sélectionné pour un nouveau rendez-vous."
                                : "Ce véhicule reste visible dans votre historique, mais il ne peut plus être sélectionné."}
                        </p>
                    </div>
                    <CustomerVehicleStatusBadge
                        active={props.initialVehicle.active}
                    />
                </div>
            )}

            <div className="card">
                <p className="section-title">Identification</p>
                <h2 className="mt-2 text-lg font-semibold">Véhicule</h2>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Field
                        label="Marque"
                        inputId={`${formId}-brand`}
                        required
                        error={errors.brand}
                    >
                        <input
                            {...inputProps("brand")}
                            className="input"
                            value={values.brand}
                            onChange={(event) =>
                                setValue("brand", event.target.value)
                            }
                            maxLength={100}
                            placeholder="Peugeot"
                            autoComplete="organization"
                        />
                    </Field>

                    <Field
                        label="Modèle"
                        inputId={`${formId}-model`}
                        required
                        error={errors.model}
                    >
                        <input
                            {...inputProps("model")}
                            className="input"
                            value={values.model}
                            onChange={(event) =>
                                setValue("model", event.target.value)
                            }
                            maxLength={100}
                            placeholder="308"
                            autoComplete="off"
                        />
                    </Field>

                    <Field
                        label="Plaque d’immatriculation"
                        inputId={`${formId}-licensePlate`}
                        error={errors.licensePlate}
                    >
                        <input
                            {...inputProps("licensePlate")}
                            className="input font-mono uppercase"
                            value={values.licensePlate}
                            onChange={(event) =>
                                setValue(
                                    "licensePlate",
                                    event.target.value.toUpperCase()
                                )
                            }
                            maxLength={30}
                            placeholder="1-ABC-234"
                            autoComplete="off"
                        />
                    </Field>

                    <Field
                        label="VIN"
                        inputId={`${formId}-vin`}
                        error={errors.vin}
                    >
                        <input
                            {...inputProps("vin")}
                            className="input font-mono uppercase"
                            value={values.vin}
                            onChange={(event) =>
                                setValue("vin", event.target.value.toUpperCase())
                            }
                            maxLength={17}
                            placeholder="17 caractères"
                            autoComplete="off"
                        />
                    </Field>
                </div>
            </div>

            <div className="card">
                <p className="section-title">Informations</p>
                <h2 className="mt-2 text-lg font-semibold">
                    Caractéristiques et suivi
                </h2>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Field
                        label="Date de première immatriculation"
                        inputId={`${formId}-firstRegistrationDate`}
                        error={errors.firstRegistrationDate}
                    >
                        <input
                            {...inputProps("firstRegistrationDate")}
                            type="date"
                            className="input"
                            value={values.firstRegistrationDate}
                            onChange={(event) =>
                                setValue(
                                    "firstRegistrationDate",
                                    event.target.value
                                )
                            }
                        />
                    </Field>

                    <Field
                        label="Carburant"
                        inputId={`${formId}-fuelType`}
                        error={errors.fuelType}
                    >
                        <select
                            {...inputProps("fuelType")}
                            className="input"
                            value={values.fuelType}
                            onChange={(event) =>
                                setValue(
                                    "fuelType",
                                    event.target.value as FuelType | ""
                                )
                            }
                        >
                            <option value="">Non renseigné</option>
                            {FUEL_TYPES.map((fuelType) => (
                                <option key={fuelType} value={fuelType}>
                                    {FUEL_TYPE_LABELS[fuelType]}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field
                        label="Kilométrage"
                        inputId={`${formId}-currentMileage`}
                        error={errors.currentMileage}
                    >
                        <input
                            {...inputProps("currentMileage")}
                            type="number"
                            min={0}
                            step={1}
                            inputMode="numeric"
                            className="input"
                            value={values.currentMileage}
                            onChange={(event) =>
                                setValue("currentMileage", event.target.value)
                            }
                            placeholder="65000"
                        />
                    </Field>
                </div>

                <div className="mt-4">
                    <Field
                        label="Notes"
                        inputId={`${formId}-notes`}
                        error={errors.notes}
                    >
                        <textarea
                            {...inputProps("notes")}
                            className="input min-h-28 resize-y"
                            value={values.notes}
                            onChange={(event) =>
                                setValue("notes", event.target.value)
                            }
                            placeholder="Informations utiles sur le véhicule..."
                        />
                    </Field>
                </div>
            </div>

            {apiError && (
                <div className="alert-error" role="alert">
                    {apiError}
                </div>
            )}

            {props.mode === "edit" && props.initialVehicle.active && (
                <div className="card border-red-400/20">
                    <p className="section-title">Historique</p>
                    <h2 className="mt-2 text-lg font-semibold">
                        Désactiver le véhicule
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted">
                        Le véhicule restera visible dans votre historique, mais
                        ne pourra plus être sélectionné pour un nouveau
                        rendez-vous.
                    </p>
                    <button
                        type="button"
                        className="btn-danger mt-5"
                        disabled={busy}
                        onClick={() => void handleDeactivate()}
                    >
                        {deactivating
                            ? "Désactivation..."
                            : "Désactiver ce véhicule"}
                    </button>
                </div>
            )}

            <div className="flex flex-wrap justify-end gap-3">
                <button
                    type="button"
                    className="btn-ghost"
                    disabled={busy}
                    onClick={props.onCancel}
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={busy}
                >
                    {submitting
                        ? "Enregistrement..."
                        : props.mode === "create"
                          ? "Ajouter le véhicule"
                          : "Enregistrer les modifications"}
                </button>
            </div>
        </form>
    );
}
