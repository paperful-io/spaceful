import type { PointLike } from "spaceful";
import { useRef, useState } from "react";

import { useToolHandlers } from "../hooks";
import { canAppend, canClose } from "../scene";
import { Outline } from "../shapes";
import type { ToolProps } from "../types";

/** Distance, in screen px, at which a click snaps to the first vertex. */
const SNAP = 10;
const DOUBLE_CLICK_MS = 300;

/**
 * Click to add vertices. Close the polygon by clicking the first vertex,
 * double-clicking, or pressing Enter.
 */
export function PolygonTool({ scene, view, handlers, setCursor }: ToolProps) {
  const [points, setPoints] = useState<PointLike[]>([]);
  const [cursor, setCursorPoint] = useState<PointLike>();
  const lastDown = useRef(0);

  const first = points[0];
  const snap = (point: PointLike) =>
    !!first &&
    points.length >= 3 &&
    Math.hypot(point.x - first.x, point.y - first.y) <= SNAP / view.zoom;

  const close = (ring: PointLike[]) => {
    if (canClose(ring)) {
      try {
        scene.add({ kind: "polygon", points: ring });
      } catch {
        // Degenerate input; the Polygon constructor rejects it.
      }
    }

    setPoints([]);
  };

  useToolHandlers(
    { handlers },
    {
      down({ point, timeStamp }) {
        const last = points[points.length - 1];
        const isDouble =
          timeStamp - lastDown.current < DOUBLE_CLICK_MS &&
          !!last &&
          Math.hypot(point.x - last.x, point.y - last.y) <= SNAP / view.zoom;
        lastDown.current = timeStamp;

        if (snap(point) || (isDouble && points.length >= 3)) {
          close(points);
          return;
        }

        if (canAppend(points, point)) setPoints([...points, point]);
      },

      move({ point }) {
        setCursor("crosshair");
        setCursorPoint(point);
      },

      leave() {
        setCursorPoint(undefined);
      },

      key(event) {
        if (!points.length) return;

        if (event.key === "Enter") {
          close(points);
          return true;
        }

        if (event.key === "Escape") {
          setPoints([]);
          return true;
        }

        if (event.key === "Backspace") {
          setPoints(points.slice(0, -1));
          return true;
        }
      },
    },
  );

  if (!points.length) return null;

  const snapping = !!cursor && snap(cursor);
  const next = snapping ? first! : cursor;
  const valid = !next || snapping ? canClose(points) : canAppend(points, next);
  const path = next ? [...points, next] : points;

  return (
    <g>
      <Outline ring={path} tone={valid ? "ghost" : "invalid"} closed={false} />
      {points.length >= 2 && (
        <Outline ring={[path[path.length - 1]!, first!]} tone="ghost" closed={false} />
      )}
      {points.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r={(i === 0 && snapping ? 6 : 3.5) / view.zoom}
          fill={i === 0 ? "var(--color-primary)" : "var(--color-light)"}
          stroke="var(--color-primary)"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      ))}
    </g>
  );
}
