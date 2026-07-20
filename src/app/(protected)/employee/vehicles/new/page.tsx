"use client";

import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { PageHeader } from "@/components/ui/page-header";
import { VehicleForm } from "@/features/vehicles/components/employee/vehicle-form";
import { useStaffGuard } from "@/features/vehicles/hooks/use-staff-guard";
import * as vehiclesApi from "@/features/vehicles/api/vehicles-api";
import type { CreateVehicleRequest } from "@/features/vehicles/types/vehicle.types";
import { isApiError } from "@/lib/api";

export default function NewVehiclePage() {
    const router = useRouter();
    const { loading, authorized } = useStaffGuard();

    if (loading || !authorized) {
        return <LoadingScreen />;
    }

    async function create(request: CreateVehicleRequest) {
        try {
            const vehicle = await vehiclesApi.createVehicle(request);
            router.push(`/employee/vehicles/${vehicle.id}/edit`);
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
                title="Nouveau véhicule"
                backHref="/employee/vehicles"
                backLabel="Véhicules d’occasion"
            />
            <section className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-6 sm:py-10">
                <VehicleForm
                    mode="create"
                    onSubmit={create}
                    onCancel={() => router.push("/employee/vehicles")}
                />
            </section>
        </main>
    );
}
