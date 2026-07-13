export function LoadingScreen() {
    return (
        <main className="flex min-h-screen items-center justify-center">
            <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-white"
                role="status"
                aria-label="Chargement"
            />
        </main>
    );
}
