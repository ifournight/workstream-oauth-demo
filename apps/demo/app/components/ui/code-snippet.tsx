"use client";

import { Copy01, Check, ChevronDown } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { useClipboard } from "@/hooks/use-clipboard";
import { cx } from "@/utils/cx";

interface CodeSnippetProps {
  code: string;
  language?: string;
  title?: string;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export function CodeSnippet({ 
  code, 
  language = "json", 
  title, 
  className,
  collapsible = false,
  defaultOpen = true,
}: CodeSnippetProps) {
  const { copied, copy } = useClipboard();

  const content = (
    <pre className="overflow-x-auto p-4 text-sm">
      <code className={cx("font-mono", `language-${language}`)}>{code}</code>
    </pre>
  );

  if (collapsible) {
    return (
      <details 
        open={defaultOpen}
        className={cx("relative rounded-lg border border-secondary bg-secondary_alt", className)}
      >
        <summary className="flex items-center justify-between cursor-pointer px-4 py-2 border-b border-secondary list-none hover:bg-primary_hover transition-colors">
          <div className="flex items-center gap-2">
            <ChevronDown 
              className="size-4 text-fg-quaternary transition-transform duration-200 [details[open]_&]:rotate-180" 
            />
            {title && (
              <span className="text-sm font-semibold text-secondary">{title}</span>
            )}
          </div>
          <Button
            color="tertiary"
            size="sm"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              copy(code);
            }}
            iconLeading={copied ? Check : Copy01}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </summary>
        <div className="relative">
          {content}
        </div>
      </details>
    );
  }

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
        {content}
      </div>
    </div>
  );
}

