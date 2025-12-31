"use client";

import type { ReactNode } from "react";
import {
    Dialog as AriaDialog,
    DialogTrigger as AriaDialogTrigger,
    Modal as AriaModal,
    ModalOverlay as AriaModalOverlay,
} from "react-aria-components";
import { cx } from "@/utils/cx";

interface ModalOverlayProps {
    isDismissable?: boolean;
    children: ReactNode;
    className?: string | ((state: { isEntering: boolean; isExiting: boolean }) => string);
}

export const ModalOverlay = ({ isDismissable = true, children, className }: ModalOverlayProps) => {
    return (
        <AriaModalOverlay
            isDismissable={isDismissable}
            className={(state) =>
                cx(
                    "fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-overlay/70 p-4 backdrop-blur-sm",
                    state.isEntering && "duration-300 ease-in-out animate-in fade-in",
                    state.isExiting && "duration-200 ease-in-out animate-out fade-out",
                    typeof className === "function" ? className(state) : className,
                )
            }
        >
            {children}
        </AriaModalOverlay>
    );
};

interface ModalProps {
    children: ReactNode;
    className?: string;
}

export const Modal = ({ children, className }: ModalProps) => {
    return (
        <AriaModal
            className={cx(
                "relative w-full cursor-auto will-change-transform",
                "duration-300 ease-in-out animate-in fade-in zoom-in-95",
                className,
            )}
        >
            {children}
        </AriaModal>
    );
};

interface DialogProps {
    children: ReactNode;
    className?: string;
}

export const Dialog = ({ children, className }: DialogProps) => {
    return (
        <AriaDialog className={cx("outline-hidden focus:outline-hidden", className)}>
            {children}
        </AriaDialog>
    );
};

export { AriaDialogTrigger as DialogTrigger };

