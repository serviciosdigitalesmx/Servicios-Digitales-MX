import type { Metadata } from "next";
import { Inter, Orbitron, Rajdhani } from "next/font/google";
import "./globals.css";

const interFont = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const orbitronFont = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
});

const rajdhaniFont = Rajdhani({
  subsets: ["latin"],
  variable: "--font-rajdhani",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Servicios Digitales MX",
  description: "Plataforma SaaS para talleres y servicios técnicos"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${interFont.variable} ${orbitronFont.variable} ${rajdhaniFont.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
