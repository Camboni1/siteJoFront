"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Brand } from "@/components/ui/brand";

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
        <main className="flex min-h-screen items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="card p-8">
                    <div className="mb-8">
                        <Brand />
                        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
                            Connexion
                        </h1>
                        <p className="mt-1 text-sm text-neutral-400">
                            Connecte-toi à ton espace.
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
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-sm text-neutral-400">
                    Pas encore de compte ?{" "}
                    <Link
                        href="/register"
                        className="font-medium text-white underline-offset-4 hover:underline"
                    >
                        Créer un compte
                    </Link>
                </p>
            </div>
        </main>
    );
}
