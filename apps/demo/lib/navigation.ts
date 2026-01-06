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

// Navigation items structure - labels will be translated in components
export const navigationItems: NavigationSection[] = [
    {
        label: "clients", // Translation key
        items: [
            {
                label: "myOAuthClients", // Translation key
                href: "/identity-clients",
                icon: Key01,
            },
        ],
    },
    {
        label: "flows", // Translation key
        items: [
            {
                label: "oauthAppsTokenFlow", // Translation key
                href: "/oauth-apps-token",
                icon: Server01,
            },
        ],
    },
    {
        label: "settings", // Translation key
        items: [
            {
                label: "profile", // Translation key
                href: "/profile",
                icon: User01,
            },
            {
                label: "configuration", // Translation key
                href: "/config",
                icon: Settings01,
            },
        ],
    },
];

