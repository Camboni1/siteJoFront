"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { PageHeader } from "@/components/ui/page-header";
import * as appointmentsApi from "@/features/appointments/api/appointments-api";
import type { Appointment } from "@/features/appointments/types/appointment.types";
import * as customersApi from "@/features/customers/api/customers-api";
import type { Customer } from "@/features/customers/types/customer.types";
import type { CustomerVehicle } from "@/features/customer-vehicles/types/customer-vehicle.types";
import { useStaffGuard } from "@/features/vehicles/hooks/use-staff-guard";
import * as workOrdersApi from "@/features/work-orders/api/work-orders-api";
import { WorkOrderInfoForm } from "@/features/work-orders/components/work-order-info-form";
import { WorkOrderLinesEditor } from "@/features/work-orders/components/work-order-lines-editor";
import { WorkOrderStatusActions } from "@/features/work-orders/components/work-order-status-actions";
import { WorkOrderStatusBadge } from "@/features/work-orders/components/work-order-status-badge";
import {
    shortIdentifier,
    workOrderErrorMessage,
} from "@/features/work-orders/lib/work-order";
import type { WorkOrder } from "@/features/work-orders/types/work-order.types";
import { isApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

type RelatedData = {
    customer: Customer | null;
    vehicle: CustomerVehicle | null;
    appointment: Appointment | null;
};

const EMPTY_RELATED_DATA: RelatedData = {
    customer: null,
    vehicle: null,
    appointment: null,
};

export function WorkOrderDetail() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { loading, authorized } = useStaffGuard();
    const [order, setOrder] = useState<WorkOrder | null>(null);
    const [related, setRelated] =
        useState<RelatedData>(EMPTY_RELATED_DATA);
    const [loadingOrder, setLoadingOrder] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authorized || !params.id) {
            return;
        }

        let ignore = false;

        workOrdersApi
            .getWorkOrder(params.id)
            .then(async (loadedOrder) => {
                if (ignore) {
                    return;
                }

                setOrder(loadedOrder);
                setLoadingOrder(false);

                const [customerResult, vehicleResult, appointmentResult] =
                    await Promise.allSettled([
                        customersApi.getCustomer(loadedOrder.customerId),
                        workOrdersApi.getWorkOrderCustomerVehicle(
                            loadedOrder.customerVehicleId
                        ),
                        loadedOrder.appointmentId
                            ? appointmentsApi.getAppointment(
                                  loadedOrder.appointmentId
                              )
                            : Promise.resolve(null),
                    ]);

                if (!ignore) {
                    setRelated({
                        customer:
                            customerResult.status === "fulfilled"
                                ? customerResult.value
                                : null,
                        vehicle:
                            vehicleResult.status === "fulfilled"
                                ? vehicleResult.value
                                : null,
                        appointment:
                            appointmentResult.status === "fulfilled"
                                ? appointmentResult.value
                                : null,
                    });
                }
            })
            .catch((requestError) => {
                if (ignore) {
                    return;
                }

                if (isApiError(requestError, 401)) {
                    router.replace("/login");
                } else if (isApiError(requestError, 403)) {
                    router.replace("/dashboard");
                } else if (isApiError(requestError, 404)) {
                    setNotFound(true);
                    setOrder(null);
                } else {
                    setError(
                        workOrderErrorMessage(
                            requestError,
                            "Impossible de charger le dossier atelier."
                        )
                    );
                    setOrder(null);
                }
            })
            .finally(() => {
                if (!ignore) {
                    setLoadingOrder(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, [authorized, params.id, router]);

    if (loading || !authorized) {
        return <LoadingScreen />;
    }

    const customerName = related.customer
        ? `${related.customer.firstName} ${related.customer.lastName}`
        : order
          ? `Client ${shortIdentifier(order.customerId)}`
          : "Client indisponible";
    const vehicleLabel = related.vehicle
        ? `${related.vehicle.brand} ${related.vehicle.model} — ${
              related.vehicle.licensePlate ?? "plaque non renseignée"
          }`
        : order
          ? `Véhicule ${shortIdentifier(order.customerVehicleId)}`
          : "Véhicule indisponible";

    return (
        <main className="flex-1">
            <PageHeader
                title="Dossier atelier"
                backHref="/employee/work-orders"
                backLabel="Ordres de réparation"
            />

            <section className="mx-auto max-w-5xl space-y-6 px-5 py-8 sm:px-6 sm:py-10">
                {loadingOrder ? (
                    <div className="empty-state">
                        Chargement du dossier atelier...
                    </div>
                ) : notFound ? (
                    <div className="empty-state">
                        Cet ordre de réparation est introuvable.
                    </div>
                ) : error ? (
                    <div className="alert-error" role="alert">
                        {error}
                    </div>
                ) : order ? (
                    <>
                        <section className="card relative overflow-hidden">
                            <div className="absolute top-0 right-0 h-40 w-40 translate-x-1/3 -translate-y-1/2 rounded-full bg-accent/8 blur-3xl" />
                            <div className="relative flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="eyebrow">Ordre de réparation</p>
                                    <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                                        {vehicleLabel}
                                    </h1>
                                    <p className="mt-2 text-sm text-muted">
                                        {customerName}
                                    </p>
                                </div>
                                <WorkOrderStatusBadge status={order.status} />
                            </div>

                            <dl className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <HeaderField
                                    label="Ouvert le"
                                    value={formatDateTime(order.openedAt)}
                                />
                                <HeaderField
                                    label="Employé assigné"
                                    value={
                                        order.assignedEmployeeId
                                            ? `Employé ${shortIdentifier(
                                                  order.assignedEmployeeId
                                              )}`
                                            : "Non assigné"
                                    }
                                />
                                <HeaderField
                                    label="Client"
                                    value={customerName}
                                />
                                <div className="surface-muted">
                                    <dt className="section-title">
                                        Rendez-vous
                                    </dt>
                                    <dd className="mt-2 text-sm font-medium">
                                        {order.appointmentId ? (
                                            <>
                                                <Link
                                                    href={`/employee/appointments/${order.appointmentId}`}
                                                    className="text-link"
                                                >
                                                    Ouvrir le rendez-vous
                                                </Link>
                                                {related.appointment && (
                                                    <span className="mt-1 block text-xs leading-5 text-faint">
                                                        {related.appointment
                                                            .serviceName ??
                                                            "Service non précisé"}
                                                        {" · "}
                                                        {formatDateTime(
                                                            related.appointment
                                                                .startAt
                                                        )}
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            "Aucun rendez-vous lié"
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        </section>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <SummarySection
                                eyebrow="Réception"
                                title="Prise en charge"
                                fields={[
                                    {
                                        label: "Kilométrage d’entrée",
                                        value:
                                            order.mileageAtReception === null
                                                ? "—"
                                                : `${order.mileageAtReception.toLocaleString(
                                                      "fr-BE"
                                                  )} km`,
                                    },
                                    {
                                        label: "Demande du client",
                                        value: order.customerComplaint ?? "—",
                                    },
                                    {
                                        label: "Notes internes",
                                        value: order.internalNotes ?? "—",
                                    },
                                ]}
                            />
                            <SummarySection
                                eyebrow="Intervention"
                                title="Diagnostic et travaux"
                                fields={[
                                    {
                                        label: "Diagnostic",
                                        value: order.diagnostic ?? "—",
                                    },
                                    {
                                        label: "Travaux effectués",
                                        value: order.workPerformed ?? "—",
                                    },
                                ]}
                            />
                        </div>

                        <section className="card">
                            <p className="section-title">Chronologie</p>
                            <h2 className="mt-2 text-lg font-semibold">
                                Dates du dossier
                            </h2>
                            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                <TimelineField
                                    label="Ouvert le"
                                    value={order.openedAt}
                                />
                                <TimelineField
                                    label="Commencé le"
                                    value={order.startedAt}
                                />
                                <TimelineField
                                    label="Terminé le"
                                    value={order.completedAt}
                                />
                                <TimelineField
                                    label="Livré le"
                                    value={order.deliveredAt}
                                />
                                <TimelineField
                                    label="Modifié le"
                                    value={order.updatedAt}
                                />
                            </dl>
                        </section>

                        <WorkOrderStatusActions
                            order={order}
                            onUpdated={setOrder}
                        />
                        <WorkOrderInfoForm
                            order={order}
                            onUpdated={setOrder}
                        />
                        <WorkOrderLinesEditor
                            order={order}
                            onUpdated={setOrder}
                        />
                    </>
                ) : null}
            </section>
        </main>
    );
}

function HeaderField({ label, value }: { label: string; value: string }) {
    return (
        <div className="surface-muted">
            <dt className="section-title">{label}</dt>
            <dd className="mt-2 text-sm font-medium">{value}</dd>
        </div>
    );
}

function SummarySection({
    eyebrow,
    title,
    fields,
}: {
    eyebrow: string;
    title: string;
    fields: { label: string; value: string }[];
}) {
    return (
        <section className="card">
            <p className="section-title">{eyebrow}</p>
            <h2 className="mt-2 text-lg font-semibold">{title}</h2>
            <dl className="mt-4 space-y-4">
                {fields.map((field) => (
                    <div key={field.label}>
                        <dt className="text-xs font-semibold text-faint">
                            {field.label}
                        </dt>
                        <dd className="mt-1 whitespace-pre-line text-sm leading-6 text-muted">
                            {field.value}
                        </dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}

function TimelineField({
    label,
    value,
}: {
    label: string;
    value: string | null;
}) {
    return (
        <div className="surface-muted">
            <dt className="section-title">{label}</dt>
            <dd className="mt-2 text-xs leading-5 text-muted">
                {value ? formatDateTime(value) : "—"}
            </dd>
        </div>
    );
}
