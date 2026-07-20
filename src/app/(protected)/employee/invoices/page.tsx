import { Suspense } from "react";
import { EmployeeInvoiceList } from "@/features/invoices/components/employee-invoice-list";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function EmployeeInvoicesPage() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <EmployeeInvoiceList />
        </Suspense>
    );
}
