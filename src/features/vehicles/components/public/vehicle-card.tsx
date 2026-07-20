import Link from "next/link";
import type { PublicVehicleResponse } from "@/features/vehicles/types/vehicle.types";
import { VehicleImage } from "@/features/vehicles/components/vehicle-image";
import { VehicleStatusBadge } from "@/features/vehicles/components/vehicle-status-badge";
import { formatMileage, formatPrice } from "@/lib/format";

export function VehicleCard({ vehicle }: { vehicle: PublicVehicleResponse }) {
    const title = `${vehicle.brand} ${vehicle.model}`;
    const mainImage = vehicle.images[0];

    return (
        <article
            className={`group overflow-hidden rounded-2xl border bg-surface shadow-[0_18px_50px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:bg-surface-raised ${
                vehicle.highlighted ? "border-accent/55" : "border-line"
            }`}
        >
            <Link href={`/vehicles/${vehicle.id}`} className="block">
                <div className="relative aspect-[16/10] overflow-hidden bg-surface-soft">
                    <VehicleImage
                        src={mainImage?.url}
                        alt={mainImage?.altText || title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                        <VehicleStatusBadge status={vehicle.status} />
                        {vehicle.highlighted && (
                            <span className="rounded-full border border-accent/35 bg-canvas/90 px-2.5 py-1 text-xs font-semibold text-accent backdrop-blur">
                                Sélection
                            </span>
                        )}
                    </div>
                </div>

                <div className="p-5">
                    <p className="font-mono text-[0.65rem] tracking-[0.14em] text-accent uppercase">
                        {vehicle.year ?? "Année à préciser"}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight">
                        {title}
                    </h2>
                    {vehicle.version && (
                        <p className="mt-1 truncate text-sm text-muted">
                            {vehicle.version}
                        </p>
                    )}

                    <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-muted">
                        <span className="surface-muted p-2.5">
                            {vehicle.mileage != null
                                ? formatMileage(vehicle.mileage)
                                : "Kilométrage à préciser"}
                        </span>
                        <span className="surface-muted p-2.5">
                            {vehicle.fuelType ?? "Carburant à préciser"}
                        </span>
                        <span className="surface-muted p-2.5">
                            {vehicle.gearbox ?? "Boîte à préciser"}
                        </span>
                        <span className="surface-muted p-2.5">
                            {vehicle.color ?? "Couleur à préciser"}
                        </span>
                    </div>

                    <div className="mt-5 flex items-end justify-between gap-3 border-t border-line pt-4">
                        <div>
                            <p className="text-xs text-faint">Prix</p>
                            <p className="mt-1 text-lg font-semibold text-accent">
                                {vehicle.price != null
                                    ? formatPrice(vehicle.price)
                                    : "Sur demande"}
                            </p>
                        </div>
                        <span className="text-sm font-semibold text-muted transition group-hover:text-accent">
                            Voir le véhicule →
                        </span>
                    </div>
                </div>
            </Link>
        </article>
    );
}
