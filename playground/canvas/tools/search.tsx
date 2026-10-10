import { Point, Rect } from "spaceful";
import type { PointLike } from "spaceful";
import { useRef, useState } from "react";

import { useToolHandlers } from "../hooks";
import { plural } from "../scene";
import { ItemOutline, Label, Outline } from "../shapes";
import type { ToolProps } from "../types";

import { rectFrom } from "./rect";

/** Drags shorter than this, in screen px, become a point query. */
const CLICK = 3;

/**
 * Drag a query rectangle (or click for a point) and run `space.search` or
 * `space.collides` against it.
 */
export function SearchTool({ scene, view, options, handlers, setCursor }: ToolProps) {
  const anchor = useRef<PointLike>(undefined);
  const [draft, setDraft] = useState<Rect>();
  const [query, setQuery] = useState<Point | Rect>();

  const run = (geometry: Point | Rect) => {
    const kind = geometry instanceof Point ? "point" : "rect";

    if (options.searchMode === "collides") {
      scene.measure(
        `collides(${kind})`,
        () => scene.space.collides(geometry),
        (hit) => String(hit),
      );
    } else {
      scene.measure(
        `search(${kind})`,
        () => scene.space.search(geometry),
        (items) => plural(items.length, "hit"),
      );
    }

    setQuery(geometry);
  };

  useToolHandlers(
    { handlers },
    {
      down({ point }) {
        anchor.current = point;
        setDraft(rectFrom(point, point));
      },

      move({ point, shiftKey }) {
        setCursor("crosshair");
        if (anchor.current) setDraft(rectFrom(anchor.current, point, shiftKey));
      },

      up({ point, shiftKey }) {
        if (!anchor.current) return;

        const rect = rectFrom(anchor.current, point, shiftKey);
        const min = CLICK / view.zoom;
        anchor.current = undefined;
        setDraft(undefined);
        run(rect.w < min && rect.h < min ? new Point(point) : rect);
      },

      key(event) {
        if (event.key === "Escape" && query) {
          setQuery(undefined);
          return true;
        }
      },
    },
  );

  // Re-run for drawing so results follow shapes that were moved since.
  const collides = query ? scene.space.collides(query) : false;
  const hits =
    query && options.searchMode === "search" ? scene.space.search(query) : [];

  return (
    <g>
      {hits.map((item) => (
        <ItemOutline key={item.id} item={item} tone="hit" />
      ))}

      {query instanceof Rect && (
        <Outline ring={query.toRing()} tone={collides ? "hit" : "ghost"} />
      )}
      {query instanceof Point && (
        <circle
          cx={query.x}
          cy={query.y}
          r={5 / view.zoom}
          fill={collides ? "var(--color-orange)" : "var(--color-shade-500)"}
          stroke="var(--color-light)"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      )}
      {query && options.searchMode === "collides" && (
        <Label
          at={query instanceof Rect ? { x: query.minX, y: query.minY } : query}
          view={view}
        >
          collides: {String(collides)}
        </Label>
      )}

      {draft && <Outline ring={draft.toRing()} tone="ghost" />}
    </g>
  );
}
