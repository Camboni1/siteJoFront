import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api";
import { invoiceDraftFromWorkOrderError } from "@/features/invoices/lib/invoice-error";

describe("invoiceDraftFromWorkOrderError", () => {
    it("conserve un message métier autorisé", () => {
        expect(
            invoiceDraftFromWorkOrderError(
                new ApiError(
                    "L'ordre de réparation doit être prêt ou livré avant sa facturation",
                    409
                )
            )
        ).toEqual({
            message:
                "L'ordre de réparation doit être prêt ou livré avant sa facturation",
            duplicate: false,
        });
    });

    it("normalise le doublon et permet d’afficher le lien vers les factures", () => {
        expect(
            invoiceDraftFromWorkOrderError(
                new ApiError(
                    "Une facture existe déjà pour cet ordre de réparation",
                    409
                )
            )
        ).toEqual({
            message:
                "Une facture existe déjà pour cet ordre de réparation.",
            duplicate: true,
        });
    });

    it("n’expose jamais une erreur technique inconnue", () => {
        const result = invoiceDraftFromWorkOrderError(
            new Error(
                'SQL duplicate key table invoices constraint "uq_invoices_work_order"'
            )
        );

        expect(result.message).toBe(
            "Impossible de créer le brouillon de facture."
        );
        expect(result.message).not.toMatch(/SQL|invoices|constraint/i);
        expect(result.duplicate).toBe(false);
    });
});
