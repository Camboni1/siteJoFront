"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import * as appointmentsApi from "@/features/appointments/api/appointments-api";
import type { Appointment } from "@/features/appointments/types/appointment.types";
import { AppointmentStatusBadge } from "@/features/appointments/components/appointment-status-badge";
import { isCancellable } from "@/features/appointments/lib/appointment-status";
import { formatDateTime, formatTime } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function MyAppointmentsPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loadingAppointments, setLoadingAppointments] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [loading, user, router]);

    useEffect(() => {
        if (!user) {
            return;
        }

        let ignore = false;

        appointmentsApi
            .getMyAppointments()
            .then((data) => {
                if (!ignore) {
                    setAppointments(data);
                }
            })
            .catch((error) => {
                if (!ignore) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Impossible de charger vos rendez-vous"
                    );
                }
            })
            .finally(() => {
                if (!ignore) {
                    setLoadingAppointments(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, [user]);

    async function handleCancel(appointment: Appointment) {
        const confirmed = window.confirm(
            "Voulez-vous vraiment annuler ce rendez-vous ?"
        );

        if (!confirmed) {
            return;
        }

        setError(null);
        setCancellingId(appointment.id);

        try {
            const cancelled = await appointmentsApi.cancelAppointment(
                appointment.id
            );

            setAppointments((current) =>
                current.map((item) =>
                    item.id === cancelled.id ? cancelled : item
                )
            );
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Impossible d'annuler ce rendez-vous"
            );
        } finally {
            setCancellingId(null);
        }
    }

    if (loading) {
        return <LoadingScreen />;
    }

    if (!user) {
        return null;
    }

    const now = new Date();

    const upcoming = appointments
        .filter((appointment) => new Date(appointment.endAt) >= now)
        .sort(
            (a, b) =>
                new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        );

    const past = appointments.filter(
        (appointment) => new Date(appointment.endAt) < now
    );

    return (
        <main className="flex-1">
            <PageHeader
                title="Mes rendez-vous"
                backHref="/dashboard"
                backLabel="Tableau de bord"
                action={
                    <Link
                        href="/dashboard/appointments/new"
                        className="btn-primary"
                    >
                        <span className="text-base leading-none" aria-hidden>
                            +
                        </span>
                        <span className="hidden sm:inline">Nouveau rendez-vous</span>
                        <span className="sm:hidden">Nouveau</span>
                    </Link>
                }
            />

            <section className="mx-auto max-w-6xl space-y-10 px-5 py-8 sm:px-6 sm:py-10">
                {error && <div className="alert-error">{error}</div>}

                {loadingAppointments ? (
                    <div className="empty-state">Chargement des rendez-vous...</div>
                ) : (
                    <>
                        <div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="eyebrow">Planning</p>
                                    <h2 className="mt-2 text-xl font-semibold tracking-tight">
                                        À venir
                                    </h2>
                                </div>
                                <span className="rounded-full border border-line bg-surface-soft px-3 py-1 font-mono text-xs text-muted">
                                    {String(upcoming.length).padStart(2, "0")}
                                </span>
                            </div>

                            {upcoming.length === 0 ? (
                                <div className="empty-state mt-4">
                                    Aucun rendez-vous à venir.{" "}
                                    <Link
                                        href="/dashboard/appointments/new"
                                        className="text-link"
                                    >
                                        Prendre un rendez-vous
                                    </Link>
                                </div>
                            ) : (
                                <div className="mt-4 space-y-4">
                                    {upcoming.map((appointment) => (
                                        <AppointmentCard
                                            key={appointment.id}
                                            appointment={appointment}
                                            onCancel={handleCancel}
                                            cancelling={
                                                cancellingId === appointment.id
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="section-title">Historique</p>
                                    <h2 className="mt-2 text-xl font-semibold tracking-tight">
                                        Passés
                                    </h2>
                                </div>
                                <span className="rounded-full border border-line bg-surface-soft px-3 py-1 font-mono text-xs text-muted">
                                    {String(past.length).padStart(2, "0")}
                                </span>
                            </div>

                            {past.length === 0 ? (
                                <div className="empty-state mt-4">
                                    Aucun rendez-vous passé.
                                </div>
                            ) : (
                                <div className="mt-4 space-y-4">
                                    {past.map((appointment) => (
                                        <AppointmentCard
                                            key={appointment.id}
                                            appointment={appointment}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </section>
        </main>
    );
}

function AppointmentCard({
    appointment,
    onCancel,
    cancelling,
}: {
    appointment: Appointment;
    onCancel?: (appointment: Appointment) => void;
    cancelling?: boolean;
}) {
    const vehicle = [appointment.vehicleBrand, appointment.vehicleModel]
        .filter(Boolean)
        .join(" ");

    const canCancel = onCancel && isCancellable(appointment.status);

    return (
        <article className="card">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="section-title">Intervention</p>
                    <p className="font-semibold">
                        {appointment.serviceName ?? "Service non précisé"}
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted">
                        {formatDateTime(appointment.startAt)} →{" "}
                        {formatTime(appointment.endAt)}
                    </p>
                </div>

                <AppointmentStatusBadge status={appointment.status} />
            </div>

            {(vehicle || appointment.licensePlate) && (
                <div className="surface-muted mt-5 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-muted">Véhicule</span>
                    <span className="font-medium">
                        {vehicle}
                        {vehicle && appointment.licensePlate ? " · " : ""}
                        {appointment.licensePlate}
                    </span>
                </div>
            )}

            {appointment.message && (
                <p className="mt-4 border-l-2 border-line pl-4 text-sm leading-6 text-muted">
                    {appointment.message}
                </p>
            )}

            {canCancel && (
                <button
                    onClick={() => onCancel(appointment)}
                    disabled={cancelling}
                    className="btn-danger mt-5"
                >
                    {cancelling ? "Annulation..." : "Annuler ce rendez-vous"}
                </button>
            )}
        </article>
    );
}
