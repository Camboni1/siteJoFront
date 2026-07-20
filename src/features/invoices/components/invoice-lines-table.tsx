import type { InvoiceLineResponse } from "@/features/invoices/types/invoice.types";
import {
    formatQuantity,
    formatVatRate,
} from "@/features/invoices/lib/invoice-amounts";
import { formatCurrency } from "@/lib/format";

type InvoiceLinesTableProps = {
    lines: InvoiceLineResponse[];
    currency: string;
};

export function InvoiceLinesTable({ lines, currency }: InvoiceLinesTableProps) {
    if (lines.length === 0) {
        return (
            <div className="empty-state">
                Cette facture ne contient aucune ligne.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-surface-soft font-mono text-[0.65rem] tracking-wider text-faint uppercase">
                    <tr>
                        <th scope="col" className="px-4 py-4 font-semibold">
                            #
                        </th>
                        <th scope="col" className="px-4 py-4 font-semibold">
                            Description
                        </th>
                        <th
                            scope="col"
                            className="px-4 py-4 text-right font-semibold"
                        >
                            Qté
                        </th>
                        <th
                            scope="col"
                            className="px-4 py-4 text-right font-semibold"
                        >
                            PU HTVA
                        </th>
                        <th
                            scope="col"
                            className="px-4 py-4 text-right font-semibold"
                        >
                            TVA %
                        </th>
                        <th
                            scope="col"
                            className="px-4 py-4 text-right font-semibold"
                        >
                            Total HTVA
                        </th>
                        <th
                            scope="col"
                            className="px-4 py-4 text-right font-semibold"
                        >
                            TVA
                        </th>
                        <th
                            scope="col"
                            className="px-4 py-4 text-right font-semibold"
                        >
                            Total TVAC
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {lines.map((line, index) => (
                        <tr
                            key={line.id}
                            className="border-b border-line/70 last:border-b-0"
                        >
                            <td className="px-4 py-4 font-mono text-xs text-faint">
                                {index + 1}
                            </td>
                            <td className="px-4 py-4 font-medium">
                                {line.description}
                            </td>
                            <td className="px-4 py-4 text-right text-muted">
                                {formatQuantity(line.quantity)}
                            </td>
                            <td className="px-4 py-4 text-right text-muted">
                                {formatCurrency(
                                    line.unitPriceExcludingVat,
                                    currency
                                )}
                            </td>
                            <td className="px-4 py-4 text-right text-muted">
                                {formatVatRate(line.vatRate)}
                            </td>
                            <td className="px-4 py-4 text-right text-muted">
                                {formatCurrency(
                                    line.amountExcludingVat,
                                    currency
                                )}
                            </td>
                            <td className="px-4 py-4 text-right text-muted">
                                {formatCurrency(line.vatAmount, currency)}
                            </td>
                            <td className="px-4 py-4 text-right font-medium">
                                {formatCurrency(
                                    line.amountIncludingVat,
                                    currency
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
