"use client";

import { usePathname } from "next/navigation";
import { cx } from "@/utils/cx";
import type { NavItemType } from "../config";
import { NavItemBase } from "../base-components/nav-item";

interface SidebarNavigationSectionsSubheadingsProps {
    /** URL of the currently active item. */
    activeUrl?: string;
    /** Additional CSS classes to apply to the list. */
    className?: string;
    /** List of sections with their items. */
    items: Array<{ label: string; items: NavItemType[] }>;
}

export const SidebarNavigationSectionsSubheadings = ({ activeUrl, items, className }: SidebarNavigationSectionsSubheadingsProps) => {
    const pathname = usePathname();
    const currentActiveUrl = activeUrl || pathname;

    return (
        <nav className={cx("flex flex-col gap-6 px-2 lg:px-4", className)}>
            {items.map((section, sectionIndex) => (
                <div key={section.label || sectionIndex}>
                    {/* Section Heading */}
                    <div className="px-3 pt-1.5 pb-1">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">
                            {section.label}
                        </h3>
                    </div>

                    {/* Section Items */}
                    <ul className="flex flex-col">
                        {section.items.map((item) => {
                            const isActive = currentActiveUrl === item.href;
                            return (
                                <li key={item.label} className="py-0.5">
                                    <NavItemBase
                                        href={item.href}
                                        badge={item.badge}
                                        icon={item.icon}
                                        type="link"
                                        current={isActive}
                                    >
                                        {item.label}
                                    </NavItemBase>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
        </nav>
    );
};
