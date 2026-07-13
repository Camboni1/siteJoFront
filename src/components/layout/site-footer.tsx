import Link from "next/link";
import { Brand } from "@/components/ui/brand";

export function SiteFooter() {
    return (
        <footer className="border-t border-line/80 bg-surface-soft/70">
            <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-6 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
                <div>
                    <Link href="/" aria-label="CamboGarage — accueil">
                        <Brand />
                    </Link>
                    <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
                        Entretien, réparation et diagnostic avec un suivi simple,
                        de la prise de rendez-vous à la restitution du véhicule.
                    </p>
                </div>

                <nav aria-label="Navigation du pied de page">
                    <p className="section-title">Navigation</p>
                    <div className="mt-4 grid gap-2.5 text-sm">
                        <Link href="/" className="text-muted transition hover:text-accent">
                            Accueil
                        </Link>
                        <Link
                            href="/#services"
                            className="text-muted transition hover:text-accent"
                        >
                            Prestations
                        </Link>
                        <Link
                            href="/dashboard/appointments/new"
                            className="text-muted transition hover:text-accent"
                        >
                            Prendre rendez-vous
                        </Link>
                        <Link
                            href="/dashboard"
                            className="text-muted transition hover:text-accent"
                        >
                            Espace client
                        </Link>
                    </div>
                </nav>

                <div id="atelier">
                    <p className="section-title">L’atelier</p>
                    <div className="mt-4 space-y-2.5 text-sm text-muted">
                        <p>Lundi — Vendredi</p>
                        <p className="font-mono text-xs text-ink">08:00 — 18:00</p>
                        <a
                            href="tel:+3281123456"
                            className="inline-block transition hover:text-accent"
                        >
                            +32 81 12 34 56
                        </a>
                    </div>
                </div>
            </div>

            <div className="border-t border-line/70">
                <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-4 font-mono text-[0.62rem] tracking-[0.08em] text-faint uppercase sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <span>© {new Date().getFullYear()} CamboGarage</span>
                    <span>Atelier automobile · Namur</span>
                </div>
            </div>
        </footer>
    );
}
