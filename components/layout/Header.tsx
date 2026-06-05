'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, Settings, Bell, Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Get page title from pathname - Updated with new pages
  const getPageTitle = () => {
    if (!pathname) return 'Dashboard';
    const path = pathname.split('/')[1];
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      projects: 'Projects',
      pairs: 'Bird Pairs',
      birds: 'Birds Management',
      inventory: 'Inventory Management',
      income: 'Income Tracking',
      gallery: 'Photo Gallery',
      expenses: 'Expenses',
      reports: 'Reports',
      settings: 'Settings',
    };
    return path && titles[path] ? titles[path] : 'Dashboard';
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!session?.user?.name) return 'U';
    return session.user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ callbackUrl: '/login', redirect: true });
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out', {
        description: 'Please try again.',
      });
      setIsLoggingOut(false);
    }
  };

  if (status === 'loading') {
    return (
      <header className="fixed right-0 top-0 z-30 h-16 bg-white border-b border-gray-200 dark:bg-gray-950 dark:border-gray-800" style={{ left: '16rem' }}>
        <div className="flex h-full items-center justify-between px-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Dashboard
            </h2>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-1"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed right-0 top-0 z-30 h-16 bg-white border-b border-gray-200 dark:bg-gray-950 dark:border-gray-800" style={{ left: '16rem' }}>
      <div className="flex h-full items-center justify-between px-6">
        {/* Page Title */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {getPageTitle()}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Welcome back, {session?.user?.name || 'User'}
          </p>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => {
              toast.info('Notifications', {
                description: 'You have no new notifications',
              });
            }}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* User Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="focus:outline-none"
            >
              <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition">
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback className="bg-emerald-100 text-emerald-700">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 z-50 rounded-md border bg-white shadow-lg dark:bg-gray-950 dark:border-gray-800">
                  <div className="p-3 border-b dark:border-gray-800">
                    <p className="text-sm font-medium">{session?.user?.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{session?.user?.email}</p>
                    <p className="text-xs text-emerald-600 mt-1 capitalize">
                      {(session?.user as any)?.role || 'User'}
                    </p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        router.push('/profile');
                      }}
                      className="flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        router.push('/settings');
                      }}
                      className="flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </button>
                    <div className="h-px bg-gray-200 my-2 dark:bg-gray-800" />
                    <button
                      onClick={handleSignOut}
                      disabled={isLoggingOut}
                      className="flex w-full items-center rounded-md px-2 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                    >
                      {isLoggingOut ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing out...
                        </>
                      ) : (
                        <>
                          <LogOut className="mr-2 h-4 w-4" />
                          Log out
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}