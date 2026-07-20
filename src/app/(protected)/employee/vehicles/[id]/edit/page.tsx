"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { PageHeader } from "@/components/ui/page-header";
import { VehicleForm } from "@/features/vehicles/components/employee/vehicle-form";
import { VehicleStatusEditor } from "@/features/vehicles/components/employee/vehicle-status-editor";
import { VehicleImageManager } from "@/features/vehicles/components/employee/vehicle-image-manager";
import { useStaffGuard } from "@/features/vehicles/hooks/use-staff-guard";
import * as vehiclesApi from "@/features/vehicles/api/vehicles-api";
import type {
    UpdateVehicleRequest,
    VehicleResponse,
} from "@/features/vehicles/types/vehicle.types";
import { isApiError } from "@/lib/api";

export default function EditVehiclePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { loading: loadingUser, authorized } = useStaffGuard();
    const [vehicle, setVehicle] = useState<VehicleResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authorized || !id) {
            return;
        }

        let ignore = false;
        vehiclesApi
            .getEmployeeVehicle(id)
            .then((response) => {
                if (!ignore) {
                    setVehicle(response);
                    setError(null);
                }
            })
            .catch((requestError) => {
                if (ignore) {
                    return;
                }
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
                        : "Véhicule introuvable"
                );
            })
            .finally(() => {
                if (!ignore) {
                    setLoading(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, [authorized, id, router]);

    if (loadingUser || !authorized) {
        return <LoadingScreen />;
    }

    async function update(request: UpdateVehicleRequest) {
        if (!vehicle) {
            return;
        }

        try {
            const updated = await vehiclesApi.updateVehicle(vehicle.id, request);
            setVehicle(updated);
        } catch (requestError) {
            if (isApiError(requestError, 401)) {
                router.push("/login");
                return;
            }
            if (isApiError(requestError, 403)) {
                router.push("/dashboard");
                return;
            }
            throw requestError;
        }
    }

    return (
        <main className="flex-1">
            <PageHeader
                title={vehicle ? `Modifier ${vehicle.brand} ${vehicle.model}` : "Modifier le véhicule"}
                backHref="/employee/vehicles"
                backLabel="Véhicules d’occasion"
            />

            <section className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-6 sm:py-10">
                {error && <div className="alert-error">{error}</div>}

                {loading ? (
                    <div className="empty-state">Chargement du véhicule...</div>
                ) : !vehicle ? (
                    <div className="empty-state">Ce véhicule est introuvable.</div>
                ) : (
                    <>
                        <VehicleStatusEditor
                            vehicle={vehicle}
                            onUpdated={setVehicle}
                        />
                        <VehicleForm
                            mode="edit"
                            initialVehicle={vehicle}
                            onSubmit={update}
                            onCancel={() => router.push("/employee/vehicles")}
                        />
                        <VehicleImageManager
                            vehicleId={vehicle.id}
                            initialImages={vehicle.images}
                        />
                    </>
                )}
            </section>
        </main>
    );
}
