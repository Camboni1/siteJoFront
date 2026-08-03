import Link from "next/link";
import { MainNavigation } from "@/components/layout/main-navigation";
import { CamboGarageLogo } from "@/components/ui/brand";

export function SiteHeader() {
    return (
        <header className="site-header">
            <div className="mx-auto flex h-18 max-w-[76rem] items-center gap-3 px-5 sm:gap-4 sm:px-6">
                <Link
                    href="/"
                    aria-label="CamboGarage — accueil"
                    className="flex shrink-0 items-center"
                >
                    <CamboGarageLogo
                        className="h-16 w-auto max-w-32 object-contain"
                        eager
                        sizes="8rem"
                    />
                </Link>
                <MainNavigation />
            </div>
        </header>
    );
}
