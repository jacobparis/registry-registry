"use client";

import * as React from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyCommandProps extends React.HTMLAttributes<HTMLDivElement> {
  command: string;
  variant?: "default" | "minimal";
}

export function CopyCommand({
  command,
  variant = "default",
  className,
  ...props
}: CopyCommandProps) {
  const [hasCopied, setHasCopied] = React.useState(false);

  async function copyToClipboard() {
    await navigator.clipboard.writeText(command);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  }

  return (
    <div
      className={cn(
        "relative group font-mono text-sm",
        variant === "default" && "bg-gray-100 dark:bg-gray-900 rounded-lg px-4 py-2",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
        <span className="flex-1 overflow-x-auto whitespace-nowrap font-mono">{command}</span>
        <button
          onClick={copyToClipboard}
          className={cn(
            "flex-shrink-0 h-7 w-7 rounded-md inline-flex items-center justify-center transition-colors",
            variant === "default" 
              ? "hover:bg-gray-200 dark:hover:bg-gray-800" 
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          )}
        >
          {hasCopied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="sr-only">
            {hasCopied ? "Copied" : "Copy command"}
          </span>
        </button>
      </div>
      {variant === "default" && (
        <div className="absolute left-1 right-1 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
} 