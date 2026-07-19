"use client";

import { FormEvent, useId, useState } from "react";
import type {
    GarageService,
    GarageServiceRequest,
} from "@/features/garage-services/types/garage-service.types";
import { formatDuration } from "@/lib/format";

const NAME_MAX_LENGTH = 150;
const DURATION_MIN = 15;
const DURATION_MAX = 480;

const DURATION_OPTIONS = Array.from(
    { length: (DURATION_MAX - DURATION_MIN) / 15 + 1 },
    (_, index) => DURATION_MIN + index * 15
);

type FormValues = {
    name: string;
    description: string;
    startingPrice: string;
    durationMinutes: number;
    active: boolean;
    displayOrder: string;
};

type FieldErrors = Partial<Record<"name" | "startingPrice" | "displayOrder", string>>;

function toFormValues(service?: GarageService): FormValues {
    return {
        name: service?.name ?? "",
        description: service?.description ?? "",
        startingPrice:
            service?.startingPrice != null
                ? String(service.startingPrice)
                : "",
        durationMinutes: service?.durationMinutes ?? 60,
        active: service?.active ?? true,
        displayOrder:
            service?.displayOrder != null ? String(service.displayOrder) : "0",
    };
}

function validate(values: FormValues): FieldErrors {
    const errors: FieldErrors = {};

    if (!values.name.trim()) {
        errors.name = "Le nom du service est obligatoire";
    } else if (values.name.trim().length > NAME_MAX_LENGTH) {
        errors.name = `Le nom ne peut pas dépasser ${NAME_MAX_LENGTH} caractères`;
    }

    if (values.startingPrice.trim()) {
        const price = Number(values.startingPrice.replace(",", "."));

        if (Number.isNaN(price)) {
            errors.startingPrice = "Le prix doit être un nombre";
        } else if (price < 0) {
            errors.startingPrice = "Le prix de départ doit être positif";
        }
    }

    if (values.displayOrder.trim()) {
        const order = Number(values.displayOrder);

        if (!Number.isInteger(order)) {
            errors.displayOrder =
                "L'ordre d'affichage doit être un nombre entier";
        }
    }

    return errors;
}

function toRequest(values: FormValues): GarageServiceRequest {
    const description = values.description.trim();
    const price = values.startingPrice.trim();

    return {
        name: values.name.trim(),
        description: description === "" ? null : description,
        startingPrice: price === "" ? null : Number(price.replace(",", ".")),
        durationMinutes: values.durationMinutes,
        active: values.active,
        displayOrder: values.displayOrder.trim()
            ? Number(values.displayOrder)
            : 0,
    };
}

type GarageServiceFormProps = {
    initialValues?: GarageService;
    submitLabel: string;
    submittingLabel: string;
    onSubmit: (values: GarageServiceRequest) => Promise<void>;
    onCancel: () => void;
};

export function GarageServiceForm({
    initialValues,
    submitLabel,
    submittingLabel,
    onSubmit,
    onCancel,
}: GarageServiceFormProps) {
    const formId = useId();

    const [values, setValues] = useState<FormValues>(() =>
        toFormValues(initialValues)
    );
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setApiError(null);

        const errors = validate(values);

        if (Object.values(errors).some(Boolean)) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
        setSubmitting(true);

        try {
            await onSubmit(toRequest(values));
        } catch (error) {
            setApiError(
                error instanceof Error
                    ? error.message
                    : "Impossible d'enregistrer la prestation"
            );
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="card">
                <p className="section-title">Prestation</p>
                <h2 className="mt-2 text-lg font-semibold">
                    Informations générales
                </h2>

                <div className="mt-4 grid gap-4">
                    <div>
                        <label
                            className="field-label"
                            htmlFor={`${formId}-name`}
                        >
                            Nom
                            <span aria-hidden className="text-accent">
                                {" "}
                                *
                            </span>
                        </label>
                        <input
                            id={`${formId}-name`}
                            type="text"
                            className="input"
                            value={values.name}
                            onChange={(event) => {
                                setValues((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }));
                                setFieldErrors((current) => ({
                                    ...current,
                                    name: undefined,
                                }));
                            }}
                            maxLength={NAME_MAX_LENGTH}
                            placeholder="Entretien complet"
                            aria-required
                            aria-invalid={fieldErrors.name ? true : undefined}
                            aria-describedby={
                                fieldErrors.name
                                    ? `${formId}-name-error`
                                    : undefined
                            }
                        />
                        {fieldErrors.name && (
                            <p
                                id={`${formId}-name-error`}
                                className="mt-1.5 text-xs text-red-300"
                            >
                                {fieldErrors.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            className="field-label"
                            htmlFor={`${formId}-description`}
                        >
                            Description
                        </label>
                        <textarea
                            id={`${formId}-description`}
                            className="input min-h-24"
                            rows={3}
                            value={values.description}
                            onChange={(event) =>
                                setValues((current) => ({
                                    ...current,
                                    description: event.target.value,
                                }))
                            }
                            placeholder="Ce que comprend la prestation, visible par les clients..."
                        />
                    </div>
                </div>
            </div>

            <div className="card">
                <p className="section-title">Tarif & planning</p>
                <h2 className="mt-2 text-lg font-semibold">
                    Prix et durée
                </h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                        <label
                            className="field-label"
                            htmlFor={`${formId}-price`}
                        >
                            Prix de départ (€)
                        </label>
                        <input
                            id={`${formId}-price`}
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step={0.01}
                            className="input"
                            value={values.startingPrice}
                            onChange={(event) => {
                                setValues((current) => ({
                                    ...current,
                                    startingPrice: event.target.value,
                                }));
                                setFieldErrors((current) => ({
                                    ...current,
                                    startingPrice: undefined,
                                }));
                            }}
                            placeholder="Laisser vide si sur devis"
                            aria-invalid={
                                fieldErrors.startingPrice ? true : undefined
                            }
                            aria-describedby={
                                fieldErrors.startingPrice
                                    ? `${formId}-price-error`
                                    : undefined
                            }
                        />
                        {fieldErrors.startingPrice && (
                            <p
                                id={`${formId}-price-error`}
                                className="mt-1.5 text-xs text-red-300"
                            >
                                {fieldErrors.startingPrice}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            className="field-label"
                            htmlFor={`${formId}-duration`}
                        >
                            Durée réservée dans le planning
                        </label>
                        <select
                            id={`${formId}-duration`}
                            className="input"
                            value={values.durationMinutes}
                            onChange={(event) =>
                                setValues((current) => ({
                                    ...current,
                                    durationMinutes: Number(
                                        event.target.value
                                    ),
                                }))
                            }
                        >
                            {DURATION_OPTIONS.map((minutes) => (
                                <option key={minutes} value={minutes}>
                                    {formatDuration(minutes)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="card">
                <p className="section-title">Visibilité</p>
                <h2 className="mt-2 text-lg font-semibold">
                    Publication
                </h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label
                        className="surface-muted flex cursor-pointer items-center justify-between gap-3"
                        htmlFor={`${formId}-active`}
                    >
                        <span>
                            <span className="block text-sm font-medium">
                                Prestation active
                            </span>
                            <span className="mt-1 block text-xs text-muted">
                                Proposée aux clients lors de la prise de
                                rendez-vous.
                            </span>
                        </span>
                        <input
                            id={`${formId}-active`}
                            type="checkbox"
                            className="h-5 w-5 accent-[#e8a04b]"
                            checked={values.active}
                            onChange={(event) =>
                                setValues((current) => ({
                                    ...current,
                                    active: event.target.checked,
                                }))
                            }
                        />
                    </label>

                    <div>
                        <label
                            className="field-label"
                            htmlFor={`${formId}-order`}
                        >
                            Ordre d&apos;affichage
                        </label>
                        <input
                            id={`${formId}-order`}
                            type="number"
                            inputMode="numeric"
                            step={1}
                            className="input"
                            value={values.displayOrder}
                            onChange={(event) => {
                                setValues((current) => ({
                                    ...current,
                                    displayOrder: event.target.value,
                                }));
                                setFieldErrors((current) => ({
                                    ...current,
                                    displayOrder: undefined,
                                }));
                            }}
                            aria-invalid={
                                fieldErrors.displayOrder ? true : undefined
                            }
                            aria-describedby={
                                fieldErrors.displayOrder
                                    ? `${formId}-order-error`
                                    : `${formId}-order-help`
                            }
                        />
                        {fieldErrors.displayOrder ? (
                            <p
                                id={`${formId}-order-error`}
                                className="mt-1.5 text-xs text-red-300"
                            >
                                {fieldErrors.displayOrder}
                            </p>
                        ) : (
                            <p
                                id={`${formId}-order-help`}
                                className="mt-1.5 text-xs text-faint"
                            >
                                Les prestations sont triées par ordre croissant.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {apiError && (
                <div className="alert-error" role="alert">
                    {apiError}
                </div>
            )}

            <div className="flex flex-wrap justify-end gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    className="btn-ghost"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                >
                    {submitting ? submittingLabel : submitLabel}
                </button>
            </div>
        </form>
    );
}
