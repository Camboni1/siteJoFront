type InvoicePaginationProps = {
    page: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    onPageChange: (page: number) => void;
};

export function InvoicePagination({
    page,
    totalPages,
    first,
    last,
    onPageChange,
}: InvoicePaginationProps) {
    if (totalPages <= 1) {
        return null;
    }

    return (
        <nav
            className="flex items-center justify-between gap-4"
            aria-label="Pagination des factures"
        >
            <button
                type="button"
                className="btn-ghost"
                disabled={first}
                onClick={() => onPageChange(page - 1)}
            >
                <span aria-hidden>←</span>
                Précédent
            </button>
            <span className="font-mono text-xs text-muted">
                Page {page + 1} / {totalPages}
            </span>
            <button
                type="button"
                className="btn-ghost"
                disabled={last}
                onClick={() => onPageChange(page + 1)}
            >
                Suivant
                <span aria-hidden>→</span>
            </button>
        </nav>
    );
}
