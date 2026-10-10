import { useEffect, useMemo } from "react";

import { now, pivotOf, plural } from "../scene";
import type { ShapeItem } from "../scene";
import { ItemOutline } from "../shapes";
import type { ToolProps } from "../types";

import { SelectTool } from "./select";

type Overlaps = { pairs: [ShapeItem, ShapeItem][]; items: ShapeItem[]; ms: number };

/**
 * Every pair of overlapping shapes, found with one `space.search` per shape.
 * Shapes can still be moved and rotated, so overlaps update live.
 */
export function OverlapTool(props: ToolProps) {
  const { scene, version } = props;

  const overlaps = useMemo((): Overlaps => {
    const start = now();
    const pairs: [ShapeItem, ShapeItem][] = [];
    const involved = new Map<string, ShapeItem>();

    for (const item of scene.items()) {
      for (const other of scene.space.search(item.geometry)) {
        // Each pair shows up twice, once from each side; keep one.
        if (Number(other.id) <= Number(item.id)) continue;
        pairs.push([item, other]);
        involved.set(item.id, item);
        involved.set(other.id, other);
      }
    }

    return { pairs, items: [...involved.values()], ms: now() - start };
  }, [scene, version]);

  useEffect(() => {
    scene.setStat({
      name: `search × ${scene.space.size}`,
      result: plural(overlaps.pairs.length, "pair"),
      ms: overlaps.ms,
    });
  }, [scene, overlaps]);

  return (
    <g>
      {overlaps.items.map((item) => (
        <ItemOutline key={item.id} item={item} tone="collide" />
      ))}
      <g pointerEvents="none">
        {overlaps.pairs.map(([a, b]) => {
          const from = pivotOf(a.meta);
          const to = pivotOf(b.meta);

          return (
            <line
              key={`${a.id}-${b.id}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="var(--color-red)"
              strokeWidth={1}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </g>
      <SelectTool {...props} />
    </g>
  );
}
