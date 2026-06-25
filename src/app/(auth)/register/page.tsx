"use client";

import { FormEvent, useState } from "react";
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
        <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-8 shadow-2xl">
                <div className="mb-8">
                    <p className="text-sm text-neutral-400">Garage Jojo</p>
                    <h1 className="mt-2 text-3xl font-bold">Créer un compte</h1>
                    <p className="mt-2 text-neutral-400">
                        Crée un compte client.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-2 block text-sm text-neutral-300">
                                Prénom
                            </label>
                            <input
                                className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-white/30"
                                value={firstName}
                                onChange={(event) => setFirstName(event.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm text-neutral-300">
                                Nom
                            </label>
                            <input
                                className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-white/30"
                                value={lastName}
                                onChange={(event) => setLastName(event.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-neutral-300">
                            Email
                        </label>
                        <input
                            type="email"
                            className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-white/30"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-neutral-300">
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-white/30"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-neutral-950 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Création..." : "Créer mon compte"}
                    </button>
                </form>
            </div>
        </main>
    );
}