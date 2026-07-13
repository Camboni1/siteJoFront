export function LoadingScreen() {
    return (
        <main className="flex min-h-[50vh] flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-muted">
                <div
                    className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent"
                    role="status"
                    aria-label="Chargement"
                />
                <span className="font-mono text-[0.65rem] tracking-[0.16em] uppercase">
                    Chargement
                </span>
            </div>
        </main>
    );
}
