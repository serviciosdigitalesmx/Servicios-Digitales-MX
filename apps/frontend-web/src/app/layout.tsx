import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Servicios Digitales MX",
  description: "Plataforma SaaS para talleres y servicios técnicos"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
