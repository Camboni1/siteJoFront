import type { InvoiceResponse } from "@/features/invoices/types/invoice.types";
import {
    computeVatSummary,
    formatVatRate,
} from "@/features/invoices/lib/invoice-amounts";
import { formatCurrency } from "@/lib/format";

export function InvoiceTotalsSummary({ invoice }: { invoice: InvoiceResponse }) {
    const { currency } = invoice;
    const vatSummary = computeVatSummary(invoice.lines);

    return (
        <div className="card">
            <p className="section-title">Montants</p>
            <h2 className="mt-2 text-lg font-semibold">Totaux</h2>

            {vatSummary.length > 0 && (
                <div className="mt-4 overflow-x-auto rounded-xl border border-line/80">
                    <table className="w-full text-left text-sm">
                        <caption className="sr-only">
                            Récapitulatif par taux de TVA
                        </caption>
                        <thead className="border-b border-line bg-surface-soft font-mono text-[0.65rem] tracking-wider text-faint uppercase">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-4 py-3 font-semibold"
                                >
                                    Taux TVA
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3 text-right font-semibold"
                                >
                                    Base HTVA
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3 text-right font-semibold"
                                >
                                    TVA
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3 text-right font-semibold"
                                >
                                    Total TVAC
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {vatSummary.map((row) => (
                                <tr
                                    key={row.vatRate}
                                    className="border-b border-line/70 last:border-b-0"
                                >
                                    <td className="px-4 py-3 font-medium">
                                        {formatVatRate(row.vatRate)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-muted">
                                        {formatCurrency(
                                            row.amountExcludingVat,
                                            currency
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right text-muted">
                                        {formatCurrency(row.vatAmount, currency)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-muted">
                                        {formatCurrency(
                                            row.amountIncludingVat,
                                            currency
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted">Total HTVA</dt>
                    <dd className="font-medium">
                        {formatCurrency(invoice.amountExcludingVat, currency)}
                    </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted">TVA</dt>
                    <dd className="font-medium">
                        {formatCurrency(invoice.vatAmount, currency)}
                    </dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-line pt-3">
                    <dt className="font-semibold">Total TVAC</dt>
                    <dd className="text-lg font-semibold text-accent">
                        {formatCurrency(invoice.amountIncludingVat, currency)}
                    </dd>
                </div>
            </dl>
        </div>
    );
}
