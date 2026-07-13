import Link from "next/link";
import type { ReactNode } from "react";
import { Brand } from "@/components/ui/brand";

export function PageHeader({
    title,
    backHref,
    backLabel,
    action,
}: {
    title: string;
    backHref?: string;
    backLabel?: string;
    action?: ReactNode;
}) {
    return (
        <header className="sticky top-0 z-10 border-b border-white/10 bg-neutral-950/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                    {backHref ? (
                        <Link
                            href={backHref}
                            className="inline-flex items-center gap-1 text-sm text-neutral-400 transition hover:text-white"
                        >
                            <span aria-hidden>←</span>
                            {backLabel}
                        </Link>
                    ) : (
                        <Brand />
                    )}

                    <h1 className="truncate text-xl font-semibold tracking-tight">
                        {title}
                    </h1>
                </div>

                {action}
            </div>
        </header>
    );
}
