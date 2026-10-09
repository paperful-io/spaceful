import type { BBox, PointLike } from "../types/general";

/**
 * Tolerance used for floating point comparisons.
 */
export const EPSILON = 1e-9;

type Ring = readonly PointLike[];

/**
 * The minimal shape every geometry exposes so relations can be computed
 * generically without importing the concrete classes.
 */
export type Shape = {
  readonly type: "point" | "rect" | "polygon";
  bbox(): BBox;
  toRing(): Ring;
};

export function assertFinite(values: Record<string, number>) {
  for (const [key, value] of Object.entries(values)) {
    if (!Number.isFinite(value))
      throw new TypeError(`Expected "${key}" to be a finite number, got ${value}.`);
  }
}

/**
 * Returns the cosine and sine of an angle in degrees, snapping right angles
 * to exact values so rotating by 90° doesn't introduce floating point noise.
 */
function trig(degrees: number): [cos: number, sin: number] {
  const normalized = ((degrees % 360) + 360) % 360;
  if (normalized === 0) return [1, 0];
  if (normalized === 90) return [0, 1];
  if (normalized === 180) return [-1, 0];
  if (normalized === 270) return [0, -1];

  const radians = (normalized * Math.PI) / 180;
  return [Math.cos(radians), Math.sin(radians)];
}

/**
 * Rotates a point around an origin. Positive angles rotate clockwise in a
 * y-down coordinate system (screens, canvases, document pages).
 */
export function rotatePoint(
  point: PointLike,
  origin: PointLike,
  degrees: number,
): PointLike {
  const [cos, sin] = trig(degrees);
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;

  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  };
}

function cross(a: PointLike, b: PointLike, c: PointLike) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function sign(value: number) {
  return value > EPSILON ? 1 : value < -EPSILON ? -1 : 0;
}

function withinSegmentBox(a: PointLike, b: PointLike, p: PointLike) {
  return (
    p.x >= Math.min(a.x, b.x) - EPSILON &&
    p.x <= Math.max(a.x, b.x) + EPSILON &&
    p.y >= Math.min(a.y, b.y) - EPSILON &&
    p.y <= Math.max(a.y, b.y) + EPSILON
  );
}

/**
 * Whether segments ab and cd share at least one point (touching counts).
 */
export function segmentsIntersect(
  a: PointLike,
  b: PointLike,
  c: PointLike,
  d: PointLike,
) {
  const d1 = sign(cross(c, d, a));
  const d2 = sign(cross(c, d, b));
  const d3 = sign(cross(a, b, c));
  const d4 = sign(cross(a, b, d));

  if (d1 * d2 < 0 && d3 * d4 < 0) return true;

  return (
    (d1 === 0 && withinSegmentBox(c, d, a)) ||
    (d2 === 0 && withinSegmentBox(c, d, b)) ||
    (d3 === 0 && withinSegmentBox(a, b, c)) ||
    (d4 === 0 && withinSegmentBox(a, b, d))
  );
}

/**
 * Whether segments ab and cd cross each other at a single interior point.
 */
function segmentsCrossProperly(
  a: PointLike,
  b: PointLike,
  c: PointLike,
  d: PointLike,
) {
  return (
    sign(cross(c, d, a)) * sign(cross(c, d, b)) < 0 &&
    sign(cross(a, b, c)) * sign(cross(a, b, d)) < 0
  );
}

export function pointSegmentDistance(p: PointLike, a: PointLike, b: PointLike) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = dx * dx + dy * dy;

  if (length === 0) return Math.hypot(p.x - a.x, p.y - a.y);

  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length),
  );

  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export function segmentSegmentDistance(
  a: PointLike,
  b: PointLike,
  c: PointLike,
  d: PointLike,
) {
  if (segmentsIntersect(a, b, c, d)) return 0;

  return Math.min(
    pointSegmentDistance(a, c, d),
    pointSegmentDistance(b, c, d),
    pointSegmentDistance(c, a, b),
    pointSegmentDistance(d, a, b),
  );
}

/**
 * Whether a point lies inside a ring or on its boundary.
 *
 * Rings are walked as closed loops (`i -> (i + 1) % n`), which also turns a
 * single point into one degenerate edge.
 */
export function pointInRing(point: PointLike, ring: Ring) {
  const n = ring.length;

  for (let i = 0; i < n; i++) {
    if (pointSegmentDistance(point, ring[i]!, ring[(i + 1) % n]!) <= EPSILON)
      return true;
  }

  if (n < 3) return false;

  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const a = ring[i]!;
    const b = ring[j]!;

    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    ) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Signed area of a ring using the shoelace formula.
 */
export function ringSignedArea(ring: Ring) {
  const n = ring.length;

  let sum = 0;
  for (let i = 0; i < n; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % n]!;
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
}

/**
 * Area centroid of a ring, falling back to the average of its vertices when
 * the ring is degenerate (zero area).
 */
export function ringCentroid(ring: Ring): PointLike {
  const n = ring.length;
  const area = ringSignedArea(ring);

  let x = 0;
  let y = 0;

  if (Math.abs(area) <= EPSILON) {
    for (let i = 0; i < n; i++) {
      x += ring[i]!.x;
      y += ring[i]!.y;
    }
    return { x: x / n, y: y / n };
  }

  for (let i = 0; i < n; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % n]!;
    const factor = a.x * b.y - b.x * a.y;
    x += (a.x + b.x) * factor;
    y += (a.y + b.y) * factor;
  }

  return { x: x / (6 * area), y: y / (6 * area) };
}

export function ringBBox(ring: Ring): BBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const { x, y } of ring) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  return { minX, minY, maxX, maxY };
}

export function ringsIntersect(a: Ring, b: Ring) {
  const n = a.length;
  const m = b.length;

  for (let i = 0; i < n; i++) {
    const p1 = a[i]!;
    const p2 = a[(i + 1) % n]!;

    for (let j = 0; j < m; j++) {
      if (segmentsIntersect(p1, p2, b[j]!, b[(j + 1) % m]!)) return true;
    }
  }

  return pointInRing(a[0]!, b) || pointInRing(b[0]!, a);
}

/**
 * Whether `inner` lies completely inside `outer` (boundary inclusive).
 * Works for concave rings.
 */
export function ringContainsRing(outer: Ring, inner: Ring) {
  const n = inner.length;
  const m = outer.length;

  for (let i = 0; i < n; i++) {
    if (!pointInRing(inner[i]!, outer)) return false;
  }

  for (let i = 0; i < n; i++) {
    const p1 = inner[i]!;
    const p2 = inner[(i + 1) % n]!;

    for (let j = 0; j < m; j++) {
      if (segmentsCrossProperly(p1, p2, outer[j]!, outer[(j + 1) % m]!))
        return false;
    }

    // An edge can leave a concave ring through one of its vertices without
    // properly crossing any edge, so also check the midpoint.
    const midpoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    if (!pointInRing(midpoint, outer)) return false;
  }

  return true;
}

export function ringDistance(a: Ring, b: Ring) {
  if (ringsIntersect(a, b)) return 0;

  const n = a.length;
  const m = b.length;

  let min = Infinity;
  for (let i = 0; i < n; i++) {
    const p1 = a[i]!;
    const p2 = a[(i + 1) % n]!;

    for (let j = 0; j < m; j++) {
      const distance = segmentSegmentDistance(p1, p2, b[j]!, b[(j + 1) % m]!);
      if (distance < min) min = distance;
    }
  }

  return min;
}

export function bboxIntersects(a: BBox, b: BBox) {
  return (
    a.minX <= b.maxX + EPSILON &&
    a.maxX >= b.minX - EPSILON &&
    a.minY <= b.maxY + EPSILON &&
    a.maxY >= b.minY - EPSILON
  );
}

export function bboxContains(a: BBox, b: BBox) {
  return (
    a.minX <= b.minX + EPSILON &&
    a.minY <= b.minY + EPSILON &&
    a.maxX >= b.maxX - EPSILON &&
    a.maxY >= b.maxY - EPSILON
  );
}

export function bboxDistance(a: BBox, b: BBox) {
  const dx = Math.max(0, a.minX - b.maxX, b.minX - a.maxX);
  const dy = Math.max(0, a.minY - b.maxY, b.minY - a.maxY);
  return Math.hypot(dx, dy);
}

/**
 * Points and rects are exactly their bounding boxes, which enables fast paths.
 */
function isBox(shape: Shape) {
  return shape.type !== "polygon";
}

export function shapesIntersect(a: Shape, b: Shape) {
  if (!bboxIntersects(a.bbox(), b.bbox())) return false;
  if (isBox(a) && isBox(b)) return true;

  return ringsIntersect(a.toRing(), b.toRing());
}

export function shapeContains(outer: Shape, inner: Shape) {
  if (!bboxContains(outer.bbox(), inner.bbox())) return false;
  if (isBox(outer)) return true;

  return ringContainsRing(outer.toRing(), inner.toRing());
}

export function shapesDistance(a: Shape, b: Shape) {
  if (isBox(a) && isBox(b)) return bboxDistance(a.bbox(), b.bbox());

  return ringDistance(a.toRing(), b.toRing());
}
