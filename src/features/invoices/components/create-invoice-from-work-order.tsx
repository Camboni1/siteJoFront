"use client";

import { FormEvent, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as invoicesApi from "@/features/invoices/api/invoices-api";
import { invoiceDraftFromWorkOrderError } from "@/features/invoices/lib/invoice-error";
import type { CreateInvoiceFromWorkOrderRequest } from "@/features/invoices/types/invoice.types";
import type { WorkOrder } from "@/features/work-orders/types/work-order.types";
import { isApiError } from "@/lib/api";
import { localIsoDate } from "@/lib/date";

const NOTES_MAX_LENGTH = 5000;

type Props = {
    order: WorkOrder;
};

type FormValues = {
    invoiceDate: string;
    dueDate: string;
    currency: string;
    notes: string;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

function initialValues(): FormValues {
    const today = localIsoDate();

    return {
        invoiceDate: today,
        dueDate: today,
        currency: "EUR",
        notes: "",
    };
}

function validate(values: FormValues): FieldErrors {
    const errors: FieldErrors = {};

    if (!values.invoiceDate) {
        errors.invoiceDate = "La date d'émission est obligatoire";
    }

    if (!values.dueDate) {
        errors.dueDate = "La date d'échéance est obligatoire";
    } else if (values.invoiceDate && values.dueDate < values.invoiceDate) {
        errors.dueDate =
            "La date d'échéance ne peut pas précéder la date d'émission";
    }

    if (!/^[A-Z]{3}$/.test(values.currency.trim())) {
        errors.currency =
            "La devise doit être un code ISO de trois lettres majuscules";
    }

    if (values.notes.length > NOTES_MAX_LENGTH) {
        errors.notes = "Les notes ne peuvent pas dépasser 5000 caractères";
    }

    return errors;
}

function toRequest(values: FormValues): CreateInvoiceFromWorkOrderRequest {
    const notes = values.notes.trim();

    return {
        invoiceDate: values.invoiceDate,
        dueDate: values.dueDate,
        currency: values.currency.trim(),
        notes: notes === "" ? null : notes,
    };
}

export function CreateInvoiceFromWorkOrder({ order }: Props) {
    const router = useRouter();
    const formId = useId();
    const submittingRef = useRef(false);
    const [open, setOpen] = useState(false);
    const [values, setValues] = useState<FormValues>(initialValues);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [requestError, setRequestError] = useState<{
        message: string;
        duplicate: boolean;
    } | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const eligible = order.status === "READY" || order.status === "DELIVERED";

    if (!eligible) {
        return null;
    }

    if (order.lines.length === 0) {
        return (
            <section className="card">
                <p className="section-title">Facturation</p>
                <h2 className="mt-2 text-lg font-semibold">
                    Brouillon de facture
                </h2>
                <p className="mt-3 text-sm text-muted">
                    Ajoutez au moins une prestation avant de créer la facture.
                </p>
            </section>
        );
    }

    function updateValue(field: keyof FormValues, value: string) {
        setValues((current) => ({ ...current, [field]: value }));
        setFieldErrors((current) => ({ ...current, [field]: undefined }));
        setRequestError(null);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (submittingRef.current) {
            return;
        }

        const errors = validate(values);

        if (Object.values(errors).some(Boolean)) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
        setRequestError(null);
        submittingRef.current = true;
        setSubmitting(true);

        try {
            const created =
                await invoicesApi.createInvoiceDraftFromWorkOrder(
                    order.id,
                    toRequest(values)
                );
            router.push(`/employee/invoices/${created.id}`);
        } catch (error) {
            if (isApiError(error, 401)) {
                router.push("/login");
                return;
            }

            if (isApiError(error, 403)) {
                router.push("/dashboard");
                return;
            }

            setRequestError(invoiceDraftFromWorkOrderError(error));
            submittingRef.current = false;
            setSubmitting(false);
        }
    }

    const toggleLabel = open
        ? "Fermer le formulaire de facture"
        : "Créer le brouillon de facture";

    return (
        <section className="card">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="section-title">Facturation</p>
                    <h2 className="mt-2 text-lg font-semibold">
                        Brouillon de facture
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted">
                        Créez une facture à partir des informations validées du
                        dossier atelier.
                    </p>
                </div>
                <button
                    type="button"
                    className={open ? "btn-ghost" : "btn-primary"}
                    aria-expanded={open}
                    aria-controls={`${formId}-form`}
                    onClick={() => {
                        setOpen((current) => !current);
                        setRequestError(null);
                    }}
                    disabled={submitting}
                >
                    {toggleLabel}
                </button>
            </div>

            {open && (
                <form
                    id={`${formId}-form`}
                    className="mt-6 space-y-5 border-t border-line pt-6"
                    onSubmit={handleSubmit}
                    noValidate
                >
                    <p className="surface-muted text-sm leading-6 text-muted">
                        Le client, les prestations et les montants seront
                        repris automatiquement du dossier atelier.
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                className="field-label"
                                htmlFor={`${formId}-invoice-date`}
                            >
                                Date d&apos;émission
                            </label>
                            <input
                                id={`${formId}-invoice-date`}
                                className="input"
                                type="date"
                                value={values.invoiceDate}
                                onChange={(event) =>
                                    updateValue(
                                        "invoiceDate",
                                        event.target.value
                                    )
                                }
                                disabled={submitting}
                                aria-required
                                aria-invalid={
                                    fieldErrors.invoiceDate ? true : undefined
                                }
                                aria-describedby={
                                    fieldErrors.invoiceDate
                                        ? `${formId}-invoice-date-error`
                                        : undefined
                                }
                            />
                            {fieldErrors.invoiceDate && (
                                <p
                                    id={`${formId}-invoice-date-error`}
                                    className="mt-1.5 text-xs text-red-300"
                                >
                                    {fieldErrors.invoiceDate}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                className="field-label"
                                htmlFor={`${formId}-due-date`}
                            >
                                Date d&apos;échéance
                            </label>
                            <input
                                id={`${formId}-due-date`}
                                className="input"
                                type="date"
                                value={values.dueDate}
                                min={values.invoiceDate || undefined}
                                onChange={(event) =>
                                    updateValue("dueDate", event.target.value)
                                }
                                disabled={submitting}
                                aria-required
                                aria-invalid={
                                    fieldErrors.dueDate ? true : undefined
                                }
                                aria-describedby={
                                    fieldErrors.dueDate
                                        ? `${formId}-due-date-error`
                                        : undefined
                                }
                            />
                            {fieldErrors.dueDate && (
                                <p
                                    id={`${formId}-due-date-error`}
                                    className="mt-1.5 text-xs text-red-300"
                                >
                                    {fieldErrors.dueDate}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label
                            className="field-label"
                            htmlFor={`${formId}-currency`}
                        >
                            Devise
                        </label>
                        <input
                            id={`${formId}-currency`}
                            className="input max-w-40 font-mono uppercase"
                            type="text"
                            value={values.currency}
                            onChange={(event) =>
                                updateValue(
                                    "currency",
                                    event.target.value.toUpperCase()
                                )
                            }
                            maxLength={3}
                            disabled={submitting}
                            aria-required
                            aria-invalid={
                                fieldErrors.currency ? true : undefined
                            }
                            aria-describedby={
                                fieldErrors.currency
                                    ? `${formId}-currency-error`
                                    : `${formId}-currency-help`
                            }
                        />
                        {fieldErrors.currency ? (
                            <p
                                id={`${formId}-currency-error`}
                                className="mt-1.5 text-xs text-red-300"
                            >
                                {fieldErrors.currency}
                            </p>
                        ) : (
                            <p
                                id={`${formId}-currency-help`}
                                className="mt-1.5 text-xs text-faint"
                            >
                                Code ISO 4217, par exemple EUR.
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            className="field-label"
                            htmlFor={`${formId}-notes`}
                        >
                            Notes
                        </label>
                        <textarea
                            id={`${formId}-notes`}
                            className="input min-h-24"
                            rows={3}
                            value={values.notes}
                            onChange={(event) =>
                                updateValue("notes", event.target.value)
                            }
                            maxLength={NOTES_MAX_LENGTH}
                            disabled={submitting}
                            aria-invalid={
                                fieldErrors.notes ? true : undefined
                            }
                            aria-describedby={
                                fieldErrors.notes
                                    ? `${formId}-notes-error`
                                    : undefined
                            }
                        />
                        {fieldErrors.notes && (
                            <p
                                id={`${formId}-notes-error`}
                                className="mt-1.5 text-xs text-red-300"
                            >
                                {fieldErrors.notes}
                            </p>
                        )}
                    </div>

                    {requestError && (
                        <div className="alert-error" role="alert">
                            <p>{requestError.message}</p>
                            {requestError.duplicate && (
                                <Link
                                    href="/employee/invoices"
                                    className="mt-2 inline-flex text-link"
                                >
                                    Consulter les factures
                                </Link>
                            )}
                        </div>
                    )}

                    {submitting && (
                        <p className="text-sm text-muted" role="status">
                            Création du brouillon en cours.
                        </p>
                    )}

                    <div className="flex flex-wrap justify-end gap-3">
                        <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => setOpen(false)}
                            disabled={submitting}
                        >
                            Fermer
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={submitting}
                        >
                            {submitting
                                ? "Création..."
                                : "Créer le brouillon de facture"}
                        </button>
                    </div>
                </form>
            )}
        </section>
    );
}
