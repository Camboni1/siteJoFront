import { Suspense } from "react";
import { EmployeeVehicleList } from "@/features/vehicles/components/employee/employee-vehicle-list";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function EmployeeVehiclesPage() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <EmployeeVehicleList />
        </Suspense>
    );
}
