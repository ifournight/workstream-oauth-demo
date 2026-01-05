"use client";

import type { HTMLAttributes } from "react";
import Image from "next/image";
import { cx } from "@/utils/cx";

export const UntitledLogo = (props: HTMLAttributes<HTMLDivElement>) => {
    return (
        <div {...props} className={cx("flex h-8 w-max items-center justify-start overflow-visible", props.className)}>
            <Image
                src="/logo_blue.svg"
                alt="Workstream"
                width={120}
                height={32}
                className="h-full w-auto"
                priority
            />
        </div>
    );
};
