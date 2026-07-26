"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import * as garageServicesApi from "@/features/garage-services/api/garage-services-api";
import type { GarageService } from "@/features/garage-services/types/garage-service.types";
import * as workOrdersApi from "@/features/work-orders/api/work-orders-api";
import {
    isTerminalWorkOrderStatus,
    workOrderErrorMessage,
} from "@/features/work-orders/lib/work-order";
import type {
    WorkOrder,
    WorkOrderLine,
    WorkOrderLineRequest,
} from "@/features/work-orders/types/work-order.types";
import { formatCurrency } from "@/lib/format";

type WorkOrderLinesEditorProps = {
    order: WorkOrder;
    onUpdated: (order: WorkOrder) => void;
};

type LineFormValues = {
    garageServiceId: string;
    description: string;
    quantity: string;
    unitPrice: string;
    vatRate: string;
    displayOrder: string;
};

type LineField = keyof LineFormValues;
type FieldErrors = Partial<Record<LineField, string>>;

function initialLineValues(order: WorkOrder): LineFormValues {
    const nextDisplayOrder =
        order.lines.length === 0
            ? 0
            : Math.max(...order.lines.map((line) => line.displayOrder)) + 1;

    return {
        garageServiceId: "",
        description: "",
        quantity: "1",
        unitPrice: "",
        vatRate: "",
        displayOrder: String(nextDisplayOrder),
    };
}

function valuesFromLine(line: WorkOrderLine): LineFormValues {
    return {
        garageServiceId: line.garageServiceId ?? "",
        description: line.description,
        quantity: String(line.quantity),
        unitPrice: String(line.unitPrice),
        vatRate: String(line.vatRate),
        displayOrder: String(line.displayOrder),
    };
}

function normalizedNumber(value: string) {
    return Number(value.trim().replace(",", "."));
}

function isPlainDecimal(value: string) {
    return /^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(value.trim());
}

function decimalPlaces(value: string) {
    const normalized = value.trim().replace(",", ".");
    const decimal = normalized.split(".")[1];
    return decimal?.length ?? 0;
}

function validateLine(values: LineFormValues): FieldErrors {
    const errors: FieldErrors = {};
    const description = values.description.trim();

    if (!description) {
        errors.description = "La description est obligatoire.";
    } else if (description.length > 500) {
        errors.description =
            "La description ne peut pas dépasser 500 caractères.";
    }

    const quantity = normalizedNumber(values.quantity);
    if (
        !values.quantity.trim() ||
        !isPlainDecimal(values.quantity) ||
        !Number.isFinite(quantity) ||
        quantity <= 0
    ) {
        errors.quantity = "La quantité doit être strictement positive.";
    } else if (decimalPlaces(values.quantity) > 3) {
        errors.quantity =
            "La quantité doit comporter au maximum 3 décimales.";
    }

    const unitPrice = normalizedNumber(values.unitPrice);
    if (
        !values.unitPrice.trim() ||
        !isPlainDecimal(values.unitPrice) ||
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
    ) {
        errors.unitPrice =
            "Le prix unitaire hors TVA doit être positif ou nul.";
    } else if (decimalPlaces(values.unitPrice) > 2) {
        errors.unitPrice =
            "Le prix unitaire doit comporter au maximum 2 décimales.";
    }

    const vatRate = normalizedNumber(values.vatRate);
    if (
        !values.vatRate.trim() ||
        !isPlainDecimal(values.vatRate) ||
        !Number.isFinite(vatRate) ||
        vatRate < 0 ||
        vatRate > 100
    ) {
        errors.vatRate = "Le taux de TVA doit être compris entre 0 et 100.";
    } else if (decimalPlaces(values.vatRate) > 2) {
        errors.vatRate =
            "Le taux de TVA doit comporter au maximum 2 décimales.";
    }

    const displayOrder = Number(values.displayOrder);
    if (
        !values.displayOrder.trim() ||
        !Number.isInteger(displayOrder) ||
        displayOrder < 0
    ) {
        errors.displayOrder =
            "L’ordre d’affichage doit être un entier positif ou nul.";
    }

    return errors;
}

function toRequest(values: LineFormValues): WorkOrderLineRequest {
    return {
        garageServiceId: values.garageServiceId || null,
        description: values.description.trim(),
        quantity: normalizedNumber(values.quantity),
        unitPrice: normalizedNumber(values.unitPrice),
        vatRate: normalizedNumber(values.vatRate),
        displayOrder: Number(values.displayOrder),
    };
}

export function WorkOrderLinesEditor({
    order,
    onUpdated,
}: WorkOrderLinesEditorProps) {
    const [services, setServices] = useState<GarageService[]>([]);
    const [servicesUnavailable, setServicesUnavailable] = useState(false);
    const [editingLineId, setEditingLineId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [values, setValues] = useState(() => initialLineValues(order));
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deletingLineId, setDeletingLineId] = useState<string | null>(null);
    const terminal = isTerminalWorkOrderStatus(order.status);

    useEffect(() => {
        let ignore = false;

        garageServicesApi
            .getAllServices()
            .then((result) => {
                if (!ignore) {
                    setServices(result.filter((service) => service.active));
                    setServicesUnavailable(false);
                }
            })
            .catch(() => {
                if (!ignore) {
                    setServices([]);
                    setServicesUnavailable(true);
                }
            });

        return () => {
            ignore = true;
        };
    }, []);

    const servicesById = useMemo(
        () => new Map(services.map((service) => [service.id, service])),
        [services]
    );
    const sortedLines = useMemo(
        () =>
            [...order.lines].sort(
                (left, right) =>
                    left.displayOrder - right.displayOrder ||
                    left.id.localeCompare(right.id)
            ),
        [order.lines]
    );

    function updateValue(field: LineField, value: string) {
        setValues((current) => ({ ...current, [field]: value }));
        setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }

    function selectService(serviceId: string) {
        const service = servicesById.get(serviceId);
        setValues((current) => ({
            ...current,
            garageServiceId: serviceId,
            description:
                service && !current.description.trim()
                    ? service.description?.trim() || service.name
                    : current.description,
            unitPrice:
                service &&
                !current.unitPrice.trim() &&
                service.startingPrice !== null
                    ? String(service.startingPrice)
                    : current.unitPrice,
        }));
    }

    function startAdd() {
        setEditingLineId(null);
        setValues(initialLineValues(order));
        setFieldErrors({});
        setError(null);
        setShowForm(true);
    }

    function startEdit(line: WorkOrderLine) {
        setEditingLineId(line.id);
        setValues(valuesFromLine(line));
        setFieldErrors({});
        setError(null);
        setShowForm(true);
    }

    function closeForm() {
        if (saving) {
            return;
        }
        setEditingLineId(null);
        setShowForm(false);
        setFieldErrors({});
    }

    async function submitLine(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving || terminal) {
            return;
        }

        setError(null);
        setSuccess(null);
        const errors = validateLine(values);
        if (Object.values(errors).some(Boolean)) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
        setSaving(true);
        try {
            const request = toRequest(values);
            const updated = editingLineId
                ? await workOrdersApi.updateWorkOrderLine(
                      order.id,
                      editingLineId,
                      request
                  )
                : await workOrdersApi.addWorkOrderLine(order.id, request);
            onUpdated(updated);
            setShowForm(false);
            setEditingLineId(null);
            setSuccess(
                editingLineId
                    ? "La ligne de prestation a été modifiée."
                    : "La ligne de prestation a été ajoutée."
            );
        } catch (requestError) {
            setError(
                workOrderErrorMessage(
                    requestError,
                    "Impossible d’enregistrer la ligne."
                )
            );
        } finally {
            setSaving(false);
        }
    }

    async function deleteLine(line: WorkOrderLine) {
        if (
            deletingLineId ||
            terminal ||
            !window.confirm(
                `Supprimer la prestation « ${line.description} » ?`
            )
        ) {
            return;
        }

        setDeletingLineId(line.id);
        setError(null);
        setSuccess(null);

        try {
            await workOrdersApi.deleteWorkOrderLine(order.id, line.id);
            const refreshed = await workOrdersApi.getWorkOrder(order.id);
            onUpdated(refreshed);
            setSuccess("La ligne de prestation a été supprimée.");
        } catch (requestError) {
            setError(
                workOrderErrorMessage(
                    requestError,
                    "Impossible de supprimer la ligne."
                )
            );
        } finally {
            setDeletingLineId(null);
        }
    }

    return (
        <section className="card" aria-labelledby="work-order-lines-title">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="section-title">Prestations</p>
                    <h2
                        id="work-order-lines-title"
                        className="mt-2 text-lg font-semibold"
                    >
                        Lignes du dossier
                    </h2>
                </div>
                {!terminal && !showForm && (
                    <button
                        className="btn-primary"
                        type="button"
                        onClick={startAdd}
                    >
                        Ajouter une ligne
                    </button>
                )}
            </div>

            {terminal && (
                <div
                    className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm text-amber-200"
                    role="status"
                >
                    Un ordre livré ou annulé ne peut plus être modifié.
                </div>
            )}
            {servicesUnavailable && (
                <p className="mt-4 text-sm text-muted" role="status">
                    Le catalogue des services est indisponible. La prestation
                    peut toujours être saisie manuellement.
                </p>
            )}
            {error && (
                <div className="alert-error mt-4" role="alert">
                    {error}
                </div>
            )}
            {success && (
                <div className="alert-success mt-4" role="status">
                    {success}
                </div>
            )}

            {showForm && !terminal && (
                <LineForm
                    values={values}
                    errors={fieldErrors}
                    services={services}
                    editing={editingLineId !== null}
                    saving={saving}
                    onValueChange={updateValue}
                    onServiceChange={selectService}
                    onSubmit={submitLine}
                    onCancel={closeForm}
                />
            )}

            {sortedLines.length === 0 ? (
                <div className="empty-state mt-5">
                    Aucune prestation n’est encore enregistrée.
                </div>
            ) : (
                <div className="mt-5 space-y-3">
                    {sortedLines.map((line) => {
                        const service = line.garageServiceId
                            ? servicesById.get(line.garageServiceId)
                            : undefined;

                        return (
                            <article
                                key={line.id}
                                className="surface-muted"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-semibold">
                                            {line.description}
                                        </h3>
                                        <p className="mt-1 text-xs text-faint">
                                            {service
                                                ? `Service : ${service.name}`
                                                : line.garageServiceId
                                                  ? "Service lié"
                                                  : "Prestation libre"}
                                            {" · "}ordre {line.displayOrder}
                                        </p>
                                    </div>
                                    {!terminal && (
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                className="btn-ghost px-3 py-2"
                                                onClick={() => startEdit(line)}
                                                disabled={
                                                    deletingLineId !== null ||
                                                    saving
                                                }
                                            >
                                                Modifier
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-danger px-3 py-2"
                                                onClick={() =>
                                                    deleteLine(line)
                                                }
                                                disabled={
                                                    deletingLineId !== null ||
                                                    saving
                                                }
                                            >
                                                {deletingLineId === line.id
                                                    ? "Suppression..."
                                                    : "Supprimer"}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
                                    <LineAmount
                                        label="Quantité"
                                        value={String(line.quantity)}
                                    />
                                    <LineAmount
                                        label="Prix unitaire HT"
                                        value={formatCurrency(
                                            line.unitPrice,
                                            "EUR"
                                        )}
                                    />
                                    <LineAmount
                                        label="TVA"
                                        value={`${line.vatRate} %`}
                                    />
                                    <LineAmount
                                        label="Montant HT"
                                        value={formatCurrency(
                                            line.amountExcludingVat,
                                            "EUR"
                                        )}
                                    />
                                    <LineAmount
                                        label="Montant TVA"
                                        value={formatCurrency(
                                            line.vatAmount,
                                            "EUR"
                                        )}
                                    />
                                    <LineAmount
                                        label="Montant TVAC"
                                        value={formatCurrency(
                                            line.amountIncludingVat,
                                            "EUR"
                                        )}
                                    />
                                </dl>
                            </article>
                        );
                    })}
                </div>
            )}

            <dl className="mt-6 grid gap-3 border-t border-line pt-6 sm:grid-cols-3">
                <Total
                    label="Total hors TVA"
                    value={order.amountExcludingVat}
                />
                <Total label="TVA" value={order.vatAmount} />
                <Total
                    label="Total TVA comprise"
                    value={order.amountIncludingVat}
                    emphasized
                />
            </dl>
        </section>
    );
}

function LineForm({
    values,
    errors,
    services,
    editing,
    saving,
    onValueChange,
    onServiceChange,
    onSubmit,
    onCancel,
}: {
    values: LineFormValues;
    errors: FieldErrors;
    services: GarageService[];
    editing: boolean;
    saving: boolean;
    onValueChange: (field: LineField, value: string) => void;
    onServiceChange: (serviceId: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
}) {
    return (
        <form
            className="mt-5 rounded-xl border border-line bg-surface-soft p-4"
            onSubmit={onSubmit}
            noValidate
        >
            <h3 className="font-semibold">
                {editing ? "Modifier la prestation" : "Nouvelle prestation"}
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <label
                        className="field-label"
                        htmlFor="work-order-line-service"
                    >
                        Service du garage (facultatif)
                    </label>
                    <select
                        id="work-order-line-service"
                        className="input"
                        value={values.garageServiceId}
                        onChange={(event) =>
                            onServiceChange(event.target.value)
                        }
                        disabled={saving}
                    >
                        <option value="">Prestation libre</option>
                        {services.map((service) => (
                            <option key={service.id} value={service.id}>
                                {service.name}
                            </option>
                        ))}
                    </select>
                </div>
                <LineInput
                    id="work-order-line-description"
                    label="Description"
                    value={values.description}
                    error={errors.description}
                    onChange={(value) => onValueChange("description", value)}
                    disabled={saving}
                    maxLength={500}
                    wide
                />
                <LineInput
                    id="work-order-line-quantity"
                    label="Quantité"
                    value={values.quantity}
                    error={errors.quantity}
                    onChange={(value) => onValueChange("quantity", value)}
                    disabled={saving}
                    inputMode="decimal"
                />
                <LineInput
                    id="work-order-line-unit-price"
                    label="Prix unitaire hors TVA"
                    value={values.unitPrice}
                    error={errors.unitPrice}
                    onChange={(value) => onValueChange("unitPrice", value)}
                    disabled={saving}
                    inputMode="decimal"
                />
                <LineInput
                    id="work-order-line-vat-rate"
                    label="Taux de TVA (%)"
                    value={values.vatRate}
                    error={errors.vatRate}
                    onChange={(value) => onValueChange("vatRate", value)}
                    disabled={saving}
                    inputMode="decimal"
                />
                <LineInput
                    id="work-order-line-display-order"
                    label="Ordre d’affichage"
                    value={values.displayOrder}
                    error={errors.displayOrder}
                    onChange={(value) => onValueChange("displayOrder", value)}
                    disabled={saving}
                    inputMode="numeric"
                />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
                <button
                    className="btn-primary"
                    type="submit"
                    disabled={saving}
                >
                    {saving
                        ? "Enregistrement..."
                        : editing
                          ? "Enregistrer la ligne"
                          : "Ajouter la ligne"}
                </button>
                <button
                    className="btn-ghost"
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                >
                    Annuler
                </button>
            </div>
        </form>
    );
}

function LineInput({
    id,
    label,
    value,
    error,
    onChange,
    disabled,
    inputMode,
    maxLength,
    wide,
}: {
    id: string;
    label: string;
    value: string;
    error?: string;
    onChange: (value: string) => void;
    disabled: boolean;
    inputMode?: "decimal" | "numeric";
    maxLength?: number;
    wide?: boolean;
}) {
    return (
        <div className={wide ? "sm:col-span-2" : undefined}>
            <label className="field-label" htmlFor={id}>
                {label}
            </label>
            <input
                id={id}
                className="input"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
                inputMode={inputMode}
                maxLength={maxLength}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
            />
            {error && (
                <p
                    id={`${id}-error`}
                    className="mt-2 text-xs text-red-300"
                    role="alert"
                >
                    {error}
                </p>
            )}
        </div>
    );
}

function LineAmount({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-xs text-faint">{label}</dt>
            <dd className="mt-1 font-medium">{value}</dd>
        </div>
    );
}

function Total({
    label,
    value,
    emphasized,
}: {
    label: string;
    value: number;
    emphasized?: boolean;
}) {
    return (
        <div
            className={
                emphasized
                    ? "rounded-xl border border-accent/35 bg-accent/8 p-4"
                    : "surface-muted"
            }
        >
            <dt className="section-title">{label}</dt>
            <dd className="mt-2 text-lg font-semibold">
                {formatCurrency(value, "EUR")}
            </dd>
        </div>
    );
}
