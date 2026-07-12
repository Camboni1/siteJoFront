"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
        return (
            <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
                <p className="text-neutral-400">Chargement...</p>
            </main>
        );
    }

    const actions = appointment
        ? (ACTIONS_BY_STATUS[appointment.status] ?? [])
        : [];

    return (
        <main className="min-h-screen bg-neutral-950 text-white">
            <header className="border-b border-white/10 bg-neutral-900">
                <div className="mx-auto max-w-3xl px-6 py-5">
                    <Link
                        href="/employee/appointments"
                        className="text-sm text-neutral-400 transition hover:text-white"
                    >
                        ← Rendez-vous du garage
                    </Link>
                    <h1 className="text-2xl font-bold">Fiche rendez-vous</h1>
                </div>
            </header>

            <section className="mx-auto max-w-3xl space-y-6 px-6 py-8">
                {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                {loadingAppointment ? (
                    <p className="text-neutral-400">Chargement...</p>
                ) : !appointment ? (
                    <p className="text-neutral-400">
                        Ce rendez-vous est introuvable.
                    </p>
                ) : (
                    <>
                        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-xl font-semibold">
                                        {appointment.serviceName ??
                                            "Service non précisé"}
                                    </p>
                                    <p className="mt-1 text-neutral-400">
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
                                            className={`rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                                action.destructive
                                                    ? "border border-red-500/30 text-red-300 hover:bg-red-500/10"
                                                    : "bg-white text-neutral-950 hover:bg-neutral-200"
                                            }`}
                                        >
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
                            <h2 className="font-semibold">Client</h2>

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

                        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
                            <h2 className="font-semibold">Véhicule</h2>

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
                            <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
                                <h2 className="font-semibold">
                                    Message du client
                                </h2>
                                <p className="mt-3 whitespace-pre-line text-neutral-300">
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
        <div className="rounded-xl border border-white/10 bg-neutral-950 p-4">
            <p className="text-sm text-neutral-500">{label}</p>
            <p className="mt-1">{value || "—"}</p>
        </div>
    );
}
