import Link from "next/link";
import { Brand } from "@/components/ui/brand";

const features = [
    {
        title: "Rendez-vous en ligne",
        description:
            "Choisis un créneau disponible et suis tes demandes depuis ton espace client.",
    },
    {
        title: "Entretien & réparation",
        description:
            "Vidange, freinage, diagnostic, pneumatiques, climatisation et plus encore.",
    },
    {
        title: "Véhicules d'occasion",
        description:
            "Des véhicules révisés et garantis, sélectionnés par le garage.",
    },
];

export default function HomePage() {
    return (
        <main className="flex min-h-screen flex-col">
            <header className="border-b border-white/10">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <Brand />

                    <nav className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="text-sm text-neutral-300 transition hover:text-white"
                        >
                            Connexion
                        </Link>
                        <Link href="/register" className="btn-primary">
                            Créer un compte
                        </Link>
                    </nav>
                </div>
            </header>

            <section className="flex flex-1 items-center">
                <div className="mx-auto w-full max-w-6xl px-6 py-20">
                    <div className="mx-auto max-w-2xl text-center">
                        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-neutral-300">
                            Entretien · Réparation · Occasions
                        </p>

                        <h1 className="mt-8 bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-5xl font-semibold tracking-tight text-transparent sm:text-6xl">
                            Ton garage, sans prise de tête
                        </h1>

                        <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-400">
                            Prends rendez-vous en ligne, suis tes réparations et
                            retrouve tout l&apos;historique de ton véhicule au
                            même endroit.
                        </p>

                        <div className="mt-10 flex flex-wrap justify-center gap-4">
                            <Link
                                href="/register"
                                className="btn-primary px-6 py-3 text-base"
                            >
                                Prendre rendez-vous
                            </Link>

                            <Link
                                href="/login"
                                className="btn-ghost px-6 py-3 text-base"
                            >
                                J&apos;ai déjà un compte
                            </Link>
                        </div>
                    </div>

                    <div className="mt-20 grid gap-4 md:grid-cols-3">
                        {features.map((feature) => (
                            <div key={feature.title} className="card">
                                <h2 className="font-semibold">
                                    {feature.title}
                                </h2>
                                <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="border-t border-white/10">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-6 text-sm text-neutral-500">
                    <span>© {new Date().getFullYear()} Garage Jojo</span>
                    <span>Lun – Ven · 08:00 – 18:00</span>
                </div>
            </footer>
        </main>
    );
}
