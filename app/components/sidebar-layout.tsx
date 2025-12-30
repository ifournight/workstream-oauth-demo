"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { NavList } from "@/components/application/app-navigation/base-components/nav-list";
import { MobileNavigationHeader } from "@/components/application/app-navigation/base-components/mobile-header";
import { ThemeToggle } from "@/app/components/theme-toggle";
import type { NavItemType } from "@/components/application/app-navigation/config";

interface SidebarLayoutProps {
    children: React.ReactNode;
    navigationItems: NavItemType[];
}

export function SidebarLayout({ children, navigationItems }: SidebarLayoutProps) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-secondary lg:bg-primary">
                <div className="flex h-16 items-center border-b border-secondary px-4">
                    <UntitledLogo />
                </div>
                <nav className="flex-1 overflow-y-auto py-4">
                    <NavList activeUrl={pathname} items={navigationItems} />
                </nav>
                <div className="border-t border-secondary p-4 flex justify-center">
                    <ThemeToggle />
                </div>
            </aside>

            {/* Mobile Sidebar */}
            <MobileNavigationHeader>
                <div className="flex h-full flex-col overflow-y-auto bg-primary px-4 py-6">
                    <div className="mb-4">
                        <UntitledLogo />
                    </div>
                    <NavList activeUrl={pathname} items={navigationItems} />
                    <div className="mt-auto pt-4 border-t border-secondary flex justify-center">
                        <ThemeToggle />
                    </div>
                </div>
            </MobileNavigationHeader>

            {/* Main Content */}
            <div className="flex flex-1 flex-col lg:pl-64">
                <main className="flex-1 p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

