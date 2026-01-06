"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Select } from "@/components/base/select/select";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Moon01, Sun, Monitor01, Check } from "@untitledui/icons";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
    iconOnly?: boolean;
}

export function ThemeToggle({ iconOnly = false }: ThemeToggleProps) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const t = useTranslations('theme');

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Get the current effective theme (resolvedTheme is the actual theme, theme can be 'system')
    const currentTheme = resolvedTheme || theme || 'light';

    // Get icon based on current effective theme
    const getThemeIcon = () => {
        if (currentTheme === 'dark') return Moon01;
        if (currentTheme === 'light') return Sun;
        return Monitor01;
    };

    const themeOptions = [
        { id: 'light', label: t('light'), icon: Sun },
        { id: 'dark', label: t('dark'), icon: Moon01 },
        { id: 'system', label: t('system'), icon: Monitor01 },
    ];

    // Determine selected key: use 'system' if theme is 'system', otherwise use resolved theme
    const selectedKey = theme === 'system' ? 'system' : (currentTheme || 'light');

    // For icon-only mode, use Button + Dropdown for cleaner implementation
    if (iconOnly) {
        if (!mounted) {
            return (
                <Button
                    aria-label={t('toggleTheme')}
                    color="tertiary"
                    size="sm"
                    iconLeading={Sun}
                    isDisabled
                    className="!w-10 !h-10 !p-0 !border-none !shadow-none !bg-transparent hover:!bg-secondary"
                />
            );
        }

        const CurrentIcon = getThemeIcon();

        return (
            <Dropdown.Root>
                <Button
                    aria-label={t('toggleTheme')}
                    color="tertiary"
                    size="sm"
                    iconLeading={CurrentIcon}
                    className="!w-10 !h-10 !p-0 !border-none !shadow-none !bg-transparent hover:!bg-secondary"
                />
                <Dropdown.Popover>
                    <Dropdown.Menu selectedKeys={[selectedKey]} selectionMode="single">
                        {themeOptions.map((option) => {
                            const OptionIcon = option.icon;
                            return (
                                <Dropdown.Item
                                    key={option.id}
                                    id={option.id}
                                    onAction={() => setTheme(option.id)}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                            {OptionIcon && <OptionIcon className="size-4 text-fg-quaternary" />}
                                            <span className="text-sm font-semibold text-secondary">{option.label}</span>
                                        </div>
                                        {selectedKey === option.id && <Check className="size-4 text-brand-primary" />}
                                    </div>
                                </Dropdown.Item>
                            );
                        })}
                    </Dropdown.Menu>
                </Dropdown.Popover>
            </Dropdown.Root>
        );
    }

    // For normal mode, use Select component
    return (
        <Select
            selectedKey={selectedKey}
            onSelectionChange={(key) => {
                const themeValue = typeof key === 'string' ? key : String(key);
                setTheme(themeValue);
            }}
            items={themeOptions}
            placeholderIcon={getThemeIcon()}
            className="w-auto min-w-[100px]"
        >
            {(item) => (
                <Select.Item 
                    id={item.id} 
                    label={item.label}
                    icon={item.icon}
                />
            )}
        </Select>
    );
}

