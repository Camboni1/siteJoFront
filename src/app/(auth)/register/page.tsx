"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Brand } from "@/components/ui/brand";

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
        <main className="flex min-h-screen items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="card p-8">
                    <div className="mb-8">
                        <Brand />
                        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
                            Créer un compte
                        </h1>
                        <p className="mt-1 text-sm text-neutral-400">
                            Crée ton espace client en une minute.
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
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-sm text-neutral-400">
                    Déjà un compte ?{" "}
                    <Link
                        href="/login"
                        className="font-medium text-white underline-offset-4 hover:underline"
                    >
                        Se connecter
                    </Link>
                </p>
            </div>
        </main>
    );
}
