import { Infinity as InfinityIcon, Minus, Plus, Sparkles, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/utils/classes.util";

import { TOOLS } from "./tools";
import type { CanvasOptions, ToolId } from "./types";

/** Slider maximum for the nearest radius; the top stop means "no limit". */
const MAX_RADIUS = 600;

export function Toolbar({
  tools,
  tool,
  onTool,
  options,
  onOptions,
  randomCounts,
  onRandom,
  onClear,
}: {
  tools: ToolId[];
  tool: ToolId;
  onTool(tool: ToolId): void;
  options: CanvasOptions;
  onOptions(options: Partial<CanvasOptions>): void;
  randomCounts: number[];
  onRandom(count: number): void;
  onClear?(): void;
}) {
  const contextual = (
    <>
      {tool === "search" && (
        <Segmented
          value={options.searchMode}
          onChange={(searchMode) => onOptions({ searchMode })}
          items={[
            { value: "search", label: "search" },
            { value: "collides", label: "collides" },
          ]}
        />
      )}

      {tool === "nearest" && (
        <>
          <div className="flex items-center gap-1 text-xs">
            <span className="pl-1 text-shade-500">k</span>
            <IconButton
              label="Fewer"
              onClick={() => onOptions({ k: Math.max(1, options.k - 1) })}
            >
              <Minus className="size-3.5" />
            </IconButton>
            <span className="w-4 text-center tabular-nums">{options.k}</span>
            <IconButton
              label="More"
              onClick={() => onOptions({ k: Math.min(10, options.k + 1) })}
            >
              <Plus className="size-3.5" />
            </IconButton>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <span className="text-shade-500">max</span>
            <input
              type="range"
              min={20}
              max={MAX_RADIUS}
              step={10}
              value={Number.isFinite(options.maxDistance) ? options.maxDistance : MAX_RADIUS}
              onChange={(event) => {
                const value = Number(event.target.value);
                onOptions({ maxDistance: value >= MAX_RADIUS ? Infinity : value });
              }}
              className="w-20 accent-[var(--color-primary)]"
            />
            <span className="flex w-7 justify-end tabular-nums">
              {Number.isFinite(options.maxDistance) ? (
                options.maxDistance
              ) : (
                <InfinityIcon className="size-3.5" />
              )}
            </span>
          </label>
        </>
      )}
    </>
  );

  const hasContext = tool === "search" || tool === "nearest";
  const hasActions = randomCounts.length > 0 || !!onClear;

  return (
    <div
      className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-shade-200 bg-shade-50/85 p-1.5 shadow-lg shadow-shade-900/5 backdrop-blur"
      onPointerDown={(event) => event.stopPropagation()}
    >
      {tools.map((id) => {
        const { icon: Icon, label, shortcut } = TOOLS[id];

        return (
          <IconButton
            key={id}
            label={`${label} (${shortcut})`}
            active={tool === id}
            onClick={() => onTool(id)}
            large
          >
            <Icon className="size-[18px]" strokeWidth={1.75} />
          </IconButton>
        );
      })}

      {hasContext && (
        <>
          <Divider />
          {contextual}
        </>
      )}

      {hasActions && (
        <>
          <Divider />
          {randomCounts.map((count) => (
            <button
              key={count}
              type="button"
              title={`Bulk load ${count} random shapes`}
              onClick={() => onRandom(count)}
              className="flex h-9 shrink-0 items-center gap-1 rounded-xl px-2.5 text-xs text-shade-600 transition hover:bg-shade-200 hover:text-shade-900"
            >
              <Sparkles className="size-3.5" />
              {count >= 1000 ? `${count / 1000}k` : count}
            </button>
          ))}
          {onClear && (
            <IconButton label="Clear all" onClick={onClear} large>
              <Trash2 className="size-[18px]" strokeWidth={1.75} />
            </IconButton>
          )}
        </>
      )}
    </div>
  );
}

function Divider() {
  return <div className="mx-1 h-6 w-px shrink-0 bg-shade-200" />;
}

function IconButton({
  label,
  active,
  large,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  large?: boolean;
  onClick(): void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl text-shade-600 transition hover:bg-shade-200 hover:text-shade-900",
        large ? "size-9" : "size-6 rounded-lg",
        active &&
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Segmented<T extends string>({
  value,
  items,
  onChange,
}: {
  value: T;
  items: { value: T; label: string }[];
  onChange(value: T): void;
}) {
  return (
    <div className="flex shrink-0 rounded-xl bg-shade-200/60 p-0.5 font-mono text-xs">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={cn(
            "rounded-[10px] px-2.5 py-1.5 text-shade-500 transition hover:text-shade-900",
            value === item.value && "bg-shade-50 text-shade-900 shadow-sm",
          )}
        >
          {item.label}()
        </button>
      ))}
    </div>
  );
}
