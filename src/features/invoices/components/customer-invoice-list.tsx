"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    usePathname,
    useRouter,
    useSearchParams,
} from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { PageHeader } from "@/components/ui/page-header";
import { isCustomer } from "@/features/auth/lib/roles";
import * as invoicesApi from "@/features/invoices/api/invoices-api";
import { InvoicePagination } from "@/features/invoices/components/invoice-pagination";
import { InvoiceStatusBadge } from "@/features/invoices/components/invoice-status-badge";
import type {
    InvoiceResponse,
    PageResponse,
} from "@/features/invoices/types/invoice.types";
import { isApiError } from "@/lib/api";
import { formatCurrency, formatDateShort } from "@/lib/format";

const PAGE_SIZE = 20;

function pageFromSearch(value: string | null) {
    if (!value?.trim()) {
        return 0;
    }

    const parsed = Number(value);

    return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export function CustomerInvoiceList() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user, loading } = useAuth();
    const requestedPage = pageFromSearch(searchParams.get("page"));

    const [result, setResult] = useState<PageResponse<InvoiceResponse> | null>(
        null
    );
    const [loadedPage, setLoadedPage] = useState<number | null>(null);
    const [redirecting, setRedirecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!user) {
            router.replace("/login");
        } else if (!isCustomer(user)) {
            router.replace("/dashboard");
        }
    }, [loading, user, router]);

    useEffect(() => {
        if (!user || !isCustomer(user)) {
            return;
        }

        let ignore = false;

        invoicesApi
            .getCustomerInvoices(requestedPage, PAGE_SIZE)
            .then((page) => {
                if (ignore) {
                    return;
                }

                setResult(page);
                setError(null);

                if (page.totalPages > 0 && requestedPage >= page.totalPages) {
                    router.replace(`${pathname}?page=${page.totalPages - 1}`);
                }
            })
            .catch((requestError) => {
                if (ignore) {
                    return;
                }

                setResult(null);

                if (isApiError(requestError, 401)) {
                    setRedirecting(true);
                    router.replace("/login");
                    return;
                }

                if (isApiError(requestError, 403)) {
                    setRedirecting(true);
                    router.replace("/dashboard");
                    return;
                }

                setError(
                    requestError instanceof Error
                        ? requestError.message
                        : "Impossible de charger vos factures"
                );
            })
            .finally(() => {
                if (!ignore) {
                    setLoadedPage(requestedPage);
                }
            });

        return () => {
            ignore = true;
        };
    }, [user, requestedPage, pathname, router]);

    function changePage(page: number) {
        router.push(`${pathname}?page=${page}`);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (loading || !user || !isCustomer(user) || redirecting) {
        return <LoadingScreen />;
    }

    const pageIsLoaded = loadedPage === requestedPage;
    const currentResult = pageIsLoaded ? result : null;
    const currentError = pageIsLoaded ? error : null;

    return (
        <main className="flex-1">
            <PageHeader
                title="Mes factures"
                backHref="/dashboard"
                backLabel="Tableau de bord"
            />

            <section className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-6 sm:py-10">
                <div>
                    <p className="eyebrow">Documents</p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight">
                        Factures émises
                    </h2>
                    <p className="mt-2 text-sm text-muted">
                        Consultez vos factures et téléchargez leur version PDF.
                    </p>
                </div>

                {currentError && (
                    <div className="alert-error" role="alert">
                        {currentError}
                    </div>
                )}

                {!pageIsLoaded ? (
                    <div className="empty-state">
                        Chargement de vos factures...
                    </div>
                ) : !currentResult || currentResult.content.length === 0 ? (
                    !currentError && (
                        <div className="empty-state">
                            Aucune facture émise n&apos;est disponible pour le
                            moment.
                        </div>
                    )
                ) : (
                    <>
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-sm text-muted">
                                {currentResult.totalElements} facture
                                {currentResult.totalElements !== 1 ? "s" : ""}
                            </p>
                            <p className="font-mono text-xs text-faint">
                                Page {currentResult.page + 1} /{" "}
                                {currentResult.totalPages}
                            </p>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
                            <table className="w-full text-left text-sm">
                                <caption className="sr-only">
                                    Liste de mes factures émises
                                </caption>
                                <thead className="border-b border-line bg-surface-soft font-mono text-[0.65rem] tracking-wider text-faint uppercase">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 font-semibold"
                                        >
                                            Numéro
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 font-semibold"
                                        >
                                            Date
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 font-semibold"
                                        >
                                            Échéance
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 font-semibold"
                                        >
                                            Statut
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 text-right font-semibold"
                                        >
                                            Total TVAC
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 font-semibold"
                                        >
                                            Devise
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentResult.content.map((invoice) => (
                                        <tr
                                            key={invoice.id}
                                            onClick={() =>
                                                router.push(
                                                    `/dashboard/invoices/${invoice.id}`
                                                )
                                            }
                                            className="cursor-pointer border-b border-line/70 transition last:border-b-0 hover:bg-surface-raised"
                                        >
                                            <td className="px-6 py-4 font-mono text-xs font-medium">
                                                <Link
                                                    href={`/dashboard/invoices/${invoice.id}`}
                                                    className="hover:text-accent"
                                                    onClick={(event) =>
                                                        event.stopPropagation()
                                                    }
                                                    aria-label={`Consulter la facture ${invoice.invoiceNumber}`}
                                                >
                                                    {invoice.invoiceNumber}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-muted">
                                                {formatDateShort(
                                                    invoice.invoiceDate
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-muted">
                                                {invoice.dueDate
                                                    ? formatDateShort(
                                                          invoice.dueDate
                                                      )
                                                    : "—"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <InvoiceStatusBadge
                                                    status={invoice.status}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium">
                                                {formatCurrency(
                                                    invoice.amountIncludingVat,
                                                    invoice.currency
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-muted">
                                                {invoice.currency}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <InvoicePagination
                            page={currentResult.page}
                            totalPages={currentResult.totalPages}
                            first={currentResult.first}
                            last={currentResult.last}
                            onPageChange={changePage}
                        />
                    </>
                )}
            </section>
        </main>
    );
}
