import type { InvoiceStatus } from "@/features/invoices/types/invoice.types";
import {
    INVOICE_STATUS_BADGE_CLASSES,
    INVOICE_STATUS_LABELS,
} from "@/features/invoices/lib/invoice-status";

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${INVOICE_STATUS_BADGE_CLASSES[status]}`}
        >
            <span className="h-1 w-1 rounded-full bg-current" aria-hidden />
            {INVOICE_STATUS_LABELS[status]}
        </span>
    );
}
