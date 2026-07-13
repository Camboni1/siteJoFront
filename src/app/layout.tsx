import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

const geist = Geist({
    subsets: ["latin"],
    variable: "--font-geist-sans",
});

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
        <html lang="fr" className={geist.variable}>
            <body>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
