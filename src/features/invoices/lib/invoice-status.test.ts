import { describe, expect, it } from "vitest";
import { canSynchronizeInvoiceWithOdoo } from "@/features/invoices/lib/invoice-status";
import type { InvoiceStatus } from "@/features/invoices/types/invoice.types";

describe("canSynchronizeInvoiceWithOdoo", () => {
    it.each<InvoiceStatus>([
        "SENT",
        "PAID",
        "OVERDUE",
        "PEPPOL_SENT",
        "PEPPOL_FAILED",
    ])("autorise le statut backend intégrable %s", (status) => {
        expect(canSynchronizeInvoiceWithOdoo(status)).toBe(true);
    });

    it.each<InvoiceStatus>(["DRAFT", "RECEIVED", "CANCELLED"])(
        "refuse le statut backend non intégrable %s",
        (status) => {
            expect(canSynchronizeInvoiceWithOdoo(status)).toBe(false);
        }
    );
});
