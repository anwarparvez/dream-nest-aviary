'use client';

import { SessionProvider } from 'next-auth/react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <Header />
        <main className="pl-64 pt-16">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}