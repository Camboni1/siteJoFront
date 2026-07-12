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
                            : "Impossible de charger tes rendez-vous"
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
            "Veux-tu vraiment annuler ce rendez-vous ?"
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
        return (
            <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
                <p className="text-neutral-400">Chargement...</p>
            </main>
        );
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
        <main className="min-h-screen bg-neutral-950 text-white">
            <header className="border-b border-white/10 bg-neutral-900">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                    <div>
                        <Link
                            href="/dashboard"
                            className="text-sm text-neutral-400 transition hover:text-white"
                        >
                            ← Dashboard
                        </Link>
                        <h1 className="text-2xl font-bold">Mes rendez-vous</h1>
                    </div>

                    <Link
                        href="/dashboard/appointments/new"
                        className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
                    >
                        Nouveau rendez-vous
                    </Link>
                </div>
            </header>

            <section className="mx-auto max-w-6xl space-y-8 px-6 py-8">
                {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                {loadingAppointments ? (
                    <p className="text-neutral-400">
                        Chargement des rendez-vous...
                    </p>
                ) : (
                    <>
                        <div>
                            <h2 className="text-lg font-semibold">À venir</h2>

                            {upcoming.length === 0 ? (
                                <p className="mt-3 text-sm text-neutral-400">
                                    Aucun rendez-vous à venir.{" "}
                                    <Link
                                        href="/dashboard/appointments/new"
                                        className="text-white underline underline-offset-4"
                                    >
                                        Prendre un rendez-vous
                                    </Link>
                                </p>
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
                            <h2 className="text-lg font-semibold">Passés</h2>

                            {past.length === 0 ? (
                                <p className="mt-3 text-sm text-neutral-400">
                                    Aucun rendez-vous passé.
                                </p>
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
        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="font-semibold">
                        {appointment.serviceName ?? "Service non précisé"}
                    </p>
                    <p className="mt-1 text-sm text-neutral-400">
                        {formatDateTime(appointment.startAt)} →{" "}
                        {formatTime(appointment.endAt)}
                    </p>
                </div>

                <AppointmentStatusBadge status={appointment.status} />
            </div>

            {(vehicle || appointment.licensePlate) && (
                <p className="mt-4 text-sm text-neutral-300">
                    {vehicle}
                    {vehicle && appointment.licensePlate ? " · " : ""}
                    {appointment.licensePlate}
                </p>
            )}

            {appointment.message && (
                <p className="mt-2 text-sm text-neutral-400">
                    {appointment.message}
                </p>
            )}

            {canCancel && (
                <button
                    onClick={() => onCancel(appointment)}
                    disabled={cancelling}
                    className="mt-4 rounded-xl border border-red-500/30 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {cancelling ? "Annulation..." : "Annuler ce rendez-vous"}
                </button>
            )}
        </div>
    );
}
