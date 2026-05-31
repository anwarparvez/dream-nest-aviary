import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
// @ts-ignore: side-effect CSS import (no type declarations present)
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dream Nest Aviary & Farm',
  description: 'Professional farm management system for pigeons and chickens',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <main className="min-h-screen">{children}</main>
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}