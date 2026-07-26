"use client";

import { type FormEvent, useState } from "react";
import * as workOrdersApi from "@/features/work-orders/api/work-orders-api";
import {
    isTerminalWorkOrderStatus,
    shortIdentifier,
    workOrderErrorMessage,
} from "@/features/work-orders/lib/work-order";
import type { WorkOrder } from "@/features/work-orders/types/work-order.types";

type WorkOrderInfoFormProps = {
    order: WorkOrder;
    onUpdated: (order: WorkOrder) => void;
};

type FormValues = {
    mileageAtReception: string;
    customerComplaint: string;
    diagnostic: string;
    workPerformed: string;
    internalNotes: string;
};

function valuesFromOrder(order: WorkOrder): FormValues {
    return {
        mileageAtReception:
            order.mileageAtReception === null
                ? ""
                : String(order.mileageAtReception),
        customerComplaint: order.customerComplaint ?? "",
        diagnostic: order.diagnostic ?? "",
        workPerformed: order.workPerformed ?? "",
        internalNotes: order.internalNotes ?? "",
    };
}

function nullableText(value: string) {
    const trimmed = value.trim();
    return trimmed || null;
}

export function WorkOrderInfoForm({
    order,
    onUpdated,
}: WorkOrderInfoFormProps) {
    const [values, setValues] = useState(() => valuesFromOrder(order));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const terminal = isTerminalWorkOrderStatus(order.status);

    function updateValue(field: keyof FormValues, value: string) {
        setValues((current) => ({ ...current, [field]: value }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving || terminal) {
            return;
        }

        setError(null);
        setSuccess(null);

        const mileageText = values.mileageAtReception.trim();
        const mileage = mileageText === "" ? null : Number(mileageText);

        if (
            mileage !== null &&
            (!Number.isInteger(mileage) || mileage < 0)
        ) {
            setError(
                "Le kilométrage d’entrée doit être un entier positif ou nul."
            );
            return;
        }

        setSaving(true);
        try {
            const updated = await workOrdersApi.updateWorkOrder(order.id, {
                assignedEmployeeId: order.assignedEmployeeId,
                mileageAtReception: mileage,
                customerComplaint: nullableText(values.customerComplaint),
                diagnostic: nullableText(values.diagnostic),
                workPerformed: nullableText(values.workPerformed),
                internalNotes: nullableText(values.internalNotes),
            });
            onUpdated(updated);
            setValues(valuesFromOrder(updated));
            setSuccess("Les informations atelier ont été enregistrées.");
        } catch (requestError) {
            setError(
                workOrderErrorMessage(
                    requestError,
                    "Impossible d’enregistrer le dossier atelier."
                )
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="card" aria-labelledby="work-order-info-title">
            <p className="section-title">Suivi atelier</p>
            <h2
                id="work-order-info-title"
                className="mt-2 text-lg font-semibold"
            >
                Informations d’intervention
            </h2>

            <div className="mt-4 surface-muted">
                <p className="section-title">Employé assigné</p>
                <p className="mt-2 text-sm font-medium">
                    {order.assignedEmployeeId
                        ? `Employé ${shortIdentifier(order.assignedEmployeeId)}`
                        : "Non assigné"}
                </p>
                <p className="mt-1 text-xs leading-5 text-faint">
                    L’affectation actuelle est conservée. Aucun annuaire staff
                    accessible n’est disponible pour la modifier ici.
                </p>
            </div>

            {terminal && (
                <div
                    className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm text-amber-200"
                    role="status"
                >
                    Un ordre livré ou annulé ne peut plus être modifié.
                </div>
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

            <form
                onSubmit={handleSubmit}
                className="mt-5 space-y-5"
                noValidate
            >
                <div>
                    <label
                        className="field-label"
                        htmlFor="work-order-mileage"
                    >
                        Kilométrage à la réception
                    </label>
                    <input
                        id="work-order-mileage"
                        className="input"
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={values.mileageAtReception}
                        onChange={(event) =>
                            updateValue(
                                "mileageAtReception",
                                event.target.value
                            )
                        }
                        disabled={terminal || saving}
                    />
                </div>

                <TextAreaField
                    id="work-order-complaint"
                    label="Demande du client"
                    value={values.customerComplaint}
                    onChange={(value) =>
                        updateValue("customerComplaint", value)
                    }
                    disabled={terminal || saving}
                />
                <TextAreaField
                    id="work-order-diagnostic"
                    label="Diagnostic"
                    value={values.diagnostic}
                    onChange={(value) => updateValue("diagnostic", value)}
                    disabled={terminal || saving}
                />
                <TextAreaField
                    id="work-order-work-performed"
                    label="Travaux effectués"
                    value={values.workPerformed}
                    onChange={(value) => updateValue("workPerformed", value)}
                    disabled={terminal || saving}
                />
                <TextAreaField
                    id="work-order-internal-notes"
                    label="Notes internes"
                    value={values.internalNotes}
                    onChange={(value) => updateValue("internalNotes", value)}
                    disabled={terminal || saving}
                />

                <button
                    className="btn-primary"
                    type="submit"
                    disabled={terminal || saving}
                >
                    {saving ? "Enregistrement..." : "Enregistrer le dossier"}
                </button>
            </form>
        </section>
    );
}

function TextAreaField({
    id,
    label,
    value,
    onChange,
    disabled,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
}) {
    return (
        <div>
            <label className="field-label" htmlFor={id}>
                {label}
            </label>
            <textarea
                id={id}
                className="input min-h-28 resize-y"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
            />
        </div>
    );
}
