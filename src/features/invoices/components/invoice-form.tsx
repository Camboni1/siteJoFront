"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { isApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import * as customersApi from "@/features/customers/api/customers-api";
import type { Customer } from "@/features/customers/types/customer.types";
import type {
    CreateInvoiceRequest,
    InvoiceResponse,
} from "@/features/invoices/types/invoice.types";
import {
    computeLinePreview,
    decimalToInput,
    parseDecimalInput,
    type LinePreview,
} from "@/features/invoices/lib/decimal-input";
import {
    InvoiceLinesEditor,
    type LineField,
    type LineFieldErrors,
    type LineFormValues,
} from "@/features/invoices/components/invoice-lines-editor";

const NOTES_MAX_LENGTH = 5000;
const DESCRIPTION_MAX_LENGTH = 500;

let lineKeySequence = 0;

function nextLineKey() {
    lineKeySequence += 1;
    return lineKeySequence;
}

type FormValues = {
    customerId: string;
    invoiceDate: string;
    dueDate: string;
    currency: string;
    notes: string;
    lines: LineFormValues[];
};

type FieldErrors = Partial<
    Record<"customerId" | "invoiceDate" | "dueDate" | "currency" | "notes", string>
>;

function emptyLine(): LineFormValues {
    return {
        key: nextLineKey(),
        description: "",
        quantity: "1",
        unitPriceExcludingVat: "",
        vatRate: "21",
    };
}

function todayIsoDate() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${now.getFullYear()}-${month}-${day}`;
}

function toFormValues(invoice?: InvoiceResponse): FormValues {
    if (!invoice) {
        const today = todayIsoDate();

        return {
            customerId: "",
            invoiceDate: today,
            dueDate: today,
            currency: "EUR",
            notes: "",
            lines: [emptyLine()],
        };
    }

    return {
        customerId: invoice.customerId ?? "",
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate ?? "",
        currency: invoice.currency,
        notes: invoice.notes ?? "",
        lines: invoice.lines.map((line) => ({
            key: nextLineKey(),
            description: line.description,
            quantity: decimalToInput(line.quantity),
            unitPriceExcludingVat: decimalToInput(line.unitPriceExcludingVat),
            vatRate: decimalToInput(line.vatRate),
        })),
    };
}

function validateLine(line: LineFormValues): LineFieldErrors {
    const errors: LineFieldErrors = {};

    if (!line.description.trim()) {
        errors.description = "La description de la ligne est obligatoire";
    } else if (line.description.trim().length > DESCRIPTION_MAX_LENGTH) {
        errors.description =
            "La description de la ligne ne peut pas dépasser 500 caractères";
    }

    if (!line.quantity.trim()) {
        errors.quantity = "La quantité est obligatoire";
    } else {
        const quantity = parseDecimalInput(line.quantity);

        if (!quantity) {
            errors.quantity = "La quantité doit être un nombre";
        } else if (quantity.value <= 0) {
            errors.quantity = "La quantité doit être strictement positive";
        } else if (quantity.integerDigits > 9 || quantity.fractionDigits > 3) {
            errors.quantity =
                "La quantité doit comporter au maximum 9 chiffres et 3 décimales";
        }
    }

    if (!line.unitPriceExcludingVat.trim()) {
        errors.unitPriceExcludingVat =
            "Le prix unitaire hors TVA est obligatoire";
    } else {
        const unitPrice = parseDecimalInput(line.unitPriceExcludingVat);

        if (!unitPrice) {
            errors.unitPriceExcludingVat =
                "Le prix unitaire doit être un nombre";
        } else if (unitPrice.value < 0) {
            errors.unitPriceExcludingVat =
                "Le prix unitaire hors TVA doit être positif ou nul";
        } else if (
            unitPrice.integerDigits > 10 ||
            unitPrice.fractionDigits > 2
        ) {
            errors.unitPriceExcludingVat =
                "Le prix unitaire doit comporter au maximum 10 chiffres et 2 décimales";
        }
    }

    if (!line.vatRate.trim()) {
        errors.vatRate = "Le taux de TVA est obligatoire";
    } else {
        const vatRate = parseDecimalInput(line.vatRate);

        if (!vatRate) {
            errors.vatRate = "Le taux de TVA doit être un nombre";
        } else if (vatRate.value < 0) {
            errors.vatRate = "Le taux de TVA doit être positif ou nul";
        } else if (vatRate.value > 100) {
            errors.vatRate = "Le taux de TVA ne peut pas dépasser 100,00 %";
        } else if (vatRate.fractionDigits > 2) {
            errors.vatRate =
                "Le taux de TVA doit comporter au maximum 2 décimales";
        }
    }

    return errors;
}

function validate(values: FormValues) {
    const invoiceErrors: FieldErrors = {};
    const lineErrors: Record<number, LineFieldErrors> = {};

    if (!values.customerId) {
        invoiceErrors.customerId = "Le client est obligatoire";
    }

    if (!values.invoiceDate) {
        invoiceErrors.invoiceDate = "La date d'émission est obligatoire";
    }

    if (!values.dueDate) {
        invoiceErrors.dueDate = "La date d'échéance est obligatoire";
    } else if (values.invoiceDate && values.dueDate < values.invoiceDate) {
        invoiceErrors.dueDate =
            "La date d'échéance ne peut pas précéder la date d'émission";
    }

    if (!/^[A-Z]{3}$/.test(values.currency.trim())) {
        invoiceErrors.currency =
            "La devise doit être un code ISO de trois lettres majuscules";
    }

    if (values.notes.length > NOTES_MAX_LENGTH) {
        invoiceErrors.notes =
            "Les notes ne peuvent pas dépasser 5000 caractères";
    }

    for (const line of values.lines) {
        const errors = validateLine(line);

        if (Object.values(errors).some(Boolean)) {
            lineErrors[line.key] = errors;
        }
    }

    return {
        invoiceErrors,
        lineErrors,
        hasErrors:
            Object.values(invoiceErrors).some(Boolean) ||
            Object.keys(lineErrors).length > 0,
    };
}

function toRequest(values: FormValues): CreateInvoiceRequest {
    const notes = values.notes.trim();

    return {
        customerId: values.customerId,
        invoiceDate: values.invoiceDate,
        dueDate: values.dueDate,
        currency: values.currency.trim(),
        notes: notes === "" ? null : notes,
        // displayOrder suit l'ordre visuel des lignes, jamais saisi à la main.
        lines: values.lines.map((line, index) => ({
            description: line.description.trim(),
            quantity: parseDecimalInput(line.quantity)!.value,
            unitPriceExcludingVat: parseDecimalInput(
                line.unitPriceExcludingVat
            )!.value,
            vatRate: parseDecimalInput(line.vatRate)!.value,
            displayOrder: index,
        })),
    };
}

function computeTotalsPreview(lines: LineFormValues[]): LinePreview | null {
    if (lines.length === 0) {
        return null;
    }

    let excludingVatCents = 0;
    let vatCents = 0;
    let includingVatCents = 0;

    for (const line of lines) {
        const preview = computeLinePreview(line);

        if (!preview) {
            return null;
        }

        excludingVatCents += Math.round(preview.amountExcludingVat * 100);
        vatCents += Math.round(preview.vatAmount * 100);
        includingVatCents += Math.round(preview.amountIncludingVat * 100);
    }

    return {
        amountExcludingVat: excludingVatCents / 100,
        vatAmount: vatCents / 100,
        amountIncludingVat: includingVatCents / 100,
    };
}

type InvoiceFormProps = {
    initialInvoice?: InvoiceResponse;
    disabled?: boolean;
    submitLabel: string;
    submittingLabel: string;
    onSubmit: (values: CreateInvoiceRequest) => Promise<void>;
    onCancel: () => void;
};

export function InvoiceForm({
    initialInvoice,
    disabled,
    submitLabel,
    submittingLabel,
    onSubmit,
    onCancel,
}: InvoiceFormProps) {
    const formId = useId();
    const router = useRouter();

    const [values, setValues] = useState<FormValues>(() =>
        toFormValues(initialInvoice)
    );
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [lineErrors, setLineErrors] = useState<Record<number, LineFieldErrors>>(
        {}
    );
    const [apiError, setApiError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [customers, setCustomers] = useState<Customer[] | null>(null);
    const [customersError, setCustomersError] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        customersApi
            .getCustomers()
            .then((result) => {
                if (!ignore) {
                    setCustomers(
                        [...result].sort((a, b) =>
                            `${a.lastName} ${a.firstName}`.localeCompare(
                                `${b.lastName} ${b.firstName}`,
                                "fr",
                                { sensitivity: "base" }
                            )
                        )
                    );
                }
            })
            .catch((error) => {
                if (ignore) {
                    return;
                }

                if (isApiError(error, 401)) {
                    router.push("/login");
                    return;
                }

                if (isApiError(error, 403)) {
                    router.push("/dashboard");
                    return;
                }

                setCustomers([]);
                setCustomersError(
                    error instanceof Error
                        ? error.message
                        : "Impossible de charger les clients"
                );
            });

        return () => {
            ignore = true;
        };
    }, [router]);

    function updateValue<Field extends keyof FieldErrors>(
        field: Field,
        value: string
    ) {
        setValues((current) => ({ ...current, [field]: value }));
        setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }

    function handleLineChange(key: number, field: LineField, value: string) {
        setValues((current) => ({
            ...current,
            lines: current.lines.map((line) =>
                line.key === key ? { ...line, [field]: value } : line
            ),
        }));
        setLineErrors((current) => {
            const forLine = current[key];

            if (!forLine?.[field]) {
                return current;
            }

            return { ...current, [key]: { ...forLine, [field]: undefined } };
        });
    }

    function handleAddLine() {
        setValues((current) => ({
            ...current,
            lines: [...current.lines, emptyLine()],
        }));
    }

    function handleRemoveLine(key: number) {
        setValues((current) => ({
            ...current,
            lines: current.lines.filter((line) => line.key !== key),
        }));
        setLineErrors((current) => {
            if (!(key in current)) {
                return current;
            }

            const next = { ...current };
            delete next[key];
            return next;
        });
    }

    function handleMoveLine(key: number, direction: -1 | 1) {
        setValues((current) => {
            const index = current.lines.findIndex((line) => line.key === key);
            const target = index + direction;

            if (index === -1 || target < 0 || target >= current.lines.length) {
                return current;
            }

            const lines = [...current.lines];
            [lines[index], lines[target]] = [lines[target], lines[index]];

            return { ...current, lines };
        });
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setApiError(null);

        const result = validate(values);

        if (result.hasErrors) {
            setFieldErrors(result.invoiceErrors);
            setLineErrors(result.lineErrors);
            return;
        }

        setFieldErrors({});
        setLineErrors({});
        setSubmitting(true);

        try {
            await onSubmit(toRequest(values));
        } catch (error) {
            setApiError(
                error instanceof Error
                    ? error.message
                    : "Impossible d'enregistrer la facture"
            );
            setSubmitting(false);
        }
    }

    const totalsPreview = computeTotalsPreview(values.lines);
    const previewCurrency = values.currency.trim() || "EUR";
    const formDisabled = disabled || submitting;

    return (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="card">
                <p className="section-title">Facture</p>
                <h2 className="mt-2 text-lg font-semibold">
                    Informations générales
                </h2>

                <div className="mt-4 grid gap-4">
                    {initialInvoice && (
                        <div className="surface-muted">
                            <p className="section-title">Numéro</p>
                            <p className="mt-2 font-mono text-sm font-medium">
                                {initialInvoice.invoiceNumber}
                            </p>
                            <p className="mt-1.5 text-xs text-faint">
                                Attribué automatiquement — il ne peut pas être
                                modifié.
                            </p>
                        </div>
                    )}

                    <div>
                        <label
                            className="field-label"
                            htmlFor={`${formId}-customer`}
                        >
                            Client
                            <span aria-hidden className="text-accent">
                                {" "}
                                *
                            </span>
                        </label>
                        <select
                            id={`${formId}-customer`}
                            className="input"
                            value={values.customerId}
                            onChange={(event) =>
                                updateValue("customerId", event.target.value)
                            }
                            disabled={formDisabled || customers === null}
                            aria-required
                            aria-invalid={
                                fieldErrors.customerId ? true : undefined
                            }
                            aria-describedby={
                                fieldErrors.customerId
                                    ? `${formId}-customer-error`
                                    : undefined
                            }
                        >
                            <option value="">
                                {customers === null
                                    ? "Chargement des clients..."
                                    : "Sélectionner un client..."}
                            </option>
                            {(customers ?? []).map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.lastName} {customer.firstName}
                                </option>
                            ))}
                        </select>
                        {fieldErrors.customerId && (
                            <p
                                id={`${formId}-customer-error`}
                                className="mt-1.5 text-xs text-red-300"
                            >
                                {fieldErrors.customerId}
                            </p>
                        )}
                        {customersError && (
                            <p
                                role="alert"
                                className="mt-1.5 text-xs text-red-300"
                            >
                                {customersError}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                className="field-label"
                                htmlFor={`${formId}-invoice-date`}
                            >
                                Date d&apos;émission
                                <span aria-hidden className="text-accent">
                                    {" "}
                                    *
                                </span>
                            </label>
                            <input
                                id={`${formId}-invoice-date`}
                                type="date"
                                className="input"
                                value={values.invoiceDate}
                                onChange={(event) =>
                                    updateValue(
                                        "invoiceDate",
                                        event.target.value
                                    )
                                }
                                disabled={formDisabled}
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
                                <span aria-hidden className="text-accent">
                                    {" "}
                                    *
                                </span>
                            </label>
                            <input
                                id={`${formId}-due-date`}
                                type="date"
                                className="input"
                                value={values.dueDate}
                                min={values.invoiceDate || undefined}
                                onChange={(event) =>
                                    updateValue("dueDate", event.target.value)
                                }
                                disabled={formDisabled}
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

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                className="field-label"
                                htmlFor={`${formId}-currency`}
                            >
                                Devise
                                <span aria-hidden className="text-accent">
                                    {" "}
                                    *
                                </span>
                            </label>
                            <input
                                id={`${formId}-currency`}
                                type="text"
                                className="input font-mono uppercase"
                                value={values.currency}
                                onChange={(event) =>
                                    updateValue(
                                        "currency",
                                        event.target.value.toUpperCase()
                                    )
                                }
                                maxLength={3}
                                disabled={formDisabled}
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
                            placeholder="Conditions de paiement, référence dossier..."
                            disabled={formDisabled}
                            aria-invalid={fieldErrors.notes ? true : undefined}
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
                </div>
            </div>

            <div className="card">
                <p className="section-title">Détail</p>
                <h2 className="mt-2 text-lg font-semibold">
                    Lignes de la facture
                </h2>

                <div className="mt-4">
                    <InvoiceLinesEditor
                        formId={formId}
                        lines={values.lines}
                        errors={lineErrors}
                        currency={previewCurrency}
                        disabled={formDisabled}
                        onLineChange={handleLineChange}
                        onAddLine={handleAddLine}
                        onRemoveLine={handleRemoveLine}
                        onMoveLine={handleMoveLine}
                    />
                </div>

                {totalsPreview && (
                    <div className="surface-muted mt-5">
                        <p className="section-title">Aperçu indicatif</p>
                        <dl className="mt-3 space-y-1.5 text-sm">
                            <div className="flex items-center justify-between gap-4">
                                <dt className="text-muted">Total HTVA</dt>
                                <dd className="font-medium">
                                    {formatCurrency(
                                        totalsPreview.amountExcludingVat,
                                        previewCurrency
                                    )}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <dt className="text-muted">TVA</dt>
                                <dd className="font-medium">
                                    {formatCurrency(
                                        totalsPreview.vatAmount,
                                        previewCurrency
                                    )}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <dt className="font-semibold">Total TVAC</dt>
                                <dd className="font-semibold">
                                    {formatCurrency(
                                        totalsPreview.amountIncludingVat,
                                        previewCurrency
                                    )}
                                </dd>
                            </div>
                        </dl>
                        <p className="mt-3 text-xs text-faint">
                            Montants indicatifs — les totaux officiels sont
                            calculés par le serveur lors de
                            l&apos;enregistrement.
                        </p>
                    </div>
                )}
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
                    disabled={formDisabled}
                    className="btn-primary"
                >
                    {submitting ? submittingLabel : submitLabel}
                </button>
            </div>
        </form>
    );
}
