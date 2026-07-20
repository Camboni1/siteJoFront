"use client";

import { useState } from "react";
import type { PublicVehicleImageResponse } from "@/features/vehicles/types/vehicle.types";
import { VehicleImage } from "@/features/vehicles/components/vehicle-image";

export function VehicleGallery({
    images,
    vehicleName,
}: {
    images: PublicVehicleImageResponse[];
    vehicleName: string;
}) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const safeIndex = selectedIndex < images.length ? selectedIndex : 0;
    const selected = images[safeIndex];

    return (
        <div className="space-y-3">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-surface">
                <VehicleImage
                    src={selected?.url}
                    alt={selected?.altText || vehicleName}
                    eager
                />
            </div>

            {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {images.map((image, index) => (
                        <button
                            type="button"
                            key={`${image.url}-${index}`}
                            onClick={() => setSelectedIndex(index)}
                            className={`aspect-[4/3] overflow-hidden rounded-lg border transition ${
                                safeIndex === index
                                    ? "border-accent ring-2 ring-accent/20"
                                    : "border-line hover:border-faint"
                            }`}
                            aria-label={`Afficher l'image ${index + 1}`}
                        >
                            <VehicleImage
                                src={image.url}
                                alt={image.altText || `${vehicleName}, vue ${index + 1}`}
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
