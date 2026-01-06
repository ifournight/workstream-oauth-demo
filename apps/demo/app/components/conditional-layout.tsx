"use client";

import { usePathname } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Users01 } from "@untitledui/icons";
import { AppLayout } from "@/app/components/app-layout";
import { useAuth } from "@/hooks/use-auth";
import type { NavigationSection } from "@/lib/navigation";

interface ConditionalLayoutProps {
    children: React.ReactNode;
    navigationItems: NavigationSection[];
}

// Routes that should be fullscreen (no sidebar, no header)
const FULLSCREEN_ROUTES = ['/login'];

export function ConditionalLayout({ children, navigationItems }: ConditionalLayoutProps) {
    const pathname = usePathname();
    const { user, isAuthenticated } = useAuth();
    const [canManageGlobalClients, setCanManageGlobalClients] = useState(false);
    const isFullscreen = FULLSCREEN_ROUTES.includes(pathname);

    // Check access control via API
    useEffect(() => {
        if (isAuthenticated && user?.identityId) {
            fetch('/api/auth/access-control')
                .then(async (res) => {
                    // Check if response is JSON before parsing
                    const contentType = res.headers.get('content-type')
                    if (!contentType || !contentType.includes('application/json')) {
                        throw new Error('Invalid response type')
                    }
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`)
                    }
                    return res.json()
                })
                .then(data => {
                    setCanManageGlobalClients(data.canManageGlobalClients || false);
                })
                .catch(error => {
                    console.error('Error checking access control:', error);
                    setCanManageGlobalClients(false);
                });
        } else {
            setCanManageGlobalClients(false);
        }
    }, [isAuthenticated, user?.identityId]);

    // Filter navigation items based on access control
    // Note: Translation is handled in SidebarNavigationSectionsSubheadings component
    const filteredNavigationItems = useMemo(() => {
        return navigationItems.map(section => {
            // Add "Global Clients" to Clients section if user has access
            if (section.label === "clients" && canManageGlobalClients) {
                // Check if "Global Clients" already exists in the items
                const hasGlobalClients = section.items.some(item => item.href === "/clients");
                if (!hasGlobalClients) {
                    return {
                        ...section,
                        items: [
                            ...section.items,
                            {
                                label: "globalClients", // Translation key, will be translated in SidebarNavigationSectionsSubheadings
                                href: "/clients",
                                icon: Users01,
                            },
                        ],
                    };
                }
            }
            // Filter out "Global Clients" if user doesn't have access
            if (section.label === "clients" && !canManageGlobalClients) {
                return {
                    ...section,
                    items: section.items.filter(item => item.href !== "/clients"),
                };
            }
            return section;
        });
    }, [navigationItems, canManageGlobalClients]);

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
        <AppLayout navigationItems={filteredNavigationItems}>
            {children}
        </AppLayout>
    );
}

