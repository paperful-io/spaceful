import type { PointLike } from "spaceful";
import { useEffect, useId, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";

import { cn } from "@/utils/classes.util";

import { useScene, useSceneVersion } from "./hooks";
import { Hud } from "./hud";
import { randomSeeds } from "./scene";
import type { Scene, ShapeSeed } from "./scene";
import { Grid, ShapesLayer } from "./shapes";
import { Toolbar } from "./toolbar";
import { ALL_TOOLS, TOOLS } from "./tools";
import type { CanvasOptions, ToolHandlers, ToolId, Viewport } from "./types";

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 8;

export type SpaceCanvasProps = {
  /** Share a scene with the caller, e.g. to read shapes for a readout. */
  scene?: Scene;
  /** Initial shapes when the canvas owns its scene. */
  seeds?: ShapeSeed[] | (() => ShapeSeed[]);
  tools?: ToolId[];
  initialTool?: ToolId;
  initialOptions?: Partial<CanvasOptions>;
  /** Fill the viewport and grab keyboard focus on mount. */
  fullscreen?: boolean;
  /** Allow wheel zoom and panning. Off for embedded demos so the page scrolls. */
  navigable?: boolean;
  randomCounts?: number[];
  clearable?: boolean;
  hud?: boolean;
  className?: string;
  /** Extra HTML layered over the canvas. */
  children?: ReactNode;
};

/**
 * An SVG canvas over a spaceful `Space`: a grid, the shapes, the active
 * tool's overlay and a floating toolbar.
 */
export function SpaceCanvas({
  scene: sharedScene,
  seeds,
  tools = ALL_TOOLS,
  initialTool = tools[0] ?? "select",
  initialOptions,
  fullscreen = false,
  navigable = fullscreen,
  randomCounts = [],
  clearable = false,
  hud = true,
  className,
  children,
}: SpaceCanvasProps) {
  const ownScene = useScene(sharedScene ? undefined : seeds);
  const scene = sharedScene ?? ownScene;
  const version = useSceneVersion(scene);

  const gridId = `grid${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const handlers = useRef<ToolHandlers>({});

  const [tool, setTool] = useState<ToolId>(initialTool);
  const [view, setView] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [options, setOptions] = useState<CanvasOptions>({
    k: 3,
    maxDistance: Infinity,
    searchMode: "search",
    ...initialOptions,
  });

  const viewRef = useRef(view);
  viewRef.current = view;
  const spaceHeld = useRef(false);
  const pan = useRef<{ x: number; y: number }>(undefined);

  const definition = TOOLS[tool];
  const ActiveTool = definition.Component;

  const setCursor = (cursor: string) => {
    if (svgRef.current && !pan.current && !spaceHeld.current) {
      svgRef.current.style.cursor = cursor;
    }
  };

  const selectTool = (next: ToolId) => {
    if (!tools.includes(next)) return;
    handlers.current = {};
    setTool(next);
    containerRef.current?.focus({ preventScroll: true });
    if (svgRef.current) svgRef.current.style.cursor = TOOLS[next].cursor;
  };

  const toWorld = (clientX: number, clientY: number): PointLike => {
    const box = svgRef.current!.getBoundingClientRect();
    const { x, y, zoom } = viewRef.current;
    return { x: (clientX - box.left - x) / zoom, y: (clientY - box.top - y) / zoom };
  };

  const toolEvent = (event: ReactPointerEvent) => ({
    point: toWorld(event.clientX, event.clientY),
    shiftKey: event.shiftKey,
    timeStamp: event.timeStamp,
  });

  const zoomAt = (clientX: number, clientY: number, factor: number) => {
    const box = svgRef.current!.getBoundingClientRect();
    const sx = clientX - box.left;
    const sy = clientY - box.top;

    setView((current) => {
      const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current.zoom * factor));
      const ratio = zoom / current.zoom;
      return { zoom, x: sx - (sx - current.x) * ratio, y: sy - (sy - current.y) * ratio };
    });
  };

  // React's onWheel is passive, so preventDefault needs a native listener.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !navigable) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();

      if (event.ctrlKey || event.metaKey) {
        zoomAt(event.clientX, event.clientY, Math.exp(-event.deltaY * 0.01));
      } else {
        setView((current) => ({
          ...current,
          x: current.x - event.deltaX,
          y: current.y - event.deltaY,
        }));
      }
    };

    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [navigable]);

  useEffect(() => {
    if (fullscreen) containerRef.current?.focus({ preventScroll: true });
  }, [fullscreen]);

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    containerRef.current?.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);

    const panning =
      navigable && (event.button === 1 || tool === "hand" || spaceHeld.current);

    if (panning) {
      pan.current = { x: event.clientX, y: event.clientY };
      event.currentTarget.style.cursor = "grabbing";
      return;
    }

    if (event.button === 0) handlers.current.down?.(toolEvent(event));
  };

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (pan.current) {
      const dx = event.clientX - pan.current.x;
      const dy = event.clientY - pan.current.y;
      pan.current = { x: event.clientX, y: event.clientY };
      setView((current) => ({ ...current, x: current.x + dx, y: current.y + dy }));
      return;
    }

    handlers.current.move?.(toolEvent(event));
  };

  const onPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (pan.current) {
      pan.current = undefined;
      event.currentTarget.style.cursor =
        spaceHeld.current || tool === "hand" ? "grab" : definition.cursor;
      return;
    }

    handlers.current.up?.(toolEvent(event));
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if ((event.target as HTMLElement).closest("input, textarea, select")) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (handlers.current.key?.(event.nativeEvent)) {
      event.preventDefault();
      return;
    }

    if (event.key === " " && navigable) {
      event.preventDefault();
      if (!spaceHeld.current && svgRef.current) svgRef.current.style.cursor = "grab";
      spaceHeld.current = true;
      return;
    }

    if (event.key === "0" && navigable) {
      setView({ x: 0, y: 0, zoom: 1 });
      return;
    }

    const shortcut = tools.find(
      (id) => TOOLS[id].shortcut.toLowerCase() === event.key.toLowerCase(),
    );
    if (shortcut) {
      event.preventDefault();
      selectTool(shortcut);
    }
  };

  const onKeyUp = (event: React.KeyboardEvent) => {
    if (event.key === " " && spaceHeld.current) {
      spaceHeld.current = false;
      if (svgRef.current) svgRef.current.style.cursor = definition.cursor;
    }
  };

  const addRandom = (count: number) => {
    const box = svgRef.current?.getBoundingClientRect();
    const { x, y, zoom } = viewRef.current;
    const margin = 24;
    const width = box?.width ?? 800;
    const height = box?.height ?? 600;

    scene.seed(
      randomSeeds(count, {
        x: (margin - x) / zoom,
        y: (margin - y) / zoom,
        w: Math.max(1, (width - margin * 2) / zoom),
        // Keep the toolbar area clear.
        h: Math.max(1, (height - margin * 2 - 64) / zoom),
      }),
    );
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onBlur={() => (spaceHeld.current = false)}
      className={cn(
        "relative overflow-hidden bg-shade-50 outline-none select-none",
        fullscreen ? "h-dvh w-full" : "h-full w-full",
        className,
      )}
    >
      <svg
        ref={svgRef}
        className="absolute inset-0 size-full touch-none"
        style={{ cursor: definition.cursor }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => handlers.current.leave?.()}
        onContextMenu={(event) => event.preventDefault()}
      >
        <Grid id={gridId} view={view} />
        <g transform={`translate(${view.x} ${view.y}) scale(${view.zoom})`}>
          <ShapesLayer scene={scene} version={version} />
          {ActiveTool && (
            <ActiveTool
              key={tool}
              scene={scene}
              version={version}
              view={view}
              options={options}
              handlers={handlers}
              setCursor={setCursor}
            />
          )}
        </g>
      </svg>

      {hud && (
        <Hud
          scene={scene}
          className={cn("absolute right-3 top-3", fullscreen && "right-4 top-4")}
        />
      )}

      {children}

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 flex flex-col items-center gap-2 px-3",
          fullscreen ? "bottom-4" : "bottom-3",
        )}
      >
        <p className="hidden rounded-lg bg-shade-50/80 px-2 py-0.5 text-center text-xs text-shade-500 backdrop-blur sm:block">
          {definition.hint}
        </p>
        <Toolbar
          tools={tools}
          tool={tool}
          onTool={selectTool}
          options={options}
          onOptions={(changes) => setOptions((current) => ({ ...current, ...changes }))}
          randomCounts={randomCounts}
          onRandom={addRandom}
          onClear={clearable ? () => scene.clear() : undefined}
        />
      </div>
    </div>
  );
}
