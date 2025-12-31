"use client";

import Link from "next/link";
import { ChevronRight } from "@untitledui/icons";
import { cx } from "@/utils/cx";

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface PageHeaderProps {
    title: string;
    breadcrumbs?: BreadcrumbItem[];
    description?: string;
    actions?: React.ReactNode;
}

export function PageHeader({ title, breadcrumbs, description, actions }: PageHeaderProps) {
    return (
        <div className="mb-8">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="mb-4" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2 text-sm">
                        {breadcrumbs.map((crumb, index) => {
                            const isLast = index === breadcrumbs.length - 1;
                            return (
                                <li key={index} className="flex items-center">
                                    {index > 0 && (
                                        <ChevronRight className="mx-2 size-4 text-tertiary" aria-hidden="true" />
                                    )}
                                    {isLast || !crumb.href ? (
                                        <span className={cx("font-medium", isLast ? "text-primary" : "text-tertiary")}>
                                            {crumb.label}
                                        </span>
                                    ) : (
                                        <Link
                                            href={crumb.href}
                                            className="text-tertiary hover:text-tertiary_hover transition-colors"
                                        >
                                            {crumb.label}
                                        </Link>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </nav>
            )}

            {/* Title and Actions */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary">{title}</h1>
                    {description && (
                        <p className="mt-2 text-md text-tertiary">{description}</p>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}

