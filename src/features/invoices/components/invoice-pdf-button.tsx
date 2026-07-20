"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isApiError } from "@/lib/api";

type InvoicePdfButtonProps = {
    onDownload: () => Promise<void>;
    className?: string;
};

export function InvoicePdfButton({
    onDownload,
    className,
}: InvoicePdfButtonProps) {
    const router = useRouter();
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleClick() {
        setError(null);
        setDownloading(true);

        try {
            await onDownload();
        } catch (error) {
            if (isApiError(error, 401)) {
                router.push("/login");
                return;
            }

            setError(
                error instanceof Error
                    ? error.message
                    : "Impossible de télécharger le PDF"
            );
        } finally {
            setDownloading(false);
        }
    }

    return (
        <div className={className}>
            <button
                type="button"
                className="btn-ghost"
                onClick={handleClick}
                disabled={downloading}
            >
                {downloading
                    ? "Génération du PDF..."
                    : "Télécharger le PDF"}
            </button>
            {error && (
                <p role="alert" className="mt-2 text-xs text-red-300">
                    {error}
                </p>
            )}
        </div>
    );
}
