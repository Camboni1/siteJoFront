import Link from "next/link";

const features = [
    {
        number: "01",
        title: "Réserver simplement",
        description:
            "Choisissez votre service, votre date et un créneau disponible en quelques instants.",
    },
    {
        number: "02",
        title: "Suivre l’intervention",
        description:
            "Retrouvez le statut de vos demandes et tout l’historique de votre véhicule.",
    },
    {
        number: "03",
        title: "Rouler sereinement",
        description:
            "Entretien, diagnostic et réparation réunis dans un espace clair et accessible.",
    },
];

export default function HomePage() {
    return (
        <main className="flex flex-1 flex-col overflow-hidden">
            <section className="relative flex flex-1 items-center">
                <div className="mx-auto grid w-full max-w-7xl items-center gap-14 px-5 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
                    <div className="reveal max-w-2xl">
                        <div className="eyebrow inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(232,160,75,0.75)]" />
                            Entretien · Réparation · Diagnostic
                        </div>

                        <h1 className="mt-7 text-4xl leading-[1.03] font-semibold tracking-[-0.04em] text-ink sm:text-6xl lg:text-7xl">
                            Votre voiture,
                            <span className="mt-1 block text-muted">
                                entre de bonnes mains.
                            </span>
                        </h1>

                        <p className="mt-7 max-w-xl text-base leading-7 text-muted sm:text-lg">
                            Un atelier de proximité et un suivi en ligne sans
                            détour. Prenez rendez-vous, suivez vos réparations et
                            gardez l’esprit tranquille.
                        </p>

                        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/register"
                                className="btn-primary px-5 py-3"
                            >
                                Prendre rendez-vous
                                <span aria-hidden>→</span>
                            </Link>
                            <Link
                                href="/login"
                                className="btn-ghost px-5 py-3"
                            >
                                Consulter mon espace
                            </Link>
                        </div>

                        <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-line/70 pt-5 font-mono text-[0.65rem] tracking-[0.1em] text-faint uppercase">
                            <span>Lun — Ven · 08:00 — 18:00</span>
                            <span className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                Rendez-vous en ligne
                            </span>
                        </div>
                    </div>

                    <div className="reveal relative mx-auto w-full max-w-xl lg:ml-auto [animation-delay:120ms]">
                        <div className="absolute -inset-10 -z-10 rounded-full bg-accent/5 blur-3xl" />
                        <div className="overflow-hidden rounded-2xl border border-line bg-[#242528] shadow-[0_28px_80px_rgba(0,0,0,0.38)]">
                            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                                <div className="flex gap-1.5" aria-hidden>
                                    <span className="h-2.5 w-2.5 rounded-full bg-[#ed6a5e]" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-[#e7b34d]" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-[#61c454]" />
                                </div>
                                <span className="font-mono text-[0.6rem] tracking-[0.14em] text-faint uppercase">
                                    Espace client
                                </span>
                            </div>

                            <div className="p-5 sm:p-7">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="eyebrow">Prochaine visite</p>
                                        <h2 className="mt-2 text-xl font-semibold tracking-tight">
                                            Entretien annuel
                                        </h2>
                                        <p className="mt-1 text-sm text-muted">
                                            Mardi · 09:30 — 10:30
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-3 py-1 text-xs font-medium text-emerald-300">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                        Confirmé
                                    </span>
                                </div>

                                <div className="my-7 h-px bg-line" />

                                <div className="grid gap-3 sm:grid-cols-3">
                                    {[
                                        ["01", "Demande", "Reçue"],
                                        ["02", "Créneau", "Confirmé"],
                                        ["03", "Atelier", "À venir"],
                                    ].map(([step, label, value], index) => (
                                        <div
                                            key={step}
                                            className={`rounded-xl border p-4 ${
                                                index < 2
                                                    ? "border-accent/25 bg-accent/5"
                                                    : "border-line bg-surface-soft"
                                            }`}
                                        >
                                            <span className="font-mono text-[0.6rem] text-accent">
                                                {step}
                                            </span>
                                            <p className="mt-5 text-sm font-medium">
                                                {label}
                                            </p>
                                            <p className="mt-0.5 text-xs text-faint">
                                                {value}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 flex items-center justify-between rounded-xl border border-line bg-surface-soft p-4">
                                    <div>
                                        <p className="text-xs text-faint">
                                            Véhicule
                                        </p>
                                        <p className="mt-1 text-sm font-medium">
                                            Votre véhicule
                                        </p>
                                    </div>
                                    <span className="font-mono text-xs text-muted">
                                        DOSSIER #001
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section
                id="services"
                className="border-y border-line/70 bg-surface-soft/55"
            >
                <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6">
                    <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
                        <div>
                            <p className="eyebrow">Une expérience simple</p>
                            <h2 className="mt-3 max-w-sm text-2xl font-semibold tracking-tight sm:text-3xl">
                                Moins d’attente. Plus de visibilité.
                            </h2>
                        </div>

                        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
                            {features.map((feature) => (
                                <article
                                    key={feature.number}
                                    className="bg-surface p-6 sm:p-7"
                                >
                                    <span className="font-mono text-xs text-accent">
                                        /{feature.number}
                                    </span>
                                    <h3 className="mt-10 font-semibold text-ink">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-muted">
                                        {feature.description}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

        </main>
    );
}
