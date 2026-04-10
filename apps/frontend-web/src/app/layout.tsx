import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Servicios Digitales MX',
  description: 'Gestión Inteligente para Microelectrónica',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-[#0A0F1C] text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
