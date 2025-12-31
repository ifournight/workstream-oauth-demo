"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { SidebarNavigationSectionsSubheadings } from "@/components/application/app-navigation/sidebar-navigation/sidebar-sections-subheadings";
import { MobileNavigationHeader } from "@/components/application/app-navigation/base-components/mobile-header";
import { ThemeToggle } from "@/app/components/theme-toggle";
import type { NavigationSection } from "@/lib/navigation";

interface SidebarLayoutProps {
    children: React.ReactNode;
    navigationItems: NavigationSection[];
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
                <div className="flex-1 overflow-y-auto py-4">
                    <SidebarNavigationSectionsSubheadings activeUrl={pathname} items={navigationItems} />
                </div>
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
                    <SidebarNavigationSectionsSubheadings activeUrl={pathname} items={navigationItems} />
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

