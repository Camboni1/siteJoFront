"use client";

import { useEffect, useState } from "react";
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
import { PageHeader } from "@/components/ui/page-header";
import { LoadingScreen } from "@/components/ui/loading-screen";

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
        return <LoadingScreen />;
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
        <main className="flex-1">
            <PageHeader
                title="Planning du garage"
                backHref="/dashboard"
                backLabel="Tableau de bord"
            />

            <section className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-6 sm:py-10">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="eyebrow">Gestion atelier</p>
                        <h2 className="mt-2 text-xl font-semibold tracking-tight">
                            Tous les rendez-vous
                        </h2>
                    </div>
                    <span className="w-fit rounded-full border border-line bg-surface-soft px-3 py-1 font-mono text-xs text-muted">
                        {String(filtered.length).padStart(2, "0")} résultat
                        {filtered.length !== 1 ? "s" : ""}
                    </span>
                </div>

                <div className="card flex flex-wrap items-end gap-4 p-4">
                    <div className="min-w-44 flex-1 sm:flex-none">
                        <label className="field-label">
                            Statut
                        </label>
                        <select
                            className="input py-2.5"
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

                    <div className="min-w-44 flex-1 sm:flex-none">
                        <label className="field-label">
                            Date
                        </label>
                        <input
                            type="date"
                            className="input py-2.5"
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
                            className="btn-ghost"
                        >
                            Réinitialiser
                        </button>
                    )}
                </div>

                {error && <div className="alert-error">{error}</div>}

                {loadingAppointments ? (
                    <div className="empty-state">Chargement des rendez-vous...</div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        Aucun rendez-vous ne correspond aux filtres.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-line bg-surface-soft font-mono text-[0.65rem] tracking-wider text-faint uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">
                                        Date
                                    </th>
                                    <th className="px-6 py-4 font-semibold">
                                        Client
                                    </th>
                                    <th className="px-6 py-4 font-semibold">
                                        Service
                                    </th>
                                    <th className="px-6 py-4 font-semibold">
                                        Véhicule
                                    </th>
                                    <th className="px-6 py-4 font-semibold">
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
                                        className="cursor-pointer border-b border-line/70 transition last:border-b-0 hover:bg-surface-raised"
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
                                        <td className="px-6 py-4 text-muted">
                                            {appointment.serviceName ?? "—"}
                                        </td>
                                        <td className="px-6 py-4 text-muted">
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
