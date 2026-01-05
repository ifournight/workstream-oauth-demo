"use client";

import { useEffect, useRef, type RefObject } from "react";

interface UseResizeObserverOptions {
    ref: RefObject<HTMLElement | null>;
    onResize?: () => void;
    box?: "border-box" | "content-box" | "device-pixel-content-box";
}

/**
 * Custom hook to observe element resize using ResizeObserver API
 * 
 * @param options - Configuration options
 * @param options.ref - React ref to the element to observe
 * @param options.onResize - Callback function called when element is resized
 * @param options.box - Box model to observe (default: "border-box")
 */
export function useResizeObserver({ ref, onResize, box = "border-box" }: UseResizeObserverOptions) {
    const observerRef = useRef<ResizeObserver | null>(null);
    const callbackRef = useRef(onResize);

    // Keep callback ref up to date
    useEffect(() => {
        callbackRef.current = onResize;
    }, [onResize]);

    useEffect(() => {
        const element = ref.current;
        if (!element) {
            return;
        }

        // Create ResizeObserver if it's available
        if (typeof ResizeObserver !== "undefined") {
            observerRef.current = new ResizeObserver((entries) => {
                // Call the callback when resize is detected
                if (callbackRef.current) {
                    callbackRef.current();
                }
            });

            // Start observing the element
            observerRef.current.observe(element, { box });

            // Cleanup function
            return () => {
                if (observerRef.current) {
                    observerRef.current.disconnect();
                    observerRef.current = null;
                }
            };
        } else {
            // Fallback for browsers that don't support ResizeObserver
            // Use a MutationObserver or window resize event as fallback
            console.warn("ResizeObserver is not supported in this browser");
        }
    }, [ref, box]);
}

