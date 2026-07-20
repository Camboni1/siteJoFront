"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import * as vehiclesApi from "@/features/vehicles/api/vehicles-api";
import type {
    VehicleImageRequest,
    VehicleImageResponse,
} from "@/features/vehicles/types/vehicle.types";
import { VehicleImage } from "@/features/vehicles/components/vehicle-image";
import { isApiError } from "@/lib/api";

function sortImages(images: VehicleImageResponse[]) {
    return [...images].sort(
        (left, right) =>
            left.displayOrder - right.displayOrder ||
            left.id.localeCompare(right.id)
    );
}

function imageRequest(url: string, altText: string, order: string): VehicleImageRequest {
    return {
        url: url.trim(),
        altText: altText.trim() || null,
        displayOrder: order.trim() ? Number(order) : null,
    };
}

function ImageEditor({
    vehicleId,
    image,
    primary,
    onUpdated,
    onDeleted,
}: {
    vehicleId: string;
    image: VehicleImageResponse;
    primary: boolean;
    onUpdated: (image: VehicleImageResponse) => void;
    onDeleted: (id: string) => void;
}) {
    const router = useRouter();
    const [url, setUrl] = useState(image.url);
    const [altText, setAltText] = useState(image.altText ?? "");
    const [order, setOrder] = useState(String(image.displayOrder));
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleApiError(requestError: unknown, fallback: string) {
        if (isApiError(requestError, 401)) {
            router.push("/login");
            return;
        }
        if (isApiError(requestError, 403)) {
            router.push("/dashboard");
            return;
        }
        setError(requestError instanceof Error ? requestError.message : fallback);
    }

    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const updated = await vehiclesApi.updateVehicleImage(
                vehicleId,
                image.id,
                imageRequest(url, altText, order)
            );
            onUpdated(updated);
        } catch (requestError) {
            handleApiError(requestError, "Impossible de modifier l'image");
        } finally {
            setSaving(false);
        }
    }

    async function remove() {
        if (!window.confirm("Supprimer définitivement cette image ?")) {
            return;
        }

        setDeleting(true);
        setError(null);
        try {
            await vehiclesApi.deleteVehicleImage(vehicleId, image.id);
            onDeleted(image.id);
        } catch (requestError) {
            handleApiError(requestError, "Impossible de supprimer l'image");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <form onSubmit={save} className="surface-muted grid gap-4 lg:grid-cols-[12rem_1fr]" noValidate>
            <div>
                <div className="aspect-[4/3] overflow-hidden rounded-lg border border-line">
                    <VehicleImage src={image.url} alt={image.altText || "Image du véhicule"} />
                </div>
                {primary && (
                    <span className="mt-2 inline-flex rounded-full border border-accent/30 bg-accent/8 px-2.5 py-1 text-xs font-semibold text-accent">
                        Image principale
                    </span>
                )}
            </div>

            <div className="space-y-3">
                <label className="block">
                    <span className="field-label">URL HTTP(S)</span>
                    <input
                        type="url"
                        className="input py-2.5"
                        value={url}
                        maxLength={500}
                        onChange={(event) => setUrl(event.target.value)}
                    />
                </label>
                <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                    <label className="block">
                        <span className="field-label">Texte alternatif</span>
                        <input
                            className="input py-2.5"
                            value={altText}
                            maxLength={255}
                            onChange={(event) => setAltText(event.target.value)}
                        />
                    </label>
                    <label className="block">
                        <span className="field-label">Ordre</span>
                        <input
                            type="number"
                            min={0}
                            step={1}
                            className="input py-2.5"
                            value={order}
                            onChange={(event) => setOrder(event.target.value)}
                        />
                    </label>
                </div>

                {error && <div className="alert-error">{error}</div>}

                <div className="flex flex-wrap justify-end gap-2">
                    <button
                        type="button"
                        className="btn-danger"
                        disabled={deleting || saving}
                        onClick={() => void remove()}
                    >
                        {deleting ? "Suppression..." : "Supprimer"}
                    </button>
                    <button type="submit" className="btn-primary" disabled={saving || deleting}>
                        {saving ? "Enregistrement..." : "Enregistrer l'image"}
                    </button>
                </div>
            </div>
        </form>
    );
}

export function VehicleImageManager({
    vehicleId,
    initialImages,
}: {
    vehicleId: string;
    initialImages: VehicleImageResponse[];
}) {
    const router = useRouter();
    const [images, setImages] = useState(() => sortImages(initialImages));
    const [url, setUrl] = useState("");
    const [altText, setAltText] = useState("");
    const [order, setOrder] = useState("0");
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function add(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setAdding(true);
        setError(null);

        try {
            const created = await vehiclesApi.addVehicleImage(
                vehicleId,
                imageRequest(url, altText, order)
            );
            setImages((current) => sortImages([...current, created]));
            setUrl("");
            setAltText("");
            setOrder(String(images.length + 1));
        } catch (requestError) {
            if (isApiError(requestError, 401)) {
                router.push("/login");
                return;
            }
            if (isApiError(requestError, 403)) {
                router.push("/dashboard");
                return;
            }
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Impossible d'ajouter l'image"
            );
        } finally {
            setAdding(false);
        }
    }

    return (
        <section className="card space-y-5">
            <div>
                <p className="section-title">Galerie</p>
                <h2 className="mt-2 text-lg font-semibold">Images du véhicule</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                    Les images sont triées par ordre croissant. La première devient
                    automatiquement l’image principale. Seules des URL HTTP ou HTTPS
                    sont enregistrées ; aucun fichier n’est téléversé.
                </p>
            </div>

            <form onSubmit={add} className="surface-muted" noValidate>
                <p className="text-sm font-semibold">Ajouter une image</p>
                <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr_8rem_auto] lg:items-end">
                    <label className="block">
                        <span className="field-label">URL HTTP(S)</span>
                        <input
                            type="url"
                            className="input py-2.5"
                            value={url}
                            maxLength={500}
                            placeholder="https://..."
                            onChange={(event) => setUrl(event.target.value)}
                        />
                    </label>
                    <label className="block">
                        <span className="field-label">Texte alternatif</span>
                        <input
                            className="input py-2.5"
                            value={altText}
                            maxLength={255}
                            placeholder="Vue avant"
                            onChange={(event) => setAltText(event.target.value)}
                        />
                    </label>
                    <label className="block">
                        <span className="field-label">Ordre</span>
                        <input
                            type="number"
                            min={0}
                            step={1}
                            className="input py-2.5"
                            value={order}
                            onChange={(event) => setOrder(event.target.value)}
                        />
                    </label>
                    <button type="submit" className="btn-primary" disabled={adding}>
                        {adding ? "Ajout..." : "Ajouter"}
                    </button>
                </div>
                {error && <div className="alert-error mt-3">{error}</div>}
            </form>

            {images.length === 0 ? (
                <div className="empty-state">Aucune image pour ce véhicule.</div>
            ) : (
                <div className="space-y-4">
                    {images.map((image, index) => (
                        <ImageEditor
                            key={image.id}
                            vehicleId={vehicleId}
                            image={image}
                            primary={index === 0}
                            onUpdated={(updated) =>
                                setImages((current) =>
                                    sortImages(
                                        current.map((item) =>
                                            item.id === updated.id ? updated : item
                                        )
                                    )
                                )
                            }
                            onDeleted={(id) =>
                                setImages((current) =>
                                    current.filter((item) => item.id !== id)
                                )
                            }
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
