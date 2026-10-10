import { Check, Copy } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/utils/classes.util";

const KEYWORDS = new Set([
  "import",
  "from",
  "const",
  "let",
  "new",
  "for",
  "of",
  "return",
  "true",
  "false",
  "if",
]);

// Comments, strings, numbers, then words.
const TOKEN = /(\/\/.*$)|("[^"]*"|'[^']*'|`[^`]*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/gm;

/** A tiny TypeScript highlighter; enough for short snippets. */
const highlight = (code: string) => {
  const parts: ReactNode[] = [];
  let last = 0;

  for (const match of code.matchAll(TOKEN)) {
    const [text, comment, string, number, word] = match;
    const index = match.index;
    if (index > last) parts.push(code.slice(last, index));

    const className = comment
      ? "text-shade-400 italic"
      : string
        ? "text-green"
        : number
          ? "text-orange"
          : word && KEYWORDS.has(word)
            ? "text-purple"
            : word && /^[A-Z]/.test(word)
              ? "text-blue"
              : word && code[index + text.length] === "("
                ? "text-primary"
                : undefined;

    parts.push(
      className ? (
        <span key={index} className={className}>
          {text}
        </span>
      ) : (
        text
      ),
    );
    last = index + text.length;
  }

  parts.push(code.slice(last));
  return parts;
};

export function Code({ code, className }: { code: string; className?: string }) {
  return (
    <pre
      className={cn(
        "overflow-x-auto rounded-2xl border border-shade-200 bg-shade-50 p-4 font-mono text-[13px] leading-relaxed text-shade-700",
        className,
      )}
    >
      <code>{highlight(code.trim())}</code>
    </pre>
  );
}

export function InstallCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied; nothing else to do.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="group flex items-center gap-3 rounded-xl border border-shade-200 bg-shade-50 px-4 py-2.5 font-mono text-sm text-shade-700 transition hover:border-shade-300"
    >
      <span className="text-shade-400">$</span>
      {command}
      {copied ? (
        <Check className="size-4 text-primary" />
      ) : (
        <Copy className="size-4 text-shade-400 transition group-hover:text-shade-700" />
      )}
    </button>
  );
}
