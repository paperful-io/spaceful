import { Point, Polygon, Rect, Space } from "spaceful";
import type { Geometry, PointLike, SpaceItem } from "spaceful";

export type ShapeKind = "rect" | "polygon";

export type ShapeMeta = {
  kind: ShapeKind;
  /** The unrotated shape. The indexed geometry is always derived from it. */
  base: Rect | Polygon;
  /** Rotation in degrees, clockwise, around the base's center. */
  angle: number;
  color: string;
};

export type ShapeItem = SpaceItem<ShapeMeta>;

export type ShapeSeed = { angle?: number; color?: string } & (
  | { kind: "rect"; x: number; y: number; w: number; h: number }
  | { kind: "polygon"; points: PointLike[] }
);

export type QueryStat = {
  name: string;
  /** A short description of what the query returned. */
  result: string;
  ms: number;
};

export const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

export type Bounds = { x: number; y: number; w: number; h: number };

export const PALETTE = ["primary", "blue", "purple", "green"] as const;

export const colorVar = (color: string) => `var(--color-${color})`;

export const geometryOf = (meta: Pick<ShapeMeta, "base" | "angle">) =>
  meta.angle ? meta.base.rotate(meta.angle) : meta.base;

/** The point a shape rotates around. It doesn't move when the shape rotates. */
export const pivotOf = (meta: Pick<ShapeMeta, "base">): Point =>
  meta.base instanceof Rect ? meta.base.center : meta.base.centroid;

/** Radius of the rotation ring: the farthest vertex from the pivot. */
export const reachOf = (meta: Pick<ShapeMeta, "base">) => {
  const pivot = pivotOf(meta);

  return Math.max(
    ...meta.base
      .toRing()
      .map((p) => Math.hypot(p.x - pivot.x, p.y - pivot.y)),
  );
};

// Rounded so server and client agree; trig results can differ in the last digits.
const round = (value: number) => Math.round(value * 100) / 100;

export const ringToPoints = (ring: readonly PointLike[]) =>
  ring.map((p) => `${round(p.x)},${round(p.y)}`).join(" ");

export const now = () =>
  typeof performance === "undefined" ? Date.now() : performance.now();

/**
 * A `Space` plus a tiny subscription layer so React can re-render when
 * shapes change. Ids are increasing numbers, so they double as z-order.
 */
export class Scene {
  readonly space = new Space<ShapeMeta>();
  version = 0;
  stat: QueryStat | undefined;

  private seq = 0;
  private colorSeq = 0;
  private listeners = new Set<() => void>();
  private statListeners = new Set<() => void>();

  constructor(seeds: ShapeSeed[] = []) {
    // Not timed: a stat here would differ between server and client renders.
    if (seeds.length) this.space.load(seeds.map((seed) => this.toEntry(seed)));
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  subscribeStat = (listener: () => void) => {
    this.statListeners.add(listener);
    return () => this.statListeners.delete(listener);
  };

  getVersion = () => this.version;
  getStat = () => this.stat;

  setStat(stat: QueryStat | undefined) {
    this.stat = stat;
    this.statListeners.forEach((listener) => listener());
  }

  /** Runs a query, records how long it took, and returns its result. */
  measure<T>(
    name: string,
    run: () => T,
    describe: (result: T) => string,
  ): T {
    const start = now();
    const result = run();
    this.setStat({ name, result: describe(result), ms: now() - start });
    return result;
  }

  private emit() {
    this.version++;
    this.listeners.forEach((listener) => listener());
  }

  private nextColor() {
    return PALETTE[this.colorSeq++ % PALETTE.length]!;
  }

  private toEntry(seed: ShapeSeed) {
    const base =
      seed.kind === "rect"
        ? new Rect({ x: seed.x, y: seed.y, w: seed.w, h: seed.h })
        : new Polygon(seed.points);
    const meta: ShapeMeta = {
      kind: seed.kind,
      base,
      angle: seed.angle ?? 0,
      color: seed.color ?? this.nextColor(),
    };

    return { id: String(++this.seq), geometry: geometryOf(meta), meta };
  }

  items() {
    return this.space.all();
  }

  get(id: string) {
    return this.space.get(id);
  }

  add(seed: ShapeSeed) {
    const { id, geometry, meta } = this.toEntry(seed);
    const item = this.space.insert(geometry, { id, meta });
    this.emit();
    return item;
  }

  /** Bulk insert through `Space.load`, timed. */
  seed(seeds: ShapeSeed[]) {
    const entries = seeds.map((seed) => this.toEntry(seed));
    const items = this.measure(
      `load(${entries.length})`,
      () => this.space.load(entries),
      (result) => `${result.length} inserted`,
    );
    this.emit();
    return items;
  }

  move(id: string, dx: number, dy: number) {
    const item = this.space.get(id);
    if (!item) return;

    const meta = { ...item.meta, base: item.meta.base.translate({ x: dx, y: dy }) };
    this.space.update(id, { geometry: geometryOf(meta), meta });
    this.emit();
  }

  rotate(id: string, angle: number) {
    const item = this.space.get(id);
    if (!item) return;

    const meta = { ...item.meta, angle: normalizeAngle(angle) };
    this.space.update(id, { geometry: geometryOf(meta), meta });
    this.emit();
  }

  remove(id: string) {
    if (this.space.remove(id)) this.emit();
  }

  clear() {
    this.space.clear();
    this.setStat(undefined);
    this.emit();
  }

  /** The topmost shape under a point. */
  hitTest(point: PointLike) {
    return topmost(this.space.search(new Point(point)));
  }

  /** Shapes intersecting `geometry`, ignoring the shape with `exceptId`. */
  overlapping(geometry: Geometry, exceptId?: string) {
    return this.space.search(geometry).filter((item) => item.id !== exceptId);
  }
}

export const topmost = (items: ShapeItem[]) =>
  items.reduce<ShapeItem | undefined>(
    (top, item) => (!top || Number(item.id) > Number(top.id) ? item : top),
    undefined,
  );

export const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;

/** Small deterministic PRNG so seeded scenes render the same on server and client. */
export const createRandom = (seed = 1) => {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * A star-shaped polygon: vertices at sorted angles around a center, which is
 * always a simple polygon.
 */
export const randomPolygon = (
  random: () => number,
  cx: number,
  cy: number,
  radius: number,
): PointLike[] => {
  const count = 3 + Math.floor(random() * 5);
  const angles = Array.from({ length: count }, () => random() * Math.PI * 2).sort(
    (a, b) => a - b,
  );

  return angles.map((angle) => {
    const r = radius * (0.55 + random() * 0.45);
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });
};

/** Random rects and polygons spread over `bounds`, sized for the count. */
export const randomSeeds = (
  count: number,
  bounds: Bounds,
  random: () => number = Math.random,
): ShapeSeed[] => {
  const size = Math.max(
    6,
    Math.min(70, Math.sqrt((bounds.w * bounds.h) / count) * 0.6),
  );

  return Array.from({ length: count }, (): ShapeSeed => {
    const cx = bounds.x + random() * bounds.w;
    const cy = bounds.y + random() * bounds.h;
    const angle = random() < 0.4 ? Math.round(random() * 90) : 0;

    if (random() < 0.5) {
      const w = size * (0.5 + random());
      const h = size * (0.5 + random());
      return { kind: "rect", x: cx - w / 2, y: cy - h / 2, w, h, angle };
    }

    return { kind: "polygon", points: randomPolygon(random, cx, cy, size * 0.7) };
  });
};

const cross = (o: PointLike, a: PointLike, b: PointLike) =>
  (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

const segmentsCross = (
  a: PointLike,
  b: PointLike,
  c: PointLike,
  d: PointLike,
) => {
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);

  return d1 * d2 < 0 && d3 * d4 < 0;
};

/** Whether adding `next` as the last vertex keeps the open path simple. */
export const canAppend = (points: readonly PointLike[], next: PointLike) => {
  const last = points[points.length - 1];
  if (!last) return true;

  for (let i = 0; i < points.length - 2; i++) {
    if (segmentsCross(points[i]!, points[i + 1]!, last, next)) return false;
  }

  return true;
};

/** Whether closing the path back to its first vertex keeps it simple. */
export const canClose = (points: readonly PointLike[]) => {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last || points.length < 3) return false;

  for (let i = 1; i < points.length - 2; i++) {
    if (segmentsCross(points[i]!, points[i + 1]!, last, first)) return false;
  }

  return Math.abs(new Polygon(points).area) > 1;
};

/** The point on a closed ring nearest to `point` (the point itself if inside). */
export const closestOnRing = (
  ring: readonly PointLike[],
  point: PointLike,
  inside: boolean,
): PointLike => {
  if (inside) return point;

  let best = ring[0]!;
  let bestDistance = Infinity;

  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = dx * dx + dy * dy;
    const t = length
      ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length))
      : 0;
    const candidate = { x: a.x + t * dx, y: a.y + t * dy };
    const distance = Math.hypot(candidate.x - point.x, candidate.y - point.y);

    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }

  return best;
};
