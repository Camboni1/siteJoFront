"use client";

import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { PageHeader } from "@/components/ui/page-header";
import * as customerVehiclesApi from "@/features/customer-vehicles/api/customer-vehicles-api";
import { CustomerVehicleForm } from "@/features/customer-vehicles/components/customer-vehicle-form";
import { useCustomerGuard } from "@/features/customer-vehicles/hooks/use-customer-guard";

export default function NewCustomerVehiclePage() {
    const router = useRouter();
    const { loading, authorized } = useCustomerGuard();

    if (loading || !authorized) {
        return <LoadingScreen />;
    }

    return (
        <main className="flex-1">
            <PageHeader
                title="Ajouter un véhicule"
                backHref="/dashboard/vehicles"
                backLabel="Mes véhicules"
            />

            <section className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-10">
                <CustomerVehicleForm
                    mode="create"
                    onSubmit={async (request) => {
                        await customerVehiclesApi.createMyCustomerVehicle(
                            request
                        );
                        router.push("/dashboard/vehicles?result=created");
                    }}
                    onCancel={() => router.push("/dashboard/vehicles")}
                />
            </section>
        </main>
    );
}
