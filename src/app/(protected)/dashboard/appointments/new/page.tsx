"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import * as appointmentsApi from "@/features/appointments/api/appointments-api";
import * as garageServicesApi from "@/features/garage-services/api/garage-services-api";
import type {
    Availability,
    AvailabilitySlot,
} from "@/features/appointments/types/appointment.types";
import type { GarageService } from "@/features/garage-services/types/garage-service.types";
import { formatDuration, formatTime } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingScreen } from "@/components/ui/loading-screen";

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
            .getAvailability(date, serviceId || undefined)
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
    }, [user, date, serviceId]);

    async function refreshAvailability() {
        try {
            const result = await appointmentsApi.getAvailability(
                date,
                serviceId || undefined
            );
            setAvailability(result);
        } catch {
            // on garde les créneaux affichés
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selectedSlot) {
            setError("Choisissez un créneau disponible");
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
        return <LoadingScreen />;
    }

    if (!user) {
        return null;
    }

    const currentAvailability =
        availability &&
        availability.date === date &&
        availability.serviceId === (serviceId || null)
            ? availability
            : null;
    const slots = currentAvailability?.slots ?? null;
    const selectedService = services.find(
        (service) => service.id === serviceId
    );

    return (
        <main className="flex-1">
            <PageHeader
                title="Nouveau rendez-vous"
                backHref="/dashboard/appointments"
                backLabel="Mes rendez-vous"
            />

            <section className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-10">
                <div className="mb-8">
                    <p className="eyebrow">Demande d’intervention</p>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                        Indiquez la prestation souhaitée, choisissez un créneau
                        et complétez les informations du véhicule.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="card">
                        <p className="section-title">Étape 01</p>
                        <h2 className="mt-2 text-lg font-semibold">Prestation</h2>

                        <div className="mt-5">
                            <label className="field-label">
                                Service
                            </label>
                            <select
                                className="input"
                                value={serviceId}
                                onChange={(event) => {
                                    setServiceId(event.target.value);
                                    setSelectedSlot(null);
                                    setSlotsError(null);
                                }}
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
                                        {` · ${formatDuration(service.durationMinutes)}`}
                                    </option>
                                ))}
                            </select>

                            {selectedService && (
                                <div className="surface-muted mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                                    <span className="text-muted">
                                        Durée estimée
                                    </span>
                                    <span className="font-mono text-xs font-semibold text-accent">
                                        {formatDuration(
                                            selectedService.durationMinutes
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <p className="section-title">Étape 02</p>
                        <h2 className="mt-2 text-lg font-semibold">
                            Date et créneau
                        </h2>

                        <div className="mt-5">
                            <label className="field-label">
                                Date
                            </label>
                            <input
                                type="date"
                                className="input"
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
                            {currentAvailability && (
                                <p className="mb-3 text-xs text-muted">
                                    Les horaires proposés réservent{" "}
                                    <span className="font-medium text-ink">
                                        {formatDuration(
                                            currentAvailability.durationMinutes
                                        )}
                                    </span>{" "}
                                    dans le planning de l’atelier.
                                </p>
                            )}

                            {slotsError ? (
                                <p className="text-sm text-red-300">
                                    {slotsError}
                                </p>
                            ) : !slots ? (
                                <p className="text-sm text-muted">
                                    Chargement des créneaux...
                                </p>
                            ) : slots.length === 0 ? (
                                <p className="text-sm text-muted">
                                    Le garage est fermé ce jour-là. Choisissez une
                                    autre date.
                                </p>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
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
                                                className={`rounded-lg border px-3 py-2.5 font-mono text-xs transition ${
                                                    selected
                                                        ? "border-accent bg-accent font-semibold text-[#201b15] shadow-[0_6px_18px_rgba(232,160,75,0.14)]"
                                                        : slot.available
                                                          ? "border-line bg-surface-soft text-ink hover:border-accent/50 hover:text-accent"
                                                          : "cursor-not-allowed border-line/60 bg-surface-soft/50 text-faint line-through opacity-50"
                                                }`}
                                            >
                                                <span className="block">
                                                    {formatTime(slot.startAt)}
                                                </span>
                                                <span
                                                    className={`mt-0.5 block text-[0.6rem] ${
                                                        selected
                                                            ? "text-[#201b15]/70"
                                                            : "text-faint"
                                                    }`}
                                                >
                                                    → {formatTime(slot.endAt)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <p className="section-title">Étape 03</p>
                        <h2 className="mt-2 text-lg font-semibold">
                            Vos informations
                        </h2>

                        <div className="mt-5 space-y-4">
                            <div>
                                <label className="field-label">
                                    Téléphone
                                </label>
                                <input
                                    type="tel"
                                    className="input"
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
                                    <label className="field-label">
                                        Marque du véhicule
                                    </label>
                                    <input
                                        className="input"
                                        value={vehicleBrand}
                                        onChange={(event) =>
                                            setVehicleBrand(event.target.value)
                                        }
                                        placeholder="Volkswagen"
                                        maxLength={100}
                                    />
                                </div>

                                <div>
                                    <label className="field-label">
                                        Modèle
                                    </label>
                                    <input
                                        className="input"
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
                                <label className="field-label">
                                    Plaque d&apos;immatriculation
                                </label>
                                <input
                                    className="input font-mono uppercase"
                                    value={licensePlate}
                                    onChange={(event) =>
                                        setLicensePlate(event.target.value)
                                    }
                                    placeholder="1-ABC-123"
                                    maxLength={30}
                                />
                            </div>

                            <div>
                                <label className="field-label">
                                    Message (facultatif)
                                </label>
                                <textarea
                                    className="input min-h-28 resize-y"
                                    value={message}
                                    onChange={(event) =>
                                        setMessage(event.target.value)
                                    }
                                    placeholder="Décrivez votre problème ou votre demande..."
                                />
                            </div>
                        </div>
                    </div>

                    {error && <div className="alert-error">{error}</div>}

                    <button
                        type="submit"
                        disabled={submitting || !selectedSlot}
                        className="btn-primary w-full py-3"
                    >
                        {submitting
                            ? "Envoi de la demande..."
                            : "Demander ce rendez-vous"}
                        {!submitting && <span aria-hidden>→</span>}
                    </button>
                </form>
            </section>
        </main>
    );
}
