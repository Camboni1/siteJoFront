import Link from "next/link";
import type { PublicVehicleResponse } from "@/features/vehicles/types/vehicle.types";
import { VehicleImage } from "@/features/vehicles/components/vehicle-image";
import { VehicleStatusBadge } from "@/features/vehicles/components/vehicle-status-badge";
import { formatMileage, formatPrice } from "@/lib/format";

export function VehicleCard({
    vehicle,
    headingLevel = "h2",
}: {
    vehicle: PublicVehicleResponse;
    headingLevel?: "h2" | "h3";
}) {
    const title =
        [vehicle.brand?.trim(), vehicle.model?.trim()]
            .filter(Boolean)
            .join(" ") || "Véhicule d’occasion";
    const mainImage = vehicle.images?.[0];
    const Heading = headingLevel;
    const mileage =
        vehicle.mileage != null && Number.isFinite(vehicle.mileage)
            ? formatMileage(vehicle.mileage)
            : "Kilométrage à préciser";
    const price =
        vehicle.price != null && Number.isFinite(vehicle.price)
            ? formatPrice(vehicle.price)
            : "Sur demande";

    return (
        <article
            className={`group h-full overflow-hidden rounded-2xl border bg-surface shadow-[0_18px_50px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:bg-surface-raised ${
                vehicle.highlighted ? "border-accent/55" : "border-line"
            }`}
        >
            <Link
                href={`/vehicles/${vehicle.id}`}
                className="flex h-full flex-col"
            >
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

                <div className="flex flex-1 flex-col p-5">
                    <p className="font-mono text-[0.65rem] tracking-[0.14em] text-accent uppercase">
                        {vehicle.year ?? "Année à préciser"}
                    </p>
                    <Heading className="mt-2 text-xl font-semibold tracking-tight">
                        {title}
                    </Heading>
                    {vehicle.version && (
                        <p className="mt-1 truncate text-sm text-muted">
                            {vehicle.version}
                        </p>
                    )}

                    <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-muted">
                        <span className="surface-muted p-2.5">
                            {mileage}
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

                    <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
                        <div>
                            <p className="text-xs text-faint">Prix</p>
                            <p className="mt-1 text-lg font-semibold text-accent">
                                {price}
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
