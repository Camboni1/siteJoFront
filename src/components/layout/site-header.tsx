import Link from "next/link";
import { MainNavigation } from "@/components/layout/main-navigation";
import { Brand } from "@/components/ui/brand";

export function SiteHeader() {
    return (
        <header className="site-header">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5 sm:px-6">
                <Link
                    href="/"
                    aria-label="CamboGarage — accueil"
                    className="shrink-0"
                >
                    <Brand />
                </Link>
                <MainNavigation />
            </div>
        </header>
    );
}
