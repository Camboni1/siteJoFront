type OdooStatusBadgeProps = {
    label: string;
    className: string;
};

// Badge présentationnel générique pour les statuts Odoo. Les libellés et les
// variantes visuelles proviennent de `@/features/invoices/lib/odoo-invoice-status`.
export function OdooStatusBadge({ label, className }: OdooStatusBadgeProps) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${className}`}
        >
            <span className="h-1 w-1 rounded-full bg-current" aria-hidden />
            {label}
        </span>
    );
}
