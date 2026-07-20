import { roundToCents } from "@/features/invoices/lib/invoice-amounts";

export type ParsedDecimal = {
    value: number;
    integerDigits: number;
    fractionDigits: number;
};

/**
 * Interprète une saisie décimale acceptant la virgule française.
 * Retourne null si la saisie n'est pas un nombre valide.
 */
export function parseDecimalInput(raw: string): ParsedDecimal | null {
    const normalized = raw.trim().replace(",", ".");

    if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
        return null;
    }

    const [integerPart, fractionPart = ""] = normalized
        .replace("-", "")
        .split(".");

    return {
        value: Number(normalized),
        integerDigits: integerPart.replace(/^0+(?=\d)/, "").length,
        // Les zéros finaux sont ignorés : "1,230" vaut 1.23 une fois envoyé.
        fractionDigits: fractionPart.replace(/0+$/, "").length,
    };
}

export function decimalToInput(value: number) {
    return String(value).replace(".", ",");
}

export type LinePreview = {
    amountExcludingVat: number;
    vatAmount: number;
    amountIncludingVat: number;
};

/**
 * Aperçu purement indicatif d'une ligne : les montants officiels sont
 * toujours ceux calculés par le backend (BigDecimal) après enregistrement.
 */
export function computeLinePreview(line: {
    quantity: string;
    unitPriceExcludingVat: string;
    vatRate: string;
}): LinePreview | null {
    const quantity = parseDecimalInput(line.quantity);
    const unitPrice = parseDecimalInput(line.unitPriceExcludingVat);
    const vatRate = parseDecimalInput(line.vatRate);

    if (
        !quantity ||
        quantity.value <= 0 ||
        !unitPrice ||
        unitPrice.value < 0 ||
        !vatRate ||
        vatRate.value < 0 ||
        vatRate.value > 100
    ) {
        return null;
    }

    const amountExcludingVat = roundToCents(quantity.value * unitPrice.value);
    const vatAmount = roundToCents((amountExcludingVat * vatRate.value) / 100);

    return {
        amountExcludingVat,
        vatAmount,
        amountIncludingVat: roundToCents(amountExcludingVat + vatAmount),
    };
}
