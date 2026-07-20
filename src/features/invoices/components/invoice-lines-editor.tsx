"use client";

import { computeLinePreview } from "@/features/invoices/lib/decimal-input";
import { formatCurrency } from "@/lib/format";

export type LineFormValues = {
    key: number;
    description: string;
    quantity: string;
    unitPriceExcludingVat: string;
    vatRate: string;
};

export type LineField =
    | "description"
    | "quantity"
    | "unitPriceExcludingVat"
    | "vatRate";

export type LineFieldErrors = Partial<Record<LineField, string>>;

type InvoiceLinesEditorProps = {
    formId: string;
    lines: LineFormValues[];
    errors: Record<number, LineFieldErrors>;
    currency: string;
    disabled?: boolean;
    onLineChange: (key: number, field: LineField, value: string) => void;
    onAddLine: () => void;
    onRemoveLine: (key: number) => void;
    onMoveLine: (key: number, direction: -1 | 1) => void;
};

export function InvoiceLinesEditor({
    formId,
    lines,
    errors,
    currency,
    disabled,
    onLineChange,
    onAddLine,
    onRemoveLine,
    onMoveLine,
}: InvoiceLinesEditorProps) {
    return (
        <div className="space-y-4">
            {lines.length === 0 ? (
                <div
                    role="status"
                    className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300"
                >
                    Ce brouillon ne contient aucune ligne. Vous pouvez
                    l&apos;enregistrer, mais il ne pourra pas être émis tant
                    qu&apos;il ne contient pas au moins une ligne.
                </div>
            ) : (
                lines.map((line, index) => (
                    <InvoiceLineFields
                        key={line.key}
                        formId={formId}
                        line={line}
                        index={index}
                        lineCount={lines.length}
                        lineErrors={errors[line.key] ?? {}}
                        currency={currency}
                        disabled={disabled}
                        onLineChange={onLineChange}
                        onRemoveLine={onRemoveLine}
                        onMoveLine={onMoveLine}
                    />
                ))
            )}

            <button
                type="button"
                className="btn-ghost"
                onClick={onAddLine}
                disabled={disabled}
            >
                <span aria-hidden>+</span>
                Ajouter une ligne
            </button>
        </div>
    );
}

function InvoiceLineFields({
    formId,
    line,
    index,
    lineCount,
    lineErrors,
    currency,
    disabled,
    onLineChange,
    onRemoveLine,
    onMoveLine,
}: {
    formId: string;
    line: LineFormValues;
    index: number;
    lineCount: number;
    lineErrors: LineFieldErrors;
    currency: string;
    disabled?: boolean;
    onLineChange: (key: number, field: LineField, value: string) => void;
    onRemoveLine: (key: number) => void;
    onMoveLine: (key: number, direction: -1 | 1) => void;
}) {
    const idPrefix = `${formId}-line-${index}`;
    const position = index + 1;
    const preview = computeLinePreview(line);

    return (
        <fieldset className="surface-muted">
            <legend className="section-title float-left mb-3 w-full">
                Ligne {position}
            </legend>

            <div className="clear-both flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="btn-ghost px-2.5 py-1.5 text-xs"
                        onClick={() => onMoveLine(line.key, -1)}
                        disabled={disabled || index === 0}
                        aria-label={`Monter la ligne ${position}`}
                    >
                        <span aria-hidden>↑</span>
                        Monter
                    </button>
                    <button
                        type="button"
                        className="btn-ghost px-2.5 py-1.5 text-xs"
                        onClick={() => onMoveLine(line.key, 1)}
                        disabled={disabled || index === lineCount - 1}
                        aria-label={`Descendre la ligne ${position}`}
                    >
                        <span aria-hidden>↓</span>
                        Descendre
                    </button>
                </div>

                <button
                    type="button"
                    className="btn-danger px-2.5 py-1.5 text-xs"
                    onClick={() => onRemoveLine(line.key)}
                    disabled={disabled}
                    aria-label={`Supprimer la ligne ${position}`}
                >
                    Supprimer
                </button>
            </div>

            <div className="mt-4 grid gap-4">
                <div>
                    <label
                        className="field-label"
                        htmlFor={`${idPrefix}-description`}
                    >
                        Description
                        <span aria-hidden className="text-accent">
                            {" "}
                            *
                        </span>
                    </label>
                    <input
                        id={`${idPrefix}-description`}
                        type="text"
                        className="input"
                        value={line.description}
                        onChange={(event) =>
                            onLineChange(
                                line.key,
                                "description",
                                event.target.value
                            )
                        }
                        maxLength={500}
                        placeholder="Main d'œuvre, pièce, forfait..."
                        disabled={disabled}
                        aria-required
                        aria-invalid={
                            lineErrors.description ? true : undefined
                        }
                        aria-describedby={
                            lineErrors.description
                                ? `${idPrefix}-description-error`
                                : undefined
                        }
                    />
                    {lineErrors.description && (
                        <p
                            id={`${idPrefix}-description-error`}
                            className="mt-1.5 text-xs text-red-300"
                        >
                            {lineErrors.description}
                        </p>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <LineDecimalField
                        id={`${idPrefix}-quantity`}
                        label="Quantité"
                        value={line.quantity}
                        error={lineErrors.quantity}
                        disabled={disabled}
                        placeholder="1"
                        onChange={(value) =>
                            onLineChange(line.key, "quantity", value)
                        }
                    />
                    <LineDecimalField
                        id={`${idPrefix}-unit-price`}
                        label="Prix unitaire HTVA"
                        value={line.unitPriceExcludingVat}
                        error={lineErrors.unitPriceExcludingVat}
                        disabled={disabled}
                        placeholder="0,00"
                        onChange={(value) =>
                            onLineChange(
                                line.key,
                                "unitPriceExcludingVat",
                                value
                            )
                        }
                    />
                    <LineDecimalField
                        id={`${idPrefix}-vat-rate`}
                        label="Taux de TVA (%)"
                        value={line.vatRate}
                        error={lineErrors.vatRate}
                        disabled={disabled}
                        placeholder="21"
                        onChange={(value) =>
                            onLineChange(line.key, "vatRate", value)
                        }
                    />
                </div>

                {preview && (
                    <p className="text-xs text-faint">
                        Aperçu indicatif :{" "}
                        {formatCurrency(preview.amountExcludingVat, currency)}{" "}
                        HTVA · {formatCurrency(preview.vatAmount, currency)} TVA
                        ·{" "}
                        <span className="font-medium text-muted">
                            {formatCurrency(
                                preview.amountIncludingVat,
                                currency
                            )}{" "}
                            TVAC
                        </span>
                    </p>
                )}
            </div>
        </fieldset>
    );
}

function LineDecimalField({
    id,
    label,
    value,
    error,
    disabled,
    placeholder,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    error?: string;
    disabled?: boolean;
    placeholder: string;
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <label className="field-label" htmlFor={id}>
                {label}
                <span aria-hidden className="text-accent">
                    {" "}
                    *
                </span>
            </label>
            <input
                id={id}
                type="text"
                inputMode="decimal"
                className="input"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                aria-required
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
            />
            {error && (
                <p id={`${id}-error`} className="mt-1.5 text-xs text-red-300">
                    {error}
                </p>
            )}
        </div>
    );
}
