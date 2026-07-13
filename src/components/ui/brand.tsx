export function Brand() {
    return (
        <span className="inline-flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-accent/35 bg-accent/10 font-mono text-sm font-bold text-accent shadow-[inset_0_1px_rgba(255,255,255,0.04)]">
                JJ
            </span>
            <span className="leading-none">
                <span className="block text-sm font-bold tracking-[0.08em] text-ink uppercase">
                    Garage <span className="text-accent">Jojo</span>
                </span>
                <span className="mt-1 block font-mono text-[0.58rem] tracking-[0.16em] text-faint uppercase">
                    Atelier automobile
                </span>
            </span>
        </span>
    );
}
