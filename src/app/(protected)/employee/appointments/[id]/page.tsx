"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isStaff } from "@/features/auth/lib/roles";
import * as appointmentsApi from "@/features/appointments/api/appointments-api";
import type {
    Appointment,
    AppointmentStatus,
} from "@/features/appointments/types/appointment.types";
import { AppointmentStatusBadge } from "@/features/appointments/components/appointment-status-badge";
import { formatDateTime, formatTime } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingScreen } from "@/components/ui/loading-screen";

const ACTIONS_BY_STATUS: Partial<
    Record<
        AppointmentStatus,
        { label: string; target: AppointmentStatus; destructive?: boolean }[]
    >
> = {
    PENDING: [
        { label: "Confirmer", target: "CONFIRMED" },
        { label: "Annuler", target: "CANCELLED", destructive: true },
    ],
    CONFIRMED: [
        { label: "Marquer terminé", target: "COMPLETED" },
        { label: "Marquer absent", target: "NO_SHOW" },
        { label: "Annuler", target: "CANCELLED", destructive: true },
    ],
};

export default function EmployeeAppointmentDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { user, loading } = useAuth();

    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [loadingAppointment, setLoadingAppointment] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!user) {
            router.push("/login");
        } else if (!isStaff(user)) {
            router.push("/dashboard");
        }
    }, [loading, user, router]);

    useEffect(() => {
        if (!user || !isStaff(user) || !params.id) {
            return;
        }

        appointmentsApi
            .getAppointment(params.id)
            .then(setAppointment)
            .catch((error) =>
                setError(
                    error instanceof Error
                        ? error.message
                        : "Rendez-vous introuvable"
                )
            )
            .finally(() => setLoadingAppointment(false));
    }, [user, params.id]);

    async function handleStatusChange(target: AppointmentStatus) {
        if (!appointment) {
            return;
        }

        setError(null);
        setUpdating(true);

        try {
            const updated = await appointmentsApi.updateAppointmentStatus(
                appointment.id,
                target
            );

            setAppointment(updated);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Impossible de modifier le statut"
            );
        } finally {
            setUpdating(false);
        }
    }

    if (loading || !user || !isStaff(user)) {
        return <LoadingScreen />;
    }

    const actions = appointment
        ? (ACTIONS_BY_STATUS[appointment.status] ?? [])
        : [];

    return (
        <main className="flex-1">
            <PageHeader
                title="Fiche rendez-vous"
                backHref="/employee/appointments"
                backLabel="Planning du garage"
            />

            <section className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-6 sm:py-10">
                {error && <div className="alert-error">{error}</div>}

                {loadingAppointment ? (
                    <div className="empty-state">Chargement...</div>
                ) : !appointment ? (
                    <div className="empty-state">
                        Ce rendez-vous est introuvable.
                    </div>
                ) : (
                    <>
                        <div className="card relative overflow-hidden">
                            <div className="absolute top-0 right-0 h-40 w-40 translate-x-1/3 -translate-y-1/2 rounded-full bg-accent/8 blur-3xl" />
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="relative">
                                    <p className="eyebrow">Intervention</p>
                                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                                        {appointment.serviceName ??
                                            "Service non précisé"}
                                    </p>
                                    <p className="mt-2 font-mono text-xs text-muted">
                                        {formatDateTime(appointment.startAt)} →{" "}
                                        {formatTime(appointment.endAt)}
                                    </p>
                                </div>

                                <AppointmentStatusBadge
                                    status={appointment.status}
                                />
                            </div>

                            {actions.length > 0 && (
                                <div className="mt-6 flex flex-wrap gap-3">
                                    {actions.map((action) => (
                                        <button
                                            key={action.target}
                                            onClick={() =>
                                                handleStatusChange(
                                                    action.target
                                                )
                                            }
                                            disabled={updating}
                                            className={
                                                action.destructive
                                                    ? "btn-danger"
                                                    : "btn-primary"
                                            }
                                        >
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="card">
                            <p className="section-title">Coordonnées</p>
                            <h2 className="mt-2 text-lg font-semibold">Client</h2>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <InfoField
                                    label="Nom"
                                    value={`${appointment.customerFirstName} ${appointment.customerLastName}`}
                                />
                                <InfoField
                                    label="Téléphone"
                                    value={appointment.customerPhone}
                                />
                                <InfoField
                                    label="Email"
                                    value={appointment.customerEmail}
                                />
                            </div>
                        </div>

                        <div className="card">
                            <p className="section-title">Dossier automobile</p>
                            <h2 className="mt-2 text-lg font-semibold">Véhicule</h2>

                            <div className="mt-4 grid gap-4 sm:grid-cols-3">
                                <InfoField
                                    label="Marque"
                                    value={appointment.vehicleBrand}
                                />
                                <InfoField
                                    label="Modèle"
                                    value={appointment.vehicleModel}
                                />
                                <InfoField
                                    label="Plaque"
                                    value={appointment.licensePlate}
                                />
                            </div>
                        </div>

                        {appointment.message && (
                            <div className="card">
                                <p className="section-title">Note</p>
                                <h2 className="mt-2 text-lg font-semibold">
                                    Message du client
                                </h2>
                                <p className="mt-4 whitespace-pre-line border-l-2 border-accent/40 pl-4 text-sm leading-6 text-muted">
                                    {appointment.message}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </section>
        </main>
    );
}

function InfoField({
    label,
    value,
}: {
    label: string;
    value: string | null | undefined;
}) {
    return (
        <div className="surface-muted">
            <p className="section-title">{label}</p>
            <p className="mt-2 text-sm font-medium">{value || "—"}</p>
        </div>
    );
}
