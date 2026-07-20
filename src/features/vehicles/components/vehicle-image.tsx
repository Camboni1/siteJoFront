"use client";

import { useState } from "react";

type VehicleImageProps = {
    src?: string | null;
    alt: string;
    className?: string;
    eager?: boolean;
};

export function VehicleImage({
    src,
    alt,
    className = "h-full w-full object-cover",
    eager = false,
}: VehicleImageProps) {
    const [failedSource, setFailedSource] = useState<string | null>(null);
    const failed = Boolean(src && failedSource === src);

    if (!src || failed) {
        return (
            <div
                className={`grid place-items-center bg-surface-soft text-faint ${className}`}
                role="img"
                aria-label={`${alt} — image indisponible`}
            >
                <span className="font-mono text-xs tracking-[0.18em] uppercase">
                    Image indisponible
                </span>
            </div>
        );
    }

    return (
        // Les URL sont dynamiques et validées par le backend. Un img natif évite
        // d'ouvrir next/image à tous les domaines distants administrables.
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={alt}
            className={className}
            loading={eager ? "eager" : "lazy"}
            onError={() => setFailedSource(src)}
        />
    );
}
