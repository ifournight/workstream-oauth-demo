"use client";

import type { NavItemType } from "@/components/application/app-navigation/config";
import { 
    Key01, 
    Settings01,
    Server01,
    User01
} from "@untitledui/icons";

export type NavigationSection = {
    label: string;
    items: NavItemType[];
};

export const navigationItems: NavigationSection[] = [
    {
        label: "Clients",
        items: [
            {
                label: "My OAuth Clients",
                href: "/identity-clients",
                icon: Key01,
            },
        ],
    },
    {
        label: "Flows",
        items: [
            {
                label: "OAuth Apps Token Flow",
                href: "/oauth-apps-token",
                icon: Server01,
            },
        ],
    },
    {
        label: "Settings",
        items: [
            {
                label: "Profile",
                href: "/profile",
                icon: User01,
            },
            {
                label: "Configuration",
                href: "/config",
                icon: Settings01,
            },
        ],
    },
];

