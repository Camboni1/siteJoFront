import Link from "next/link";

export default function HomePage() {
  return (
      <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">
            Garage Jojo
          </p>

          <h1 className="mt-6 text-5xl font-bold">
            Gestion garage simple et efficace
          </h1>

          <p className="mt-6 text-neutral-400">
            Espace client, rendez-vous, véhicules, factures et administration.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <Link
                href="/login"
                className="rounded-xl bg-white px-5 py-3 font-semibold text-neutral-950 transition hover:bg-neutral-200"
            >
              Connexion
            </Link>

            <Link
                href="/register"
                className="rounded-xl border border-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white hover:text-neutral-950"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </main>
  );
}