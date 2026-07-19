"use client";

import { FormEvent, useId, useState } from "react";
import type {
    Customer,
    CustomerRequest,
} from "@/features/customers/types/customer.types";

type FieldName = keyof CustomerRequest;

type FormValues = Record<FieldName, string>;

type FieldErrors = Partial<Record<FieldName, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_LENGTHS: Partial<Record<FieldName, number>> = {
    firstName: 100,
    lastName: 100,
    email: 180,
    phone: 30,
    street: 255,
    postalCode: 20,
    city: 100,
    country: 100,
    vatNumber: 50,
};

const FIELD_LABELS: Record<FieldName, string> = {
    firstName: "Prénom",
    lastName: "Nom",
    email: "Email",
    phone: "Téléphone",
    street: "Rue et numéro",
    postalCode: "Code postal",
    city: "Ville",
    country: "Pays",
    vatNumber: "Numéro de TVA",
    notes: "Notes internes",
};

function toFormValues(customer?: Customer): FormValues {
    return {
        firstName: customer?.firstName ?? "",
        lastName: customer?.lastName ?? "",
        email: customer?.email ?? "",
        phone: customer?.phone ?? "",
        street: customer?.street ?? "",
        postalCode: customer?.postalCode ?? "",
        city: customer?.city ?? "",
        country: customer?.country ?? "",
        vatNumber: customer?.vatNumber ?? "",
        notes: customer?.notes ?? "",
    };
}

function validate(values: FormValues): FieldErrors {
    const errors: FieldErrors = {};

    if (!values.firstName.trim()) {
        errors.firstName = "Le prénom est obligatoire";
    }

    if (!values.lastName.trim()) {
        errors.lastName = "Le nom est obligatoire";
    }

    if (values.email.trim() && !EMAIL_PATTERN.test(values.email.trim())) {
        errors.email = "L'email doit être valide";
    }

    for (const [field, max] of Object.entries(MAX_LENGTHS) as [
        FieldName,
        number,
    ][]) {
        if (!errors[field] && values[field].trim().length > max) {
            errors[field] =
                `${FIELD_LABELS[field]} ne peut pas dépasser ${max} caractères`;
        }
    }

    return errors;
}

function toRequest(values: FormValues): CustomerRequest {
    const orNull = (value: string) => {
        const trimmed = value.trim();
        return trimmed === "" ? null : trimmed;
    };

    return {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: orNull(values.email),
        phone: orNull(values.phone),
        street: orNull(values.street),
        postalCode: orNull(values.postalCode),
        city: orNull(values.city),
        country: orNull(values.country),
        vatNumber: orNull(values.vatNumber),
        notes: orNull(values.notes),
    };
}

type CustomerFormProps = {
    initialValues?: Customer;
    submitLabel: string;
    submittingLabel: string;
    onSubmit: (values: CustomerRequest) => Promise<void>;
    onCancel: () => void;
};

export function CustomerForm({
    initialValues,
    submitLabel,
    submittingLabel,
    onSubmit,
    onCancel,
}: CustomerFormProps) {
    const formId = useId();

    const [values, setValues] = useState<FormValues>(() =>
        toFormValues(initialValues)
    );
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    function setValue(field: FieldName, value: string) {
        setValues((current) => ({ ...current, [field]: value }));

        if (fieldErrors[field]) {
            setFieldErrors((current) => ({ ...current, [field]: undefined }));
        }
    }

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
                    : "Impossible d'enregistrer le client"
            );
            setSubmitting(false);
        }
    }

    function renderField(
        field: FieldName,
        options: {
            type?: string;
            required?: boolean;
            autoComplete?: string;
            placeholder?: string;
        } = {}
    ) {
        const inputId = `${formId}-${field}`;
        const errorId = `${inputId}-error`;
        const error = fieldErrors[field];

        return (
            <div>
                <label className="field-label" htmlFor={inputId}>
                    {FIELD_LABELS[field]}
                    {options.required && (
                        <span aria-hidden className="text-accent">
                            {" "}
                            *
                        </span>
                    )}
                </label>
                <input
                    id={inputId}
                    type={options.type ?? "text"}
                    className="input"
                    value={values[field]}
                    onChange={(event) => setValue(field, event.target.value)}
                    maxLength={MAX_LENGTHS[field]}
                    autoComplete={options.autoComplete ?? "off"}
                    placeholder={options.placeholder}
                    aria-required={options.required}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                />
                {error && (
                    <p id={errorId} className="mt-1.5 text-xs text-red-300">
                        {error}
                    </p>
                )}
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="card">
                <p className="section-title">Identité</p>
                <h2 className="mt-2 text-lg font-semibold">Client</h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {renderField("firstName", {
                        required: true,
                        autoComplete: "given-name",
                    })}
                    {renderField("lastName", {
                        required: true,
                        autoComplete: "family-name",
                    })}
                </div>
            </div>

            <div className="card">
                <p className="section-title">Contact</p>
                <h2 className="mt-2 text-lg font-semibold">Coordonnées</h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {renderField("email", {
                        type: "email",
                        autoComplete: "email",
                        placeholder: "client@exemple.be",
                    })}
                    {renderField("phone", {
                        type: "tel",
                        autoComplete: "tel",
                        placeholder: "+32 4xx xx xx xx",
                    })}
                </div>
            </div>

            <div className="card">
                <p className="section-title">Localisation</p>
                <h2 className="mt-2 text-lg font-semibold">Adresse</h2>

                <div className="mt-4 grid gap-4">
                    {renderField("street", {
                        autoComplete: "street-address",
                    })}
                    <div className="grid gap-4 sm:grid-cols-3">
                        {renderField("postalCode", {
                            autoComplete: "postal-code",
                        })}
                        {renderField("city")}
                        {renderField("country")}
                    </div>
                </div>
            </div>

            <div className="card">
                <p className="section-title">Facturation & suivi</p>
                <h2 className="mt-2 text-lg font-semibold">
                    Informations complémentaires
                </h2>

                <div className="mt-4 grid gap-4">
                    {renderField("vatNumber", {
                        placeholder: "BE 0123.456.789",
                    })}

                    <div>
                        <label
                            className="field-label"
                            htmlFor={`${formId}-notes`}
                        >
                            {FIELD_LABELS.notes}
                        </label>
                        <textarea
                            id={`${formId}-notes`}
                            className="input min-h-28"
                            rows={4}
                            value={values.notes}
                            onChange={(event) =>
                                setValue("notes", event.target.value)
                            }
                            placeholder="Historique, préférences, remarques..."
                        />
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
