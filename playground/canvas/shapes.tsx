import type { PointLike } from "spaceful";
import { memo } from "react";

import { colorVar, ringToPoints } from "./scene";
import type { Scene, ShapeItem } from "./scene";
import type { Viewport } from "./types";

/** Every shape in the scene. Only re-renders when the scene version changes. */
export const ShapesLayer = memo(function ShapesLayer({
  scene,
}: {
  scene: Scene;
  version: number;
}) {
  return (
    <g>
      {scene.items().map((item) => (
        <polygon
          key={item.id}
          points={ringToPoints(item.geometry.toRing())}
          fill={colorVar(item.meta.color)}
          fillOpacity={0.14}
          stroke={colorVar(item.meta.color)}
          strokeWidth={1.5}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </g>
  );
});

export type Tone = "selected" | "hit" | "collide" | "ghost" | "invalid";

const TONES: Record<
  Tone,
  { stroke: string; fill: string; fillOpacity: number; dash?: string }
> = {
  selected: { stroke: "var(--color-shade-900)", fill: "none", fillOpacity: 0 },
  hit: { stroke: "var(--color-orange)", fill: "var(--color-orange)", fillOpacity: 0.3 },
  collide: { stroke: "var(--color-red)", fill: "var(--color-red)", fillOpacity: 0.25 },
  ghost: {
    stroke: "var(--color-shade-600)",
    fill: "var(--color-shade-500)",
    fillOpacity: 0.08,
    dash: "6 4",
  },
  invalid: {
    stroke: "var(--color-red)",
    fill: "var(--color-red)",
    fillOpacity: 0.08,
    dash: "6 4",
  },
};

/** Draws a ring (any shape outline) on top of the shapes layer. */
export function Outline({
  ring,
  tone,
  closed = true,
}: {
  ring: readonly PointLike[];
  tone: Tone;
  closed?: boolean;
}) {
  const style = TONES[tone];
  const Element = closed ? "polygon" : "polyline";

  return (
    <Element
      points={ringToPoints(ring)}
      fill={closed ? style.fill : "none"}
      fillOpacity={style.fillOpacity}
      stroke={style.stroke}
      strokeWidth={2}
      strokeDasharray={style.dash}
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      pointerEvents="none"
    />
  );
}

export function ItemOutline({ item, tone }: { item: ShapeItem; tone: Tone }) {
  return <Outline ring={item.geometry.toRing()} tone={tone} />;
}

/** Text that keeps the same on-screen size regardless of zoom. */
export function Label({
  at,
  view,
  children,
  dx = 8,
  dy = -8,
}: {
  at: PointLike;
  view: Viewport;
  children: React.ReactNode;
  dx?: number;
  dy?: number;
}) {
  return (
    <g
      transform={`translate(${at.x} ${at.y}) scale(${1 / view.zoom})`}
      pointerEvents="none"
    >
      <text
        x={dx}
        y={dy}
        className="fill-shade-800 text-[11px] font-semibold tabular-nums"
        paintOrder="stroke"
        stroke="var(--color-shade-50)"
        strokeWidth={3}
        strokeLinejoin="round"
      >
        {children}
      </text>
    </g>
  );
}

/** Background grid that pans and zooms with the viewport. */
export function Grid({ id, view }: { id: string; view: Viewport }) {
  const minor = 20 * view.zoom;
  const major = 100 * view.zoom;

  return (
    <>
      <defs>
        <pattern
          id={`${id}-minor`}
          width={minor}
          height={minor}
          x={view.x}
          y={view.y}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${minor} 0 L 0 0 0 ${minor}`}
            fill="none"
            stroke="var(--color-shade-200)"
            strokeWidth={1}
          />
        </pattern>
        <pattern
          id={`${id}-major`}
          width={major}
          height={major}
          x={view.x}
          y={view.y}
          patternUnits="userSpaceOnUse"
        >
          <rect width={major} height={major} fill={`url(#${id}-minor)`} />
          <path
            d={`M ${major} 0 L 0 0 0 ${major}`}
            fill="none"
            stroke="var(--color-shade-300)"
            strokeWidth={1}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id}-major)`} />
    </>
  );
}
