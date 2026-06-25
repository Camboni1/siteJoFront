import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Garage Jojo",
  description: "Site de gestion du garage Jojo",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="fr">
      <body>
      <AuthProvider>{children}</AuthProvider>
      </body>
      </html>
  );
}