"use client";

import { useState } from "react";
import * as workOrdersApi from "@/features/work-orders/api/work-orders-api";
import {
    availableWorkOrderTransitions,
    workOrderErrorMessage,
} from "@/features/work-orders/lib/work-order";
import type {
    WorkOrder,
    WorkOrderStatus,
} from "@/features/work-orders/types/work-order.types";

type WorkOrderStatusActionsProps = {
    order: WorkOrder;
    onUpdated: (order: WorkOrder) => void;
};

const CONFIRMATION_MESSAGES: Partial<Record<WorkOrderStatus, string>> = {
    CANCELLED:
        "Confirmer l’annulation de ce dossier ? Cette action rendra le dossier non modifiable.",
    DELIVERED:
        "Confirmer la livraison du véhicule ? Le dossier deviendra non modifiable.",
};

export function WorkOrderStatusActions({
    order,
    onUpdated,
}: WorkOrderStatusActionsProps) {
    const [pendingStatus, setPendingStatus] =
        useState<WorkOrderStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const transitions = availableWorkOrderTransitions(order.status);

    async function handleTransition(target: WorkOrderStatus) {
        if (pendingStatus) {
            return;
        }

        const confirmation = CONFIRMATION_MESSAGES[target];
        if (confirmation && !window.confirm(confirmation)) {
            return;
        }

        setPendingStatus(target);
        setError(null);
        setSuccess(null);

        try {
            const updated = await workOrdersApi.updateWorkOrderStatus(
                order.id,
                target
            );
            onUpdated(updated);
            setSuccess("Le statut du dossier a été mis à jour.");
        } catch (requestError) {
            setError(
                workOrderErrorMessage(
                    requestError,
                    "Impossible de modifier le statut."
                )
            );
        } finally {
            setPendingStatus(null);
        }
    }

    return (
        <section className="card" aria-labelledby="work-order-status-title">
            <p className="section-title">Cycle de vie</p>
            <h2
                id="work-order-status-title"
                className="mt-2 text-lg font-semibold"
            >
                Actions de statut
            </h2>

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

            {transitions.length === 0 ? (
                <p className="mt-4 text-sm leading-6 text-muted">
                    Aucune transition n’est disponible depuis ce statut.
                </p>
            ) : (
                <div className="mt-5 flex flex-wrap gap-3">
                    {transitions.map((transition) => (
                        <button
                            key={transition.target}
                            type="button"
                            className={
                                transition.destructive
                                    ? "btn-danger"
                                    : "btn-primary"
                            }
                            disabled={pendingStatus !== null}
                            onClick={() =>
                                handleTransition(transition.target)
                            }
                        >
                            {pendingStatus === transition.target
                                ? "Mise à jour..."
                                : transition.label}
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}
