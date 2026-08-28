import type { Metadata } from "next";
import { Chakra_Petch, Outfit } from "next/font/google";

import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Champions League PVP",
  description: "Arena competitiva de torneos, salas y rankings de Free Fire",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`dark ${outfit.variable} ${chakraPetch.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <main>{children}</main>
      </body>
    </html>
  );
}
