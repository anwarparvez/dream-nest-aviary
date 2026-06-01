import type { Metadata, Viewport } from 'next';
import { Inter, Geist } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Dream Nest Aviary & Farm',
    template: '%s | Dream Nest Aviary',
  },
  description: 'Professional farm management system for pigeons and chickens',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  keywords: ['farm management', 'pigeon breeding', 'chicken farm', 'aviary'],
  authors: [{ name: 'Dream Nest Aviary' }],
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster position="top-right" richColors closeButton expand={false} />
        </Providers>
      </body>
    </html>
  );
}