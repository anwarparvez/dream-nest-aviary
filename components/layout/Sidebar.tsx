'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderTree,
  Bird,
  Image,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Warehouse,
  TrendingUp,
  Users,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderTree },
  { href: '/pairs', label: 'Pairs', icon: Bird },
  { href: '/birds', label: 'Birds', icon: Users },
  { href: '/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/income', label: 'Income', icon: TrendingUp },
  { href: '/gallery', label: 'Gallery', icon: Image },
  { href: '/expenses', label: 'Expenses', icon: DollarSign },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 dark:bg-gray-950 dark:border-gray-800">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
            Dream Nest Aviary
          </h1>
          <p className="text-xs text-gray-500 mt-1">Farm Management System</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}