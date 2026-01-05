"use client";

import { usePathname } from "next/navigation";
import { AppLayout } from "@/app/components/app-layout";
import type { NavigationSection } from "@/lib/navigation";

interface ConditionalLayoutProps {
    children: React.ReactNode;
    navigationItems: NavigationSection[];
}

// Routes that should be fullscreen (no sidebar, no header)
const FULLSCREEN_ROUTES = ['/login'];

export function ConditionalLayout({ children, navigationItems }: ConditionalLayoutProps) {
    const pathname = usePathname();
    const isFullscreen = FULLSCREEN_ROUTES.includes(pathname);

    if (isFullscreen) {
        // Fullscreen pages get a minimal layout wrapper with proper spacing
        return (
            <div className="min-h-screen bg-primary">
                <main className="p-6 lg:p-8">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <AppLayout navigationItems={navigationItems}>
            {children}
        </AppLayout>
    );
}

