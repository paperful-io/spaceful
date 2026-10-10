import type { PointLike } from "spaceful";
import { useRef, useState } from "react";

import { useToolHandlers } from "../hooks";
import { pivotOf, reachOf } from "../scene";
import { ItemOutline, Label } from "../shapes";
import type { ToolProps } from "../types";

type Drag =
  | { mode: "move"; id: string; last: PointLike }
  | {
      mode: "rotate";
      id: string;
      pivot: PointLike;
      startPointer: number;
      startAngle: number;
    };

/** Ring padding around the farthest vertex, and its grab tolerance, in screen px. */
const RING_GAP = 16;
const RING_GRAB = 8;

const degreesBetween = (from: PointLike, to: PointLike) =>
  (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;

/**
 * Select, move and rotate. Hovering a shape shows a dashed ring around it;
 * dragging the ring rotates the shape around its center.
 */
export function SelectTool({ scene, view, handlers, setCursor }: ToolProps) {
  const [hoverId, setHoverId] = useState<string>();
  const [selectedId, setSelectedId] = useState<string>();
  const [dragging, setDragging] = useState<Drag["mode"]>();
  const drag = useRef<Drag>(undefined);

  const ringId = drag.current?.id ?? hoverId ?? selectedId;
  const ringItem = ringId ? scene.get(ringId) : undefined;

  const ringOf = (id: string | undefined) => {
    const item = id ? scene.get(id) : undefined;
    if (!item) return undefined;

    return {
      item,
      pivot: pivotOf(item.meta),
      radius: reachOf(item.meta) + RING_GAP / view.zoom,
    };
  };

  const ring = ringOf(ringId);

  const onRing = (point: PointLike) => {
    if (!ring) return false;
    const distance = Math.hypot(point.x - ring.pivot.x, point.y - ring.pivot.y);
    return Math.abs(distance - ring.radius) <= RING_GRAB / view.zoom;
  };

  const insideRing = (point: PointLike) =>
    !!ring &&
    Math.hypot(point.x - ring.pivot.x, point.y - ring.pivot.y) <=
      ring.radius + RING_GRAB / view.zoom;

  useToolHandlers(
    { handlers },
    {
      down({ point }) {
        if (ring && onRing(point)) {
          drag.current = {
            mode: "rotate",
            id: ring.item.id,
            pivot: ring.pivot,
            startPointer: degreesBetween(ring.pivot, point),
            startAngle: ring.item.meta.angle,
          };
          setSelectedId(ring.item.id);
          setDragging("rotate");
          setCursor("grabbing");
          return;
        }

        const hit = scene.hitTest(point);
        setSelectedId(hit?.id);

        if (hit) {
          drag.current = { mode: "move", id: hit.id, last: point };
          setDragging("move");
        }
      },

      move({ point, shiftKey }) {
        const current = drag.current;

        if (current?.mode === "move") {
          scene.move(current.id, point.x - current.last.x, point.y - current.last.y);
          current.last = point;
          return;
        }

        if (current?.mode === "rotate") {
          const delta = degreesBetween(current.pivot, point) - current.startPointer;
          let angle = current.startAngle + delta;
          if (shiftKey) angle = Math.round(angle / 15) * 15;
          scene.rotate(current.id, angle);
          return;
        }

        if (onRing(point)) {
          setCursor("grab");
          return;
        }

        const hit = scene.hitTest(point);
        setCursor(hit ? "move" : "default");

        if (hit) setHoverId(hit.id);
        else if (!insideRing(point)) setHoverId(undefined);
      },

      up() {
        drag.current = undefined;
        setDragging(undefined);
      },

      leave() {
        if (!drag.current) setHoverId(undefined);
      },

      key(event) {
        if (!selectedId) return;

        if (event.key === "Delete" || event.key === "Backspace") {
          scene.remove(selectedId);
          setSelectedId(undefined);
          setHoverId(undefined);
          return true;
        }

        if (event.key === "Escape") {
          setSelectedId(undefined);
          return true;
        }
      },
    },
  );

  const selected = selectedId ? scene.get(selectedId) : undefined;

  // While dragging, show what the shape touches, straight from the index.
  const touching =
    dragging && ringItem
      ? scene.overlapping(ringItem.geometry, ringItem.id)
      : [];

  return (
    <g>
      {selected && <ItemOutline item={selected} tone="selected" />}

      {touching.map((item) => (
        <ItemOutline key={item.id} item={item} tone="collide" />
      ))}
      {ringItem && touching.length > 0 && (
        <ItemOutline item={ringItem} tone="collide" />
      )}

      {ring && (
        <RotationRing
          pivot={ring.pivot}
          radius={ring.radius}
          angle={ring.item.meta.angle}
          active={dragging === "rotate"}
          view={view}
        />
      )}
    </g>
  );
}

function RotationRing({
  pivot,
  radius,
  angle,
  active,
  view,
}: {
  pivot: PointLike;
  radius: number;
  angle: number;
  active: boolean;
  view: ToolProps["view"];
}) {
  // 0° points up, growing clockwise like the shapes do in y-down space.
  const radians = ((angle - 90) * Math.PI) / 180;
  const knob = {
    x: pivot.x + Math.cos(radians) * radius,
    y: pivot.y + Math.sin(radians) * radius,
  };
  const top = { x: pivot.x, y: pivot.y - radius };
  const size = 1 / view.zoom;

  return (
    <g pointerEvents="none">
      <circle
        cx={pivot.x}
        cy={pivot.y}
        r={radius}
        fill="none"
        stroke={active ? "var(--color-primary)" : "var(--color-shade-500)"}
        strokeWidth={active ? 1.5 : 1}
        strokeDasharray="4 4"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={pivot.x}
        y1={pivot.y}
        x2={top.x}
        y2={top.y}
        stroke="var(--color-shade-300)"
        strokeDasharray="2 3"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={pivot.x}
        y1={pivot.y}
        x2={knob.x}
        y2={knob.y}
        stroke="var(--color-primary)"
        strokeOpacity={0.6}
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={pivot.x} cy={pivot.y} r={2.5 * size} fill="var(--color-shade-600)" />
      <circle
        cx={knob.x}
        cy={knob.y}
        r={(active ? 6 : 5) * size}
        fill="var(--color-light)"
        stroke="var(--color-primary)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
      <Label at={knob} view={view} dx={10} dy={-10}>
        {Math.round(angle)}°
      </Label>
    </g>
  );
}
