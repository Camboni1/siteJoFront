import Link from "next/link";
import type { ReactNode } from "react";

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
        <header className="border-b border-line/70 bg-surface-soft/55">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-6">
                <div className="min-w-0">
                    {backHref ? (
                        <Link
                            href={backHref}
                            className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-accent"
                        >
                            <span aria-hidden>←</span>
                            {backLabel}
                        </Link>
                    ) : null}

                    <h1 className="truncate text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                        {title}
                    </h1>
                </div>

                {action}
            </div>
        </header>
    );
}
