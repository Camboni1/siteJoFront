import type { InvoiceResponse } from "@/features/invoices/types/invoice.types";

export function InvoiceParties({ invoice }: { invoice: InvoiceResponse }) {
    const { garage, customer } = invoice;
    const draft = invoice.status === "DRAFT";

    const customerName =
        [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
        null;

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <div className="card">
                <p className="section-title">Émetteur</p>
                <h2 className="mt-2 text-lg font-semibold">Garage</h2>

                <div className="mt-4 space-y-1 text-sm leading-6">
                    <p className="font-medium">{garage.legalName ?? "—"}</p>
                    <PartyAddress
                        street={garage.street}
                        postalCode={garage.postalCode}
                        city={garage.city}
                        country={garage.country}
                    />
                </div>

                <dl className="mt-4 space-y-1 text-sm">
                    <PartyField label="TVA" value={garage.vatNumber} mono />
                    <PartyField label="Email" value={garage.email} />
                    <PartyField label="Téléphone" value={garage.phone} />
                </dl>

                <PartySnapshotNote draft={draft} />
            </div>

            <div className="card">
                <p className="section-title">Destinataire</p>
                <h2 className="mt-2 text-lg font-semibold">Client</h2>

                <div className="mt-4 space-y-1 text-sm leading-6">
                    <p className="font-medium">{customerName ?? "—"}</p>
                    <PartyAddress
                        street={customer.street}
                        postalCode={customer.postalCode}
                        city={customer.city}
                        country={customer.country}
                    />
                </div>

                <dl className="mt-4 space-y-1 text-sm">
                    <PartyField label="TVA" value={customer.vatNumber} mono />
                    <PartyField label="Email" value={customer.email} />
                </dl>

                <PartySnapshotNote draft={draft} />
            </div>
        </div>
    );
}

function PartyAddress({
    street,
    postalCode,
    city,
    country,
}: {
    street: string | null;
    postalCode: string | null;
    city: string | null;
    country: string | null;
}) {
    const lines = [
        street,
        [postalCode, city].filter(Boolean).join(" "),
        country,
    ].filter(Boolean);

    if (lines.length === 0) {
        return <p className="text-muted">Adresse non renseignée</p>;
    }

    return (
        <>
            {lines.map((line) => (
                <p key={line} className="text-muted">
                    {line}
                </p>
            ))}
        </>
    );
}

function PartyField({
    label,
    value,
    mono,
}: {
    label: string;
    value: string | null;
    mono?: boolean;
}) {
    return (
        <div className="flex justify-between gap-4">
            <dt className="text-muted">{label}</dt>
            <dd
                className={
                    mono
                        ? "text-right font-mono text-xs font-medium"
                        : "text-right font-medium"
                }
            >
                {value ?? "—"}
            </dd>
        </div>
    );
}

function PartySnapshotNote({ draft }: { draft: boolean }) {
    return (
        <p className="mt-4 border-t border-line/70 pt-3 text-xs text-faint">
            {draft
                ? "Données actuelles — elles seront figées lors de l'émission."
                : "Données figées lors de l'émission de la facture."}
        </p>
    );
}
