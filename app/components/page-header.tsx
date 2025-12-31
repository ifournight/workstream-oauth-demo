"use client";

import React from "react";
import type { BreadcrumbItem } from "@/types";

interface PageHeaderProps {
    title: string;
    breadcrumbs?: BreadcrumbItem[]; // Deprecated: breadcrumbs are now in HeaderBar
    description?: string;
    actions?: React.ReactNode;
    children?: React.ReactNode;
    /** If true, renders header in a single row with title, search, and actions */
    singleRow?: boolean;
}

export function PageHeader({ title, breadcrumbs, description, actions, children, singleRow }: PageHeaderProps) {
    if (singleRow) {
        return (
            <div className="mb-8">
                {/* Single Row Header: Title, Search, Actions */}
                <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-3xl font-bold text-primary">{title}</h1>
                        {description && (
                            <p className="mt-1 text-sm text-tertiary">{description}</p>
                        )}
                    </div>
                    {children && (
                        <div className="flex-shrink-0">
                            {children}
                        </div>
                    )}
                    {actions && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="mb-8">
            {/* Title and Actions */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-primary">{title}</h1>
                    {description && (
                        <p className="mt-2 text-md text-tertiary">{description}</p>
                    )}
                    {children && (
                        <div className="mt-4">
                            {children}
                        </div>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}

