"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/base/buttons/button";
import { Moon01, Sun } from "@untitledui/icons";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
    iconOnly?: boolean;
}

export function ThemeToggle({ iconOnly = false }: ThemeToggleProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button
                aria-label="Toggle theme"
                color="tertiary"
                size="md"
                iconLeading={Sun}
                isDisabled
                className={iconOnly ? "border-none" : ""}
            >
                {iconOnly ? null : "Light"}
            </Button>
        );
    }

    return (
        <Button
            aria-label="Toggle theme"
            color="tertiary"
            size="md"
            iconLeading={theme === "light" ? Moon01 : Sun}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className={iconOnly ? "border-none shadow-none" : ""}
        >
            {iconOnly ? null : (theme === "light" ? "Dark" : "Light")}
        </Button>
    );
}

