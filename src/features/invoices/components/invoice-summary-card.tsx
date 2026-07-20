import type { ReactNode } from "react";
import type { InvoiceResponse } from "@/features/invoices/types/invoice.types";
import { InvoiceStatusBadge } from "@/features/invoices/components/invoice-status-badge";
import { formatDateShort, formatDateTime } from "@/lib/format";

type InvoiceSummaryCardProps = {
    invoice: InvoiceResponse;
    showTechnicalDates?: boolean;
    children?: ReactNode;
};

export function InvoiceSummaryCard({
    invoice,
    showTechnicalDates,
    children,
}: InvoiceSummaryCardProps) {
    return (
        <div className="card relative overflow-hidden">
            <div className="absolute top-0 right-0 h-40 w-40 translate-x-1/3 -translate-y-1/2 rounded-full bg-accent/8 blur-3xl" />

            <div className="relative flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="eyebrow">Facture</p>
                    <p className="mt-2 font-mono text-2xl font-semibold tracking-tight">
                        {invoice.invoiceNumber}
                    </p>
                    {showTechnicalDates && (
                        <>
                            <p className="mt-2 font-mono text-xs text-muted">
                                Créée le {formatDateTime(invoice.createdAt)}
                            </p>
                            <p className="mt-1 font-mono text-xs text-muted">
                                Modifiée le {formatDateTime(invoice.updatedAt)}
                            </p>
                        </>
                    )}
                </div>

                <InvoiceStatusBadge status={invoice.status} />
            </div>

            <div className="relative mt-6 grid gap-3 border-t border-line pt-6 sm:grid-cols-3">
                <div className="surface-muted">
                    <p className="section-title">Date d&apos;émission</p>
                    <p className="mt-2 text-sm font-medium">
                        {formatDateShort(invoice.invoiceDate)}
                    </p>
                </div>

                <div className="surface-muted">
                    <p className="section-title">Échéance</p>
                    <p className="mt-2 text-sm font-medium">
                        {invoice.dueDate
                            ? formatDateShort(invoice.dueDate)
                            : "—"}
                    </p>
                </div>

                <div className="surface-muted">
                    <p className="section-title">Devise</p>
                    <p className="mt-2 font-mono text-sm font-medium">
                        {invoice.currency}
                    </p>
                </div>
            </div>

            {children && (
                <div className="relative mt-6 flex flex-wrap items-start gap-3">
                    {children}
                </div>
            )}
        </div>
    );
}
