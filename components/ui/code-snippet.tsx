"use client";

import { useState } from "react";
import { Copy01, Check } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { useClipboard } from "@/hooks/use-clipboard";
import { cx } from "@/utils/cx";

interface CodeSnippetProps {
  code: string;
  language?: string;
  title?: string;
  className?: string;
}

export function CodeSnippet({ code, language = "json", title, className }: CodeSnippetProps) {
  const { copied, copy } = useClipboard();

  return (
    <div className={cx("relative rounded-lg border border-secondary bg-secondary_alt", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-secondary px-4 py-2">
          <span className="text-sm font-semibold text-secondary">{title}</span>
          <Button
            color="tertiary"
            size="sm"
            onClick={() => copy(code)}
            iconLeading={copied ? Check : Copy01}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      )}
      <div className="relative">
        {!title && (
          <div className="absolute right-2 top-2 z-10">
            <Button
              color="tertiary"
              size="sm"
              onClick={() => copy(code)}
              iconLeading={copied ? Check : Copy01}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        )}
        <pre className="overflow-x-auto p-4 text-sm">
          <code className={cx("font-mono", `language-${language}`)}>{code}</code>
        </pre>
      </div>
    </div>
  );
}

