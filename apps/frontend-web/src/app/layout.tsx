import type { Metadata } from "next";
import { Inter, Orbitron, Rajdhani } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-orbitron",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-rajdhani",
});

export const metadata: Metadata = {
  title: "Servicios Digitales MX",
  description: "Plataforma SaaS para talleres y servicios técnicos"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${orbitron.variable} ${rajdhani.variable}`}>
      <body>{children}</body>
    </html>
  );
}
