import { isApiError } from "@/lib/api";

export type OdooErrorInfo = {
    /** Message fonctionnel à afficher à l'utilisateur (jamais technique). */
    message: string;
    /** Code fonctionnel backend (ODOO_UNAVAILABLE, LOCAL_INVOICE_NOT_FOUND...). */
    code: string | null;
    /** requestId à afficher discrètement pour le support, si disponible. */
    requestId: string | null;
};

const NETWORK_MESSAGE =
    "Impossible de contacter le serveur. Vérifiez votre connexion.";
const SESSION_MESSAGE =
    "Votre session a expiré. Veuillez vous reconnecter.";
const FORBIDDEN_MESSAGE =
    "Vous n'avez pas accès à l'intégration Odoo de cette facture.";
const NOT_FOUND_MESSAGE = "Cette facture est introuvable.";
const INVALID_MESSAGE =
    "Réponse inattendue du serveur. Veuillez réessayer plus tard.";

/**
 * Traduit une erreur remontée par le client HTTP en message français sûr.
 *
 * Règle : lorsque le backend fournit un code fonctionnel, son message a déjà
 * été nettoyé (pas de trace, secret, SQL ni détail Odoo brut) — on l'affiche
 * tel quel. Sans code, on retombe sur des messages génériques par statut.
 *
 * Une erreur Odoo distante (ODOO_ACCESS_ERROR, mappée en 502 par le backend)
 * n'est jamais transformée en fausse déconnexion : seul un 401 sans code
 * signale une session expirée.
 */
export function describeOdooError(
    error: unknown,
    fallback: string = INVALID_MESSAGE
): OdooErrorInfo {
    if (isApiError(error)) {
        if (error.code) {
            return {
                message: error.message || fallback,
                code: error.code,
                requestId: error.requestId,
            };
        }

        if (error.status === 401) {
            return withStatusMessage(error, SESSION_MESSAGE);
        }

        if (error.status === 403) {
            return withStatusMessage(error, FORBIDDEN_MESSAGE);
        }

        if (error.status === 404) {
            return withStatusMessage(error, NOT_FOUND_MESSAGE);
        }

        // Autre statut sans code : le message backend s'il est exploitable,
        // sinon le repli fourni par l'appelant.
        const usableMessage =
            error.message && !error.message.startsWith("Erreur API ")
                ? error.message
                : fallback;

        return { message: usableMessage, code: null, requestId: error.requestId };
    }

    // fetch rejette avec TypeError en cas de coupure réseau (ou blocage CORS).
    if (error instanceof TypeError) {
        return { message: NETWORK_MESSAGE, code: null, requestId: null };
    }

    return { message: fallback, code: null, requestId: null };
}

function withStatusMessage(
    error: { requestId: string | null },
    message: string
): OdooErrorInfo {
    return { message, code: null, requestId: error.requestId };
}
