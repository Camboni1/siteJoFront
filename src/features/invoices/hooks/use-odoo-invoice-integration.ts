"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as odooApi from "@/features/invoices/api/odoo-invoices-api";
import { describeOdooError } from "@/features/invoices/lib/odoo-error";
import type { OdooErrorInfo } from "@/features/invoices/lib/odoo-error";
import type { OdooInvoiceIntegrationResponse } from "@/features/invoices/types/odoo-invoice.types";

export type OdooActionKey = "sync" | "post" | "refresh" | "download";

export type UseOdooInvoiceIntegration = {
    state: OdooInvoiceIntegrationResponse | null;
    /** Chargement initial de l'état (distinct des actions). */
    initialLoading: boolean;
    /** Erreur du chargement initial (remplace le contenu du panneau). */
    loadError: OdooErrorInfo | null;
    /** Action en cours, `null` si aucune. Empêche les doubles soumissions. */
    pending: OdooActionKey | null;
    /** Erreur de la dernière action. */
    actionError: OdooErrorInfo | null;
    /** Notification de réussite de la dernière action. */
    actionMessage: string | null;
    reload: () => void;
    sync: () => void;
    post: () => void;
    refresh: () => void;
    downloadPdf: () => void;
};

export function useOdooInvoiceIntegration(
    invoiceId: string
): UseOdooInvoiceIntegration {
    const [state, setState] = useState<OdooInvoiceIntegrationResponse | null>(
        null
    );
    const [initialLoading, setInitialLoading] = useState(true);
    const [loadError, setLoadError] = useState<OdooErrorInfo | null>(null);
    const [pending, setPending] = useState<OdooActionKey | null>(null);
    const [actionError, setActionError] = useState<OdooErrorInfo | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [reloadToken, setReloadToken] = useState(0);

    // Suivi hors-rendu : ces refs ne servent qu'aux callbacks asynchrones et
    // aux gestionnaires d'événements (jamais pendant le rendu).
    const mountedRef = useRef(true);
    const invoiceIdRef = useRef(invoiceId);
    const pendingRef = useRef<OdooActionKey | null>(null);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        invoiceIdRef.current = invoiceId;
    }, [invoiceId]);

    // Une réponse est obsolète si le composant est démonté ou si la facture
    // affichée a changé entre-temps (cf. cas d'une réponse tardive).
    const isStale = useCallback((requestInvoiceId: string) => {
        return !mountedRef.current || invoiceIdRef.current !== requestInvoiceId;
    }, []);

    // Chargement initial de l'état + rechargements manuels (reloadToken).
    // Le drapeau `cancelled` ignore une réponse arrivée après un changement de
    // facture ou un démontage. Aucun setState synchrone : uniquement en async.
    useEffect(() => {
        let cancelled = false;

        odooApi
            .getOdooInvoiceState(invoiceId)
            .then((data) => {
                if (cancelled) {
                    return;
                }
                setState(data);
                setLoadError(null);
            })
            .catch((error) => {
                if (cancelled) {
                    return;
                }
                setLoadError(
                    describeOdooError(
                        error,
                        "Impossible de charger l'état d'intégration Odoo."
                    )
                );
            })
            .finally(() => {
                if (cancelled) {
                    return;
                }
                setInitialLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [invoiceId, reloadToken]);

    const runMutation = useCallback(
        (
            key: Exclude<OdooActionKey, "download">,
            apiCall: (id: string) => Promise<OdooInvoiceIntegrationResponse>,
            successMessage: string
        ) => {
            // Verrou synchrone contre les clics multiples rapides.
            if (pendingRef.current) {
                return;
            }

            const requestInvoiceId = invoiceIdRef.current;
            pendingRef.current = key;
            setPending(key);
            setActionError(null);
            setActionMessage(null);

            apiCall(requestInvoiceId)
                .then((data) => {
                    if (isStale(requestInvoiceId)) {
                        return;
                    }
                    setState(data);
                    setActionMessage(successMessage);
                })
                .catch((error) => {
                    if (isStale(requestInvoiceId)) {
                        return;
                    }
                    setActionError(
                        describeOdooError(
                            error,
                            "L'opération Odoo n'a pas pu aboutir."
                        )
                    );
                })
                .finally(() => {
                    if (pendingRef.current === key) {
                        pendingRef.current = null;
                    }
                    if (!isStale(requestInvoiceId)) {
                        setPending(null);
                    }
                });
        },
        [isStale]
    );

    const sync = useCallback(() => {
        runMutation(
            "sync",
            odooApi.synchronizeInvoiceWithOdoo,
            "La facture a été synchronisée avec Odoo."
        );
    }, [runMutation]);

    const post = useCallback(() => {
        runMutation(
            "post",
            odooApi.postInvoiceToOdoo,
            "La facture a été comptabilisée dans Odoo."
        );
    }, [runMutation]);

    const refresh = useCallback(() => {
        runMutation(
            "refresh",
            odooApi.refreshOdooInvoice,
            "Les statuts Odoo ont été actualisés."
        );
    }, [runMutation]);

    const downloadPdf = useCallback(() => {
        if (pendingRef.current) {
            return;
        }

        const requestInvoiceId = invoiceIdRef.current;
        pendingRef.current = "download";
        setPending("download");
        setActionError(null);
        setActionMessage(null);

        odooApi
            .downloadOdooOfficialPdf(requestInvoiceId)
            .catch((error) => {
                if (isStale(requestInvoiceId)) {
                    return;
                }
                setActionError(
                    describeOdooError(
                        error,
                        "Le téléchargement du PDF officiel a échoué."
                    )
                );
            })
            .finally(() => {
                if (pendingRef.current === "download") {
                    pendingRef.current = null;
                }
                if (!isStale(requestInvoiceId)) {
                    setPending(null);
                }
            });
    }, [isStale]);

    // Rechargement manuel (bouton « Réessayer »). Gestionnaire d'événement :
    // les setState synchrones y sont autorisés.
    const reload = useCallback(() => {
        setInitialLoading(true);
        setLoadError(null);
        setState(null);
        setActionError(null);
        setActionMessage(null);
        setReloadToken((token) => token + 1);
    }, []);

    return {
        state,
        initialLoading,
        loadError,
        pending,
        actionError,
        actionMessage,
        reload,
        sync,
        post,
        refresh,
        downloadPdf,
    };
}
