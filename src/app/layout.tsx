import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Champions League PVP",
  description: "Plataforma competitiva de torneos, salas y rankings de Free Fire",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-neutral-950 font-sans antialiased">
        <main>{children}</main>
      </body>
    </html>
  );
}
