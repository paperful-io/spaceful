import { Moon, Sun } from "lucide-react";

import { cn } from "@/utils/classes.util";

/** Flips between light and dark, matching the init script in the root route. */
export function ThemeToggle({ className }: { className?: string }) {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.classList.contains("dark") ? "light" : "dark";

    root.classList.remove("light", "dark");
    root.classList.add(next);
    root.setAttribute("data-theme", next);
    root.style.colorScheme = next;

    try {
      window.localStorage.setItem("theme", next);
    } catch {
      // Storage can be unavailable (private mode); the toggle still works.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title="Toggle theme"
      aria-label="Toggle theme"
      className={cn(
        "flex size-9 items-center justify-center rounded-xl text-shade-600 transition hover:bg-shade-200 hover:text-shade-900",
        className,
      )}
    >
      <Sun className="size-[18px] dark:hidden" strokeWidth={1.75} />
      <Moon className="hidden size-[18px] dark:block" strokeWidth={1.75} />
    </button>
  );
}
