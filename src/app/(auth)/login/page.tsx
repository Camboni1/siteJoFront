"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [email, setEmail] = useState("camboniloic@gmail.com");
    const [password, setPassword] = useState("Underteker1");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError(null);
        setLoading(true);

        try {
            await login({ email, password });
            router.push("/dashboard");
            router.refresh();
        } catch (error) {
            setError(error instanceof Error ? error.message : "Erreur de connexion");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
            <div className="reveal grid w-full max-w-5xl overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_30px_90px_rgba(0,0,0,0.32)] lg:grid-cols-[1.05fr_0.95fr]">
                <section className="p-7 sm:p-10 lg:p-12">
                    <div className="mb-8">
                        <p className="eyebrow">Espace sécurisé</p>
                        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                            Bon retour parmi nous.
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-muted">
                            Connectez-vous pour retrouver vos rendez-vous et
                            suivre vos demandes.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
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
                            {loading ? "Connexion..." : "Se connecter"}
                            {!loading && <span aria-hidden>→</span>}
                        </button>
                    </form>

                    <p className="mt-7 text-center text-sm text-muted">
                    Pas encore de compte ?{" "}
                    <Link
                        href="/register"
                            className="text-link"
                    >
                        Créer un compte
                    </Link>
                </p>
                </section>

                <aside className="relative hidden overflow-hidden border-l border-line bg-surface-soft p-10 lg:flex lg:flex-col lg:justify-between">
                    <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-accent/10 blur-3xl" />
                    <p className="eyebrow relative">CamboGarage / Client</p>

                    <div className="relative">
                        <div className="mb-8 grid grid-cols-3 gap-2">
                            {["Demande", "Confirmé", "Atelier"].map(
                                (step, index) => (
                                    <div
                                        key={step}
                                        className={`h-1 rounded-full ${index < 2 ? "bg-accent" : "bg-line"}`}
                                    />
                                )
                            )}
                        </div>
                        <p className="max-w-sm text-2xl leading-snug font-medium tracking-tight">
                            Votre garage reste accessible, même après la
                            fermeture de l’atelier.
                        </p>
                        <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
                            Gérez vos demandes et consultez leur progression
                            depuis un seul espace.
                        </p>
                    </div>

                    <p className="relative font-mono text-[0.65rem] tracking-[0.12em] text-faint uppercase">
                        Simple · Clair · Disponible
                    </p>
                </aside>
            </div>
        </main>
    );
}
