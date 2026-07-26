"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Appointment } from "@/features/appointments/types/appointment.types";
import * as workOrdersApi from "@/features/work-orders/api/work-orders-api";
import { workOrderErrorMessage } from "@/features/work-orders/lib/work-order";

type CreateWorkOrderFromAppointmentProps = {
    appointment: Appointment;
};

const DUPLICATE_MESSAGE =
    "Un ordre de réparation existe déjà pour ce rendez-vous";

function decimalPlaces(value: string) {
    const normalized = value.trim().replace(",", ".");
    return normalized.split(".")[1]?.length ?? 0;
}

function isPlainDecimal(value: string) {
    return /^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(value.trim());
}

function nullableText(value: string) {
    const trimmed = value.trim();
    return trimmed || null;
}

export function CreateWorkOrderFromAppointment({
    appointment,
}: CreateWorkOrderFromAppointmentProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [mileage, setMileage] = useState("");
    const [internalNotes, setInternalNotes] = useState("");
    const [vatRate, setVatRate] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [duplicate, setDuplicate] = useState(false);

    if (!appointment.customerVehicleId) {
        return (
            <section className="card" aria-labelledby="work-order-create-title">
                <p className="section-title">Dossier atelier</p>
                <h2
                    id="work-order-create-title"
                    className="mt-2 text-lg font-semibold"
                >
                    Ordre de réparation
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                    Ce rendez-vous utilise une saisie de véhicule libre.
                    Associez d’abord un véhicule client pour pouvoir ouvrir un
                    dossier atelier.
                </p>
            </section>
        );
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (submitting) {
            return;
        }

        setError(null);
        setDuplicate(false);

        const mileageValue =
            mileage.trim() === "" ? null : Number(mileage.trim());
        if (
            mileageValue !== null &&
            (!Number.isInteger(mileageValue) || mileageValue < 0)
        ) {
            setError(
                "Le kilométrage à la réception doit être un entier positif ou nul."
            );
            return;
        }

        const normalizedVat = vatRate.trim().replace(",", ".");
        const vatValue = normalizedVat === "" ? null : Number(normalizedVat);
        if (
            vatValue !== null &&
            (!isPlainDecimal(vatRate) ||
                !Number.isFinite(vatValue) ||
                vatValue < 0 ||
                vatValue > 100 ||
                decimalPlaces(vatRate) > 2)
        ) {
            setError(
                "Le taux de TVA doit être compris entre 0 et 100 et comporter au maximum 2 décimales."
            );
            return;
        }

        setSubmitting(true);
        try {
            const created = await workOrdersApi.createWorkOrderFromAppointment(
                appointment.id,
                {
                    assignedEmployeeId: null,
                    mileageAtReception: mileageValue,
                    internalNotes: nullableText(internalNotes),
                    initialServiceLineVatRate: vatValue,
                }
            );
            router.push(`/employee/work-orders/${created.id}`);
        } catch (requestError) {
            const message = workOrderErrorMessage(
                requestError,
                "Impossible de créer le dossier atelier."
            );
            setError(message);
            setDuplicate(message === DUPLICATE_MESSAGE);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className="card" aria-labelledby="work-order-create-title">
            <p className="section-title">Dossier atelier</p>
            <h2
                id="work-order-create-title"
                className="mt-2 text-lg font-semibold"
            >
                Ordre de réparation
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
                Ouvrez le suivi atelier à partir du véhicule enregistré de ce
                rendez-vous.
            </p>

            {!open ? (
                <button
                    type="button"
                    className="btn-primary mt-5"
                    onClick={() => setOpen(true)}
                >
                    Ouvrir un dossier atelier
                </button>
            ) : (
                <div
                    className="mt-5 rounded-xl border border-line bg-surface-soft p-4"
                    role="dialog"
                    aria-labelledby="create-work-order-dialog-title"
                >
                    <h3
                        id="create-work-order-dialog-title"
                        className="font-semibold"
                    >
                        Nouveau dossier atelier
                    </h3>

                    {error && (
                        <div className="alert-error mt-4" role="alert">
                            {error}
                            {duplicate && (
                                <p className="mt-2">
                                    <Link
                                        href="/employee/work-orders"
                                        className="text-link"
                                    >
                                        Consulter les ordres de réparation
                                    </Link>
                                </p>
                            )}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="mt-4 space-y-4"
                        noValidate
                    >
                        <div>
                            <label
                                className="field-label"
                                htmlFor="create-work-order-mileage"
                            >
                                Kilométrage à la réception (facultatif)
                            </label>
                            <input
                                id="create-work-order-mileage"
                                className="input"
                                type="number"
                                min="0"
                                step="1"
                                inputMode="numeric"
                                value={mileage}
                                onChange={(event) =>
                                    setMileage(event.target.value)
                                }
                                disabled={submitting}
                            />
                        </div>

                        <div>
                            <label
                                className="field-label"
                                htmlFor="create-work-order-notes"
                            >
                                Notes internes (facultatives)
                            </label>
                            <textarea
                                id="create-work-order-notes"
                                className="input min-h-24 resize-y"
                                value={internalNotes}
                                onChange={(event) =>
                                    setInternalNotes(event.target.value)
                                }
                                disabled={submitting}
                            />
                        </div>

                        <div>
                            <label
                                className="field-label"
                                htmlFor="create-work-order-vat-rate"
                            >
                                TVA de la ligne initiale (facultative)
                            </label>
                            <input
                                id="create-work-order-vat-rate"
                                className="input"
                                inputMode="decimal"
                                value={vatRate}
                                onChange={(event) =>
                                    setVatRate(event.target.value)
                                }
                                disabled={submitting}
                                placeholder="Aucun taux par défaut"
                            />
                            <p className="mt-2 text-xs leading-5 text-faint">
                                Laissez vide pour ne pas créer de première
                                ligne.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={submitting}
                            >
                                {submitting
                                    ? "Création..."
                                    : "Créer le dossier"}
                            </button>
                            <button
                                type="button"
                                className="btn-ghost"
                                disabled={submitting}
                                onClick={() => {
                                    setOpen(false);
                                    setError(null);
                                    setDuplicate(false);
                                }}
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </section>
    );
}
