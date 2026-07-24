/**
 * Déclenche le téléchargement d'un Blob déjà récupéré (PDF, etc.).
 *
 * Crée une URL temporaire via `URL.createObjectURL`, simule un clic sur un lien
 * puis libère l'URL avec `URL.revokeObjectURL`. La révocation est différée pour
 * laisser le navigateur commencer la lecture du Blob (une révocation synchrone
 * interrompt certains clients).
 */
export function saveBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);

    try {
        link.click();
    } finally {
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    }
}
