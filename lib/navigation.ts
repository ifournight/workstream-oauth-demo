"use client";

import type { NavItemType } from "@/components/application/app-navigation/config";
import { 
    Users01, 
    Key01, 
    Settings01,
    FileCode02,
    Server01
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
                label: "Global Clients",
                href: "/clients",
                icon: Users01,
            },
            {
                label: "Identity-Specific Clients",
                href: "/identity-clients",
                icon: Key01,
            },
        ],
    },
    {
        label: "Flows",
        items: [
            {
                label: "Authorization Code",
                href: "/auth",
                icon: FileCode02,
            },
            {
                label: "Device Authorization",
                href: "/device-demo",
                icon: FileCode02,
            },
            {
                label: "Client Credentials",
                href: "/client-credentials-demo",
                icon: Server01,
            },
        ],
    },
    {
        label: "Settings",
        items: [
            {
                label: "Configuration",
                href: "/config",
                icon: Settings01,
            },
        ],
    },
];

