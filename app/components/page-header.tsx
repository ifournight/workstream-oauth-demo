"use client";

import React from "react";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import type { BreadcrumbItem } from "@/types";

interface PageHeaderProps {
    title: string;
    breadcrumbs?: BreadcrumbItem[];
    description?: string;
    actions?: React.ReactNode;
    children?: React.ReactNode;
}

export function PageHeader({ title, breadcrumbs, description, actions, children }: PageHeaderProps) {
    return (
        <div className="mb-8">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
                <Breadcrumbs className="mb-4">
                    {breadcrumbs.map((crumb, index) => (
                        <Breadcrumbs.Item key={index} href={crumb.href}>
                            {crumb.label}
                        </Breadcrumbs.Item>
                    ))}
                </Breadcrumbs>
            )}

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

