"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/base/buttons/button";
import { Moon01, Sun } from "@untitledui/icons";
import { useEffect, useState } from "react";

export function ThemeToggle() {
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
                color="secondary"
                size="md"
                iconLeading={Sun}
                isDisabled
            >
                Light
            </Button>
        );
    }

    return (
        <Button
            aria-label="Toggle theme"
            color="secondary"
            size="md"
            iconLeading={theme === "light" ? Moon01 : Sun}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
            {theme === "light" ? "Dark" : "Light"}
        </Button>
    );
}

