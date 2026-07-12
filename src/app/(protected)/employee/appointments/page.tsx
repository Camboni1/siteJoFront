"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isStaff } from "@/features/auth/lib/roles";
import * as appointmentsApi from "@/features/appointments/api/appointments-api";
import type {
    Appointment,
    AppointmentStatus,
} from "@/features/appointments/types/appointment.types";
import { AppointmentStatusBadge } from "@/features/appointments/components/appointment-status-badge";
import { APPOINTMENT_STATUS_LABELS } from "@/features/appointments/lib/appointment-status";
import { formatDateTime, formatTime } from "@/lib/format";

const ALL_STATUSES = Object.keys(
    APPOINTMENT_STATUS_LABELS
) as AppointmentStatus[];

export default function EmployeeAppointmentsPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loadingAppointments, setLoadingAppointments] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "">(
        ""
    );
    const [dateFilter, setDateFilter] = useState("");

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
        if (!user || !isStaff(user)) {
            return;
        }

        appointmentsApi
            .getAllAppointments()
            .then(setAppointments)
            .catch((error) =>
                setError(
                    error instanceof Error
                        ? error.message
                        : "Impossible de charger les rendez-vous"
                )
            )
            .finally(() => setLoadingAppointments(false));
    }, [user]);

    if (loading || !user || !isStaff(user)) {
        return (
            <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
                <p className="text-neutral-400">Chargement...</p>
            </main>
        );
    }

    const filtered = appointments.filter((appointment) => {
        if (statusFilter && appointment.status !== statusFilter) {
            return false;
        }

        if (dateFilter && !appointment.startAt.startsWith(dateFilter)) {
            return false;
        }

        return true;
    });

    return (
        <main className="min-h-screen bg-neutral-950 text-white">
            <header className="border-b border-white/10 bg-neutral-900">
                <div className="mx-auto max-w-6xl px-6 py-5">
                    <Link
                        href="/dashboard"
                        className="text-sm text-neutral-400 transition hover:text-white"
                    >
                        ← Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold">
                        Rendez-vous du garage
                    </h1>
                </div>
            </header>

            <section className="mx-auto max-w-6xl space-y-6 px-6 py-8">
                <div className="flex flex-wrap gap-4">
                    <div>
                        <label className="mb-2 block text-sm text-neutral-300">
                            Statut
                        </label>
                        <select
                            className="rounded-xl border border-white/10 bg-neutral-900 px-4 py-2.5 text-white outline-none transition focus:border-white/30"
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target.value as
                                        | AppointmentStatus
                                        | ""
                                )
                            }
                        >
                            <option value="">Tous les statuts</option>
                            {ALL_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                    {APPOINTMENT_STATUS_LABELS[status]}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-neutral-300">
                            Date
                        </label>
                        <input
                            type="date"
                            className="rounded-xl border border-white/10 bg-neutral-900 px-4 py-2.5 text-white outline-none transition focus:border-white/30"
                            value={dateFilter}
                            onChange={(event) =>
                                setDateFilter(event.target.value)
                            }
                        />
                    </div>

                    {(statusFilter || dateFilter) && (
                        <button
                            onClick={() => {
                                setStatusFilter("");
                                setDateFilter("");
                            }}
                            className="self-end rounded-xl border border-white/10 px-4 py-2.5 text-sm text-neutral-300 transition hover:bg-white/5"
                        >
                            Réinitialiser
                        </button>
                    )}
                </div>

                {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                {loadingAppointments ? (
                    <p className="text-neutral-400">
                        Chargement des rendez-vous...
                    </p>
                ) : filtered.length === 0 ? (
                    <p className="text-neutral-400">
                        Aucun rendez-vous ne correspond aux filtres.
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-neutral-900">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-white/10 text-neutral-400">
                                <tr>
                                    <th className="px-6 py-4 font-medium">
                                        Date
                                    </th>
                                    <th className="px-6 py-4 font-medium">
                                        Client
                                    </th>
                                    <th className="px-6 py-4 font-medium">
                                        Service
                                    </th>
                                    <th className="px-6 py-4 font-medium">
                                        Véhicule
                                    </th>
                                    <th className="px-6 py-4 font-medium">
                                        Statut
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((appointment) => (
                                    <tr
                                        key={appointment.id}
                                        onClick={() =>
                                            router.push(
                                                `/employee/appointments/${appointment.id}`
                                            )
                                        }
                                        className="cursor-pointer border-b border-white/5 transition last:border-b-0 hover:bg-white/5"
                                    >
                                        <td className="px-6 py-4">
                                            {formatDateTime(
                                                appointment.startAt
                                            )}{" "}
                                            → {formatTime(appointment.endAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {appointment.customerFirstName}{" "}
                                            {appointment.customerLastName}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-300">
                                            {appointment.serviceName ?? "—"}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-300">
                                            {[
                                                appointment.vehicleBrand,
                                                appointment.vehicleModel,
                                            ]
                                                .filter(Boolean)
                                                .join(" ") || "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <AppointmentStatusBadge
                                                status={appointment.status}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
