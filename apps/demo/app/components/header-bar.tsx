"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { LocaleSwitcher } from "@/app/components/locale-switcher";
import { Avatar } from "@/components/base/avatar/avatar";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Button } from "@/components/base/buttons/button";
import { LogOut01, User01 } from "@untitledui/icons";
import { useAuth } from "@/hooks/use-auth";
import { useBreadcrumbs } from "@/lib/breadcrumbs";

export function HeaderBar() {
    const { breadcrumbs } = useBreadcrumbs();
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const t = useTranslations('common');

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

            {/* Right: Locale Switcher + Theme Toggle + User Menu */}
            <div className="flex items-center gap-3">
                <LocaleSwitcher noBorder />
                <ThemeToggle iconOnly />
                
                {isAuthenticated && user && (
                    <Dropdown.Root>
                        <Button
                            color="tertiary"
                            size="sm"
                            className="!p-0 !h-10 !w-10 rounded-full"
                            aria-label="User menu"
                        >
                            <Avatar
                                size="sm"
                                initials={getUserInitials()}
                                contrastBorder={false}
                            />
                        </Button>
                        <Dropdown.Popover>
                            <Dropdown.Menu>
                                <Dropdown.Item
                                    label={t('profile')}
                                    icon={User01}
                                    onAction={() => router.push('/profile')}
                                />
                                <Dropdown.Separator />
                                <Dropdown.Item
                                    label={t('signOut')}
                                    icon={LogOut01}
                                    onAction={logout}
                                />
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown.Root>
                )}
            </div>
        </header>
    );
}

