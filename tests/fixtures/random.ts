import { Point, Rect, type Geometry } from "../../src";

/**
 * Deterministic PRNG (mulberry32) so failures are reproducible.
 */
export function createRandom(seed = 42) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A mix of points, rects and rotated rects (polygons) spread over a
 * 1000x1000 area.
 */
export function randomGeometries(count: number, seed = 42): Geometry[] {
  const random = createRandom(seed);

  return Array.from({ length: count }, (_, i) => {
    const x = random() * 1000;
    const y = random() * 1000;

    if (i % 5 === 0) return new Point({ x, y });

    const rect = new Rect({ x, y, w: random() * 40, h: random() * 40 });
    return i % 3 === 0 ? rect.rotate(random() * 360) : rect;
  });
}
