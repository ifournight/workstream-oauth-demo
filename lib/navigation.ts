"use client";

import type { NavItemType } from "@/components/application/app-navigation/config";
import { 
    Users01, 
    Key01, 
    Settings01,
    FileCode02,
    Smartphone01,
    Server01
} from "@untitledui/icons";

export const navigationItems: NavItemType[] = [
    {
        label: "Clients",
        icon: Users01,
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
        icon: FileCode02,
        items: [
            {
                label: "Authorization Code",
                href: "/auth",
                icon: FileCode02,
            },
            {
                label: "Device Authorization",
                href: "/device-demo",
                icon: Smartphone01,
            },
            {
                label: "Client Credentials",
                href: "/client-credentials-demo",
                icon: Server01,
            },
        ],
    },
    {
        label: "Configuration",
        href: "/",
        icon: Settings01,
    },
];

