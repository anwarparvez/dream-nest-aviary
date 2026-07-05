"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderTree,
  Bird,
  Image,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  TrendingUp,
  Package,
  ShoppingCart,
  Heart,
  Skull,
  Egg,
  Users,
  Award,
  Calendar,
  FileText,
  Bell,
  HelpCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface MenuItem {
  href: string;
  label: string;
  icon: any;
  badge?: number;
  subItems?: MenuItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([
    "farm-management",
  ]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId],
    );
  };

  const menuItems: MenuItem[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/projects",
      label: "Projects",
      icon: FolderTree,
    },
    {
      label: "Farm Management",
      icon: Users,
      subItems: [
        {
          href: "/pairs",
          label: "Bird Pairs",
          icon: Bird,
        },
        {
          href: "/birds",
          label: "Birds Management",
          icon: Heart,
          badge: 0,
        },
        {
          href: "/breeding",
          label: "Breeding Records",
          icon: Egg,
        },
        {
          href: "/inventory",
          label: "Inventory",
          icon: Package,
        },
      ],
    },
    {
      label: "Financial",
      icon: DollarSign,
      subItems: [
        {
          href: "/expenses",
          label: "Expenses",
          icon: ShoppingCart,
        },
        {
          href: "/income",
          label: "Income",
          icon: TrendingUp,
        },
      ],
    },
    {
      label: "Reports",
      icon: BarChart3,
      subItems: [
        {
          href: "/reports",
          label: "Overview",
          icon: BarChart3,
        },
        {
          href: "/reports/project-financial",
          label: "Project Financial",
          icon: DollarSign,
        },
        {
          href: "/reports/breeding",
          label: "Breeding Analytics",
          icon: Egg,
        },
      ],
    },
    {
      href: "/gallery",
      label: "Gallery",
      icon: Image,
    },
    {
      href: "/analytics",
      label: "Analytics",
      icon: BarChart3,
    },
    {
      label: "Settings",
      icon: Settings,
      subItems: [
        {
          href: "/settings",
          label: "General",
          icon: Settings,
        },
        {
          href: "/settings/notifications",
          label: "Notifications",
          icon: Bell,
        },
        {
          href: "/settings/backup",
          label: "Backup",
          icon: FileText,
        },
      ],
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/login", redirect: true });
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out", {
        description: "Please try again.",
      });
    }
  };

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const isSubItemActive = (subItems?: MenuItem[]) => {
    if (!subItems) return false;
    return subItems.some((item) => isActive(item.href));
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 dark:bg-gray-950 dark:border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
          Dream Nest Aviary
        </h1>
        <p className="text-xs text-gray-500 mt-1">Farm Management System</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-3 space-y-1">
          {menuItems.map((item, index) => (
            <div key={index}>
              {item.subItems ? (
                // Dropdown menu item
                <div>
                  <button
                    onClick={() =>
                      toggleMenu(item.label.toLowerCase().replace(" ", "-"))
                    }
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                      isSubItemActive(item.subItems) &&
                        "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </div>
                    {expandedMenus.includes(
                      item.label.toLowerCase().replace(" ", "-"),
                    ) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  {expandedMenus.includes(
                    item.label.toLowerCase().replace(" ", "-"),
                  ) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.subItems.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          href={subItem.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                            isActive(subItem.href)
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                          )}
                        >
                          <subItem.icon className="h-3 w-3" />
                          {subItem.label}
                          {subItem.badge !== undefined && subItem.badge > 0 && (
                            <span className="ml-auto bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded-full">
                              {subItem.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Regular menu item
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          onClick={() => router.push("/help")}
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          Help & Support
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>

        {/* Version info */}
        <div className="px-3 pt-2">
          <p className="text-xs text-gray-400">Version 2.0.0</p>
          <p className="text-xs text-gray-400">© 2024 Dream Nest Aviary</p>
        </div>
      </div>
    </aside>
  );
}
