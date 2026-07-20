import type { InvoiceLineResponse } from "@/features/invoices/types/invoice.types";

const quantityFormatter = new Intl.NumberFormat("fr-BE", {
    maximumFractionDigits: 3,
});

const vatRateFormatter = new Intl.NumberFormat("fr-BE", {
    maximumFractionDigits: 2,
});

export function formatQuantity(quantity: number) {
    return quantityFormatter.format(quantity);
}

export function formatVatRate(vatRate: number) {
    return `${vatRateFormatter.format(vatRate)} %`;
}

export function roundToCents(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

export type VatSummaryRow = {
    vatRate: number;
    amountExcludingVat: number;
    vatAmount: number;
    amountIncludingVat: number;
};

/**
 * Regroupe des montants déjà calculés par le backend par taux de TVA.
 * Les sommes se font en centimes entiers pour éviter les artefacts flottants.
 */
export function computeVatSummary(lines: InvoiceLineResponse[]): VatSummaryRow[] {
    const groups = new Map<
        number,
        { excludingVat: number; vat: number; includingVat: number }
    >();

    for (const line of lines) {
        const group = groups.get(line.vatRate) ?? {
            excludingVat: 0,
            vat: 0,
            includingVat: 0,
        };

        group.excludingVat += Math.round(line.amountExcludingVat * 100);
        group.vat += Math.round(line.vatAmount * 100);
        group.includingVat += Math.round(line.amountIncludingVat * 100);
        groups.set(line.vatRate, group);
    }

    return [...groups.entries()]
        .sort(([rateA], [rateB]) => rateA - rateB)
        .map(([vatRate, group]) => ({
            vatRate,
            amountExcludingVat: group.excludingVat / 100,
            vatAmount: group.vat / 100,
            amountIncludingVat: group.includingVat / 100,
        }));
}
