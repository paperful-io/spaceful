import { Rect } from "spaceful";
import type { PointLike } from "spaceful";
import { useRef, useState } from "react";

import { useToolHandlers } from "../hooks";
import { Label, Outline } from "../shapes";
import type { ToolProps } from "../types";

/** Smallest rect side, in screen px, that counts as a drawn shape. */
const MIN_SIZE = 3;

export const rectFrom = (
  anchor: PointLike,
  point: PointLike,
  square = false,
) => {
  let w = point.x - anchor.x;
  let h = point.y - anchor.y;

  if (square) {
    const side = Math.max(Math.abs(w), Math.abs(h));
    w = Math.sign(w || 1) * side;
    h = Math.sign(h || 1) * side;
  }

  return new Rect({ x: anchor.x, y: anchor.y, w, h });
};

/** Click and drag from one corner to the opposite one. */
export function RectTool({ scene, view, handlers, setCursor }: ToolProps) {
  const anchor = useRef<PointLike>(undefined);
  const [preview, setPreview] = useState<Rect>();

  useToolHandlers(
    { handlers },
    {
      down({ point }) {
        setCursor("crosshair");
        anchor.current = point;
        setPreview(rectFrom(point, point));
      },

      move({ point, shiftKey }) {
        setCursor("crosshair");
        if (anchor.current) setPreview(rectFrom(anchor.current, point, shiftKey));
      },

      up({ point, shiftKey }) {
        if (!anchor.current) return;

        const rect = rectFrom(anchor.current, point, shiftKey);
        anchor.current = undefined;
        setPreview(undefined);

        const min = MIN_SIZE / view.zoom;
        if (rect.w >= min && rect.h >= min) {
          scene.add({ kind: "rect", x: rect.x, y: rect.y, w: rect.w, h: rect.h });
        }
      },

      key(event) {
        if (event.key === "Escape" && anchor.current) {
          anchor.current = undefined;
          setPreview(undefined);
          return true;
        }
      },
    },
  );

  if (!preview) return null;

  return (
    <g>
      <Outline ring={preview.toRing()} tone="ghost" />
      <Label at={{ x: preview.maxX, y: preview.maxY }} view={view} dy={16}>
        {Math.round(preview.w)} × {Math.round(preview.h)}
      </Label>
    </g>
  );
}
