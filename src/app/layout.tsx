import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/auth-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

export const metadata: Metadata = {
    title: {
        default: "Garage Jojo",
        template: "%s · Garage Jojo",
    },
    description:
        "Garage Jojo — entretien, réparation, véhicules d'occasion et prise de rendez-vous en ligne.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr">
            <body>
                <AuthProvider>
                    <div className="flex min-h-screen flex-col">
                        <SiteHeader />
                        <div className="flex flex-1 flex-col">{children}</div>
                        <SiteFooter />
                    </div>
                </AuthProvider>
            </body>
        </html>
    );
}
