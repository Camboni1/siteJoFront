"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import * as appointmentsApi from "@/features/appointments/api/appointments-api";
import * as garageServicesApi from "@/features/garage-services/api/garage-services-api";
import type {
    Availability,
    AvailabilitySlot,
} from "@/features/appointments/types/appointment.types";
import type { GarageService } from "@/features/garage-services/types/garage-service.types";
import { formatTime } from "@/lib/format";

function toDateInputValue(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export default function NewAppointmentPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const [services, setServices] = useState<GarageService[]>([]);
    const [serviceId, setServiceId] = useState("");

    const [date, setDate] = useState(() => toDateInputValue(new Date()));
    const [availability, setAvailability] = useState<Availability | null>(
        null
    );
    const [slotsError, setSlotsError] = useState<string | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(
        null
    );

    const [phone, setPhone] = useState("");
    const [vehicleBrand, setVehicleBrand] = useState("");
    const [vehicleModel, setVehicleModel] = useState("");
    const [licensePlate, setLicensePlate] = useState("");
    const [message, setMessage] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [loading, user, router]);

    useEffect(() => {
        if (!user) {
            return;
        }

        garageServicesApi
            .getActiveServices()
            .then(setServices)
            .catch(() => setServices([]));
    }, [user]);

    useEffect(() => {
        if (!user || !date) {
            return;
        }

        let ignore = false;

        appointmentsApi
            .getAvailability(date)
            .then((result) => {
                if (!ignore) {
                    setAvailability(result);
                    setSlotsError(null);
                }
            })
            .catch((error) => {
                if (!ignore) {
                    setAvailability(null);
                    setSlotsError(
                        error instanceof Error
                            ? error.message
                            : "Impossible de charger les disponibilités"
                    );
                }
            });

        return () => {
            ignore = true;
        };
    }, [user, date]);

    async function refreshAvailability() {
        try {
            const result = await appointmentsApi.getAvailability(date);
            setAvailability(result);
        } catch {
            // on garde les créneaux affichés
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selectedSlot) {
            setError("Choisis un créneau disponible");
            return;
        }

        setError(null);
        setSubmitting(true);

        try {
            await appointmentsApi.createAppointment({
                serviceId: serviceId || null,
                customerPhone: phone,
                vehicleBrand: vehicleBrand || undefined,
                vehicleModel: vehicleModel || undefined,
                licensePlate: licensePlate || undefined,
                startAt: selectedSlot.startAt,
                endAt: selectedSlot.endAt,
                message: message || undefined,
            });

            router.push("/dashboard/appointments");
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Impossible de créer le rendez-vous"
            );

            setSelectedSlot(null);
            await refreshAvailability();
        } finally {
            setSubmitting(false);
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

    const slots =
        availability && availability.date === date ? availability.slots : null;

    return (
        <main className="min-h-screen bg-neutral-950 text-white">
            <header className="border-b border-white/10 bg-neutral-900">
                <div className="mx-auto max-w-3xl px-6 py-5">
                    <Link
                        href="/dashboard/appointments"
                        className="text-sm text-neutral-400 transition hover:text-white"
                    >
                        ← Mes rendez-vous
                    </Link>
                    <h1 className="text-2xl font-bold">Nouveau rendez-vous</h1>
                </div>
            </header>

            <section className="mx-auto max-w-3xl px-6 py-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
                        <h2 className="font-semibold">Prestation</h2>

                        <div className="mt-4">
                            <label className="mb-2 block text-sm text-neutral-300">
                                Service
                            </label>
                            <select
                                className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-white/30"
                                value={serviceId}
                                onChange={(event) =>
                                    setServiceId(event.target.value)
                                }
                            >
                                <option value="">
                                    Je ne sais pas / autre demande
                                </option>
                                {services.map((service) => (
                                    <option key={service.id} value={service.id}>
                                        {service.name}
                                        {service.startingPrice != null
                                            ? ` — à partir de ${service.startingPrice} €`
                                            : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
                        <h2 className="font-semibold">Date et créneau</h2>

                        <div className="mt-4">
                            <label className="mb-2 block text-sm text-neutral-300">
                                Date
                            </label>
                            <input
                                type="date"
                                className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-white/30"
                                value={date}
                                min={toDateInputValue(new Date())}
                                onChange={(event) => {
                                    setDate(event.target.value);
                                    setSelectedSlot(null);
                                    setSlotsError(null);
                                }}
                                required
                            />
                        </div>

                        <div className="mt-4">
                            {slotsError ? (
                                <p className="text-sm text-red-300">
                                    {slotsError}
                                </p>
                            ) : !slots ? (
                                <p className="text-sm text-neutral-400">
                                    Chargement des créneaux...
                                </p>
                            ) : slots.length === 0 ? (
                                <p className="text-sm text-neutral-400">
                                    Le garage est fermé ce jour-là. Choisis une
                                    autre date.
                                </p>
                            ) : (
                                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                                    {slots.map((slot) => {
                                        const selected =
                                            selectedSlot?.startAt ===
                                            slot.startAt;

                                        return (
                                            <button
                                                key={slot.startAt}
                                                type="button"
                                                disabled={!slot.available}
                                                onClick={() =>
                                                    setSelectedSlot(slot)
                                                }
                                                className={`rounded-xl border px-3 py-2 text-sm transition ${
                                                    selected
                                                        ? "border-white bg-white font-semibold text-neutral-950"
                                                        : slot.available
                                                          ? "border-white/10 bg-neutral-950 text-white hover:border-white/40"
                                                          : "cursor-not-allowed border-white/5 bg-neutral-950 text-neutral-600 line-through"
                                                }`}
                                            >
                                                {formatTime(slot.startAt)}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
                        <h2 className="font-semibold">Tes informations</h2>

                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="mb-2 block text-sm text-neutral-300">
                                    Téléphone
                                </label>
                                <input
                                    type="tel"
                                    className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-white/30"
                                    value={phone}
                                    onChange={(event) =>
                                        setPhone(event.target.value)
                                    }
                                    placeholder="+32 4xx xx xx xx"
                                    maxLength={30}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-2 block text-sm text-neutral-300">
                                        Marque du véhicule
                                    </label>
                                    <input
                                        className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-white/30"
                                        value={vehicleBrand}
                                        onChange={(event) =>
                                            setVehicleBrand(event.target.value)
                                        }
                                        placeholder="Volkswagen"
                                        maxLength={100}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm text-neutral-300">
                                        Modèle
                                    </label>
                                    <input
                                        className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-white/30"
                                        value={vehicleModel}
                                        onChange={(event) =>
                                            setVehicleModel(event.target.value)
                                        }
                                        placeholder="Golf"
                                        maxLength={100}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-neutral-300">
                                    Plaque d&apos;immatriculation
                                </label>
                                <input
                                    className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-white/30"
                                    value={licensePlate}
                                    onChange={(event) =>
                                        setLicensePlate(event.target.value)
                                    }
                                    placeholder="1-ABC-123"
                                    maxLength={30}
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-neutral-300">
                                    Message (facultatif)
                                </label>
                                <textarea
                                    className="min-h-24 w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-white/30"
                                    value={message}
                                    onChange={(event) =>
                                        setMessage(event.target.value)
                                    }
                                    placeholder="Décris ton problème ou ta demande..."
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting || !selectedSlot}
                        className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-neutral-950 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting
                            ? "Envoi de la demande..."
                            : "Demander ce rendez-vous"}
                    </button>
                </form>
            </section>
        </main>
    );
}
