import { Suspense } from "react";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { EmployeeWorkOrderList } from "@/features/work-orders/components/work-order-list";

export default function EmployeeWorkOrdersPage() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <EmployeeWorkOrderList />
        </Suspense>
    );
}
