"use client";

import React from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { Avatar } from "@/components/base/avatar/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useBreadcrumbs } from "@/lib/breadcrumbs";

export function HeaderBar() {
    const { breadcrumbs } = useBreadcrumbs();
    const { user, isAuthenticated } = useAuth();

    // Get user initials for avatar
    const getUserInitials = () => {
        if (user?.identityId) {
            // Use first few characters of identity ID
            return user.identityId.substring(0, 2).toUpperCase();
        }
        return "U";
    };

    return (
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-secondary bg-primary px-6">
            {/* Left: Breadcrumbs */}
            <div className="flex-1 min-w-0">
                {breadcrumbs && breadcrumbs.length > 0 ? (
                    <Breadcrumbs>
                        {breadcrumbs.map((crumb, index) => (
                            <Breadcrumbs.Item key={index} href={crumb.href}>
                                {crumb.label}
                            </Breadcrumbs.Item>
                        ))}
                    </Breadcrumbs>
                ) : (
                    <div className="h-6" />
                )}
            </div>

            {/* Right: Theme Toggle + Profile */}
            <div className="flex items-center gap-3">
                <ThemeToggle iconOnly />
                
                {isAuthenticated && user && (
                    <Link 
                        href="/profile"
                        className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-secondary transition-colors"
                        aria-label="Profile"
                    >
                        <Avatar
                            size="sm"
                            initials={getUserInitials()}
                            contrastBorder={false}
                        />
                    </Link>
                )}
            </div>
        </header>
    );
}

