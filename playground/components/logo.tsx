import { cn } from "@/utils/classes.util";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <svg viewBox="0 0 48 48" className="size-7" aria-hidden>
        <rect width="48" height="48" rx="10" className="fill-secondary-dark dark:fill-shade-200" />
        <rect
          x="9"
          y="11"
          width="18"
          height="14"
          rx="2"
          fill="none"
          stroke="var(--color-primary-light)"
          strokeWidth="3"
        />
        <path
          d="M22 38 L39 30 L33 17 Z"
          fill="var(--color-primary-light)"
          fillOpacity="0.35"
          stroke="var(--color-primary-light)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-display text-lg font-semibold text-shade-900">spaceful</span>
    </span>
  );
}
