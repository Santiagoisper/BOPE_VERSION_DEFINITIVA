import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BOPE WAR ROOM',
  description: 'BOPE Battalion Command & Control — COMMANDER: SANTIAGO ISBERT PERLENDER',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
