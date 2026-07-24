import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api";
import { describeOdooError } from "@/features/invoices/lib/odoo-error";

describe("describeOdooError", () => {
    it("affiche le message fonctionnel backend quand un code est présent", () => {
        const error = new ApiError(
            "Odoo est temporairement indisponible.",
            503,
            "ODOO_UNAVAILABLE",
            "req-1"
        );

        expect(describeOdooError(error)).toEqual({
            message: "Odoo est temporairement indisponible.",
            code: "ODOO_UNAVAILABLE",
            requestId: "req-1",
        });
    });

    it("ne transforme pas une erreur Odoo distante (502 avec code) en déconnexion", () => {
        const error = new ApiError(
            "Odoo a refusé l'accès du service d'intégration.",
            502,
            "ODOO_ACCESS_ERROR",
            null
        );

        expect(describeOdooError(error).message).toBe(
            "Odoo a refusé l'accès du service d'intégration."
        );
    });

    it("signale une session expirée sur un 401 sans code", () => {
        const error = new ApiError("Erreur API 401", 401);

        expect(describeOdooError(error).message).toBe(
            "Votre session a expiré. Veuillez vous reconnecter."
        );
    });

    it("signale un accès interdit sur un 403 sans code", () => {
        const error = new ApiError("Erreur API 403", 403);

        expect(describeOdooError(error).message).toBe(
            "Vous n'avez pas accès à l'intégration Odoo de cette facture."
        );
    });

    it("signale une facture absente sur un 404 sans code", () => {
        const error = new ApiError("Erreur API 404", 404);

        expect(describeOdooError(error).message).toBe(
            "Cette facture est introuvable."
        );
    });

    it("signale une erreur réseau pour un TypeError", () => {
        const error = new TypeError("Failed to fetch");

        expect(describeOdooError(error).message).toBe(
            "Impossible de contacter le serveur. Vérifiez votre connexion."
        );
    });

    it("retombe sur le message de repli pour une erreur inconnue", () => {
        expect(describeOdooError(null, "Repli personnalisé.").message).toBe(
            "Repli personnalisé."
        );
    });
});
