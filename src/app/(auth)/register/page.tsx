"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();

    const [firstName, setFirstName] = useState("Loic");
    const [lastName, setLastName] = useState("Camboni");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("Underteker1");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError(null);
        setLoading(true);

        try {
            await register({
                firstName,
                lastName,
                email,
                password,
            });

            router.push("/dashboard");
            router.refresh();
        } catch (error) {
            setError(error instanceof Error ? error.message : "Erreur inscription");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
            <div className="reveal grid w-full max-w-5xl overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_30px_90px_rgba(0,0,0,0.32)] lg:grid-cols-[1.05fr_0.95fr]">
                <section className="p-7 sm:p-10 lg:p-12">
                    <div className="mb-8">
                        <p className="eyebrow">Nouveau client</p>
                        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                            Créez votre espace.
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-muted">
                            Quelques informations suffisent pour prendre votre
                            premier rendez-vous.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="field-label">Prénom</label>
                                <input
                                    className="input"
                                    value={firstName}
                                    onChange={(event) =>
                                        setFirstName(event.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div>
                                <label className="field-label">Nom</label>
                                <input
                                    className="input"
                                    value={lastName}
                                    onChange={(event) =>
                                        setLastName(event.target.value)
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="field-label">Email</label>
                            <input
                                type="email"
                                className="input"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="field-label">Mot de passe</label>
                            <input
                                type="password"
                                className="input"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                required
                            />
                        </div>

                        {error && <div className="alert-error">{error}</div>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3"
                        >
                            {loading ? "Création..." : "Créer mon compte"}
                            {!loading && <span aria-hidden>→</span>}
                        </button>
                    </form>

                    <p className="mt-7 text-center text-sm text-muted">
                    Déjà un compte ?{" "}
                    <Link
                        href="/login"
                            className="text-link"
                    >
                        Se connecter
                    </Link>
                </p>
                </section>

                <aside className="relative hidden overflow-hidden border-l border-line bg-surface-soft p-10 lg:flex lg:flex-col lg:justify-between">
                    <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-accent/10 blur-3xl" />
                    <p className="eyebrow relative">CamboGarage / Bienvenue</p>

                    <div className="relative space-y-3">
                        {[
                            ["01", "Choisissez une prestation"],
                            ["02", "Réservez votre créneau"],
                            ["03", "Suivez votre rendez-vous"],
                        ].map(([number, label]) => (
                            <div
                                key={number}
                                className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4"
                            >
                                <span className="font-mono text-xs text-accent">
                                    {number}
                                </span>
                                <span className="text-sm font-medium">
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>

                    <p className="relative font-mono text-[0.65rem] tracking-[0.12em] text-faint uppercase">
                        Votre temps compte aussi
                    </p>
                </aside>
            </div>
        </main>
    );
}
