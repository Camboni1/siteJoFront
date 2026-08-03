import type { Metadata } from "next";
import Link from "next/link";
import { FeaturedVehicles } from "@/features/vehicles/components/public/featured-vehicles";

export const metadata: Metadata = {
    title: "Garage indépendant, entretien et véhicules d’occasion",
    description:
        "Découvrez les prestations de CamboGarage, prenez rendez-vous en ligne et consultez les véhicules d’occasion disponibles.",
};

const quickActions = [
    {
        title: "Prendre rendez-vous",
        description: "Choisir une prestation et demander un créneau.",
        href: "/dashboard/appointments/new",
    },
    {
        title: "Accéder à mon espace",
        description: "Consulter mes rendez-vous et le suivi de mes véhicules.",
        href: "/dashboard",
    },
    {
        title: "Voir les véhicules d’occasion",
        description: "Parcourir les véhicules actuellement au catalogue.",
        href: "/vehicles",
    },
];

const services = [
    {
        title: "Entretien",
        description:
            "Vidange, contrôles courants et entretien adapté à votre véhicule.",
    },
    {
        title: "Réparation",
        description:
            "Prise en charge des réparations mécaniques après un diagnostic clair.",
    },
    {
        title: "Diagnostic",
        description:
            "Recherche de l’origine d’un voyant, d’un bruit ou d’un dysfonctionnement.",
    },
    {
        title: "Véhicules d’occasion",
        description:
            "Consultez les véhicules disponibles et leurs informations détaillées.",
        href: "/vehicles",
    },
];

const appointmentSteps = [
    {
        title: "Choisissez une prestation",
        description: "Indiquez simplement le motif de votre visite.",
    },
    {
        title: "Sélectionnez un créneau",
        description: "Renseignez votre véhicule et choisissez une disponibilité.",
    },
    {
        title: "Suivez votre demande",
        description: "Retrouvez son avancement depuis votre espace client.",
    },
];

export default function HomePage() {
    return (
        <main className="flex flex-1 flex-col overflow-hidden bg-canvas">
            <section className="border-b border-line/70 bg-canvas">
                <div className="mx-auto grid w-full max-w-[76rem] gap-10 px-5 py-12 sm:px-6 sm:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14 lg:py-16">
                    <div className="max-w-2xl">
                        <p className="text-sm font-semibold text-accent">
                            Garage automobile indépendant à Namur
                        </p>

                        <h1 className="mt-4 text-4xl leading-[1.08] font-semibold tracking-[-0.035em] text-ink sm:text-5xl lg:text-[3.5rem]">
                            Entretien et réparation automobile à Namur
                        </h1>

                        <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">
                            Prenez rendez-vous en ligne, suivez vos interventions
                            et retrouvez les informations de votre véhicule depuis
                            votre espace client.
                        </p>

                        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/dashboard/appointments/new"
                                prefetch={false}
                                className="btn-primary min-h-12 px-5 py-3"
                            >
                                Prendre rendez-vous
                            </Link>
                            <Link
                                href="/vehicles"
                                className="btn-ghost min-h-12 px-5 py-3"
                            >
                                Voir les véhicules d’occasion
                            </Link>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                            <Link
                                href="/#atelier"
                                className="text-link inline-flex min-h-11 items-center"
                            >
                                Coordonnées et horaires
                            </Link>
                            <Link
                                href="/dashboard"
                                prefetch={false}
                                className="inline-flex min-h-11 items-center font-medium text-muted transition hover:text-ink"
                            >
                                Accéder à mon espace
                            </Link>
                        </div>
                    </div>

                    <aside
                        aria-labelledby="quick-actions-title"
                        className="rounded-xl border border-line bg-surface p-5 shadow-[0_12px_30px_rgba(0,0,0,0.12)] sm:p-6"
                    >
                        <h2
                            id="quick-actions-title"
                            className="text-xl font-semibold tracking-tight"
                        >
                            Que souhaitez-vous faire ?
                        </h2>
                        <nav
                            aria-label="Actions rapides"
                            className="mt-4 divide-y divide-line"
                        >
                            {quickActions.map((action) => (
                                <Link
                                    key={action.href}
                                    href={action.href}
                                    prefetch={
                                        !action.href.startsWith("/dashboard")
                                    }
                                    className="group flex min-h-20 items-center justify-between gap-5 py-4 first:pt-2 last:pb-2"
                                >
                                    <span>
                                        <span className="block text-sm font-semibold text-ink transition group-hover:text-accent">
                                            {action.title}
                                        </span>
                                        <span className="mt-1 block text-sm leading-5 text-muted">
                                            {action.description}
                                        </span>
                                    </span>
                                    <span
                                        className="shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent"
                                        aria-hidden
                                    >
                                        →
                                    </span>
                                </Link>
                            ))}
                        </nav>
                    </aside>
                </div>

                <div className="border-t border-line/70 bg-surface-soft/55">
                    <dl className="mx-auto grid max-w-[76rem] gap-px bg-line/70 sm:grid-cols-3">
                        <div className="bg-surface-soft px-5 py-4 sm:px-6">
                            <dt className="text-xs font-medium text-faint">
                                Localisation
                            </dt>
                            <dd className="mt-1 text-sm font-semibold text-ink">
                                Namur
                            </dd>
                        </div>
                        <div className="bg-surface-soft px-5 py-4 sm:px-6">
                            <dt className="text-xs font-medium text-faint">
                                Accès
                            </dt>
                            <dd className="mt-1 text-sm font-semibold text-ink">
                                Garage indépendant
                            </dd>
                        </div>
                        <div className="bg-surface-soft px-5 py-4 sm:px-6">
                            <dt className="text-xs font-medium text-faint">
                                Réservation
                            </dt>
                            <dd className="mt-1 text-sm font-semibold text-ink">
                                Rendez-vous en ligne
                            </dd>
                        </div>
                    </dl>
                </div>
            </section>

            <section
                id="featured-vehicles"
                aria-labelledby="featured-vehicles-title"
                className="border-b border-line/70 bg-surface-soft/30"
            >
                <div className="mx-auto max-w-[76rem] px-5 py-12 sm:px-6 sm:py-14">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-sm font-semibold text-accent">
                                Véhicules d’occasion
                            </p>
                            <h2
                                id="featured-vehicles-title"
                                className="mt-2 text-3xl font-semibold tracking-tight"
                            >
                                Nos occasions à la une
                            </h2>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                                Découvrez une sélection de véhicules actuellement
                                disponibles chez CamboGarage.
                            </p>
                        </div>
                        <Link
                            href="/vehicles"
                            className="btn-ghost min-h-11 w-fit shrink-0"
                        >
                            Voir toutes les occasions
                        </Link>
                    </div>

                    <div className="mt-7">
                        <FeaturedVehicles />
                    </div>
                </div>
            </section>

            <section
                id="services"
                aria-labelledby="services-title"
                className="scroll-mt-18"
            >
                <div className="mx-auto max-w-[76rem] px-5 py-14 sm:px-6 sm:py-16">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-sm font-semibold text-accent">
                                Services principaux
                            </p>
                            <h2
                                id="services-title"
                                className="mt-2 text-3xl font-semibold tracking-tight"
                            >
                                L’essentiel pour votre véhicule
                            </h2>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                                Des prestations courantes, présentées simplement
                                pour vous aider à préparer votre demande.
                            </p>
                        </div>
                        <Link
                            href="/dashboard/appointments/new"
                            prefetch={false}
                            className="btn-ghost min-h-11 w-fit shrink-0"
                        >
                            Demander un rendez-vous
                        </Link>
                    </div>

                    <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {services.map((service) => (
                            <article
                                key={service.title}
                                className="rounded-xl border border-line bg-surface p-5 shadow-[0_8px_20px_rgba(0,0,0,0.08)]"
                            >
                                <h3 className="text-lg font-semibold">
                                    {service.title}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-muted">
                                    {service.description}
                                </p>
                                {service.href && (
                                    <Link
                                        href={service.href}
                                        className="text-link mt-4 inline-flex min-h-11 items-center"
                                    >
                                        Consulter le catalogue
                                    </Link>
                                )}
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section
                aria-labelledby="appointment-steps-title"
                className="border-t border-line/70 bg-surface-soft/45"
            >
                <div className="mx-auto max-w-[76rem] px-5 py-14 sm:px-6 sm:py-16">
                    <div className="grid gap-8 lg:grid-cols-[0.55fr_1.45fr] lg:items-start">
                        <div>
                            <p className="text-sm font-semibold text-accent">
                                Rendez-vous en ligne
                            </p>
                            <h2
                                id="appointment-steps-title"
                                className="mt-2 text-3xl font-semibold tracking-tight"
                            >
                                Une demande simple à suivre
                            </h2>
                            <Link
                                href="/dashboard/appointments/new"
                                prefetch={false}
                                className="btn-primary mt-6 min-h-11 w-fit"
                            >
                                Prendre rendez-vous
                            </Link>
                        </div>

                        <ol className="grid gap-4 md:grid-cols-3">
                            {appointmentSteps.map((step, index) => (
                                <li
                                    key={step.title}
                                    className="border-l-2 border-line pl-4"
                                >
                                    <span className="text-sm font-semibold text-accent">
                                        {index + 1}
                                    </span>
                                    <h3 className="mt-2 font-semibold text-ink">
                                        {step.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-muted">
                                        {step.description}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </section>
        </main>
    );
}
