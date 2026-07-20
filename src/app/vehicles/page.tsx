import { Suspense } from "react";
import { VehicleCatalog } from "@/features/vehicles/components/public/vehicle-catalog";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function VehiclesPage() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <VehicleCatalog />
        </Suspense>
    );
}
