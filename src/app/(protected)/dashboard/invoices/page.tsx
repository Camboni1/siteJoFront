import { Suspense } from "react";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { CustomerInvoiceList } from "@/features/invoices/components/customer-invoice-list";

export default function CustomerInvoicesPage() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <CustomerInvoiceList />
        </Suspense>
    );
}
