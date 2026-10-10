import { Point } from "spaceful";
import { useState } from "react";

import { useToolHandlers } from "../hooks";
import { closestOnRing } from "../scene";
import type { ShapeItem } from "../scene";
import { ItemOutline, Label } from "../shapes";
import type { ToolProps } from "../types";

/** Move the pointer around; `space.knn` finds the k closest shapes. */
export function NearestTool({ scene, view, options, handlers, setCursor }: ToolProps) {
  const [probe, setProbe] = useState<Point>();
  const [found, setFound] = useState<ShapeItem[]>([]);

  const query = (point: Point) => {
    const items = scene.measure(
      `knn(k=${options.k})`,
      () =>
        scene.space.knn(point, options.k, { maxDistance: options.maxDistance }),
      (result) => `${result.length} found`,
    );

    setProbe(point);
    setFound(items);
  };

  useToolHandlers(
    { handlers },
    {
      move({ point }) {
        setCursor("crosshair");
        query(new Point(point));
      },
      down({ point }) {
        query(new Point(point));
      },
      leave() {
        setProbe(undefined);
        setFound([]);
      },
    },
  );

  if (!probe) return null;

  return (
    <g pointerEvents="none">
      {Number.isFinite(options.maxDistance) && (
        <circle
          cx={probe.x}
          cy={probe.y}
          r={options.maxDistance}
          fill="var(--color-primary)"
          fillOpacity={0.04}
          stroke="var(--color-primary)"
          strokeOpacity={0.5}
          strokeDasharray="4 4"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {found.map((item, rank) => {
        const distance = probe.distanceTo(item.geometry);
        const target = closestOnRing(item.geometry.toRing(), probe, distance === 0);

        return (
          <g key={item.id}>
            <ItemOutline item={item} tone="hit" />
            <line
              x1={probe.x}
              y1={probe.y}
              x2={target.x}
              y2={target.y}
              stroke="var(--color-orange)"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={target.x} cy={target.y} r={3 / view.zoom} fill="var(--color-orange)" />
            <Label at={target} view={view}>
              #{rank + 1} · {distance.toFixed(1)}
            </Label>
          </g>
        );
      })}

      <circle
        cx={probe.x}
        cy={probe.y}
        r={4 / view.zoom}
        fill="var(--color-primary)"
        stroke="var(--color-light)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}
