import { describe, expect, test } from "bun:test";
import { Point, Polygon, Rect, Space } from "../../src";
import { randomGeometries } from "../fixtures/random";

describe("space / search", () => {
  const space = new Space();
  space.insert(new Rect({ x: 0, y: 0, w: 100, h: 100 }), { id: "a" });
  space.insert(new Rect({ x: 200, y: 200, w: 100, h: 100 }), { id: "b" });
  space.insert(new Point({ x: 150, y: 150 }), { id: "c" });
  space.insert(new Rect({ x: 400, y: 0, w: 40, h: 40 }).rotate(45), { id: "diamond" });

  const ids = (items: { id: string }[]) => items.map((item) => item.id).sort();

  test("by rect", () => {
    expect(ids(space.search(new Rect({ x: 20, y: 20, w: 50, h: 50 })))).toEqual(["a"]);
    expect(ids(space.search(new Rect({ x: 50, y: 50, w: 200, h: 200 })))).toEqual(["a", "b", "c"]);
    expect(space.search(new Rect({ x: 1000, y: 1000, w: 1, h: 1 }))).toEqual([]);
  });

  test("by point, touching edges count", () => {
    expect(ids(space.search(new Point({ x: 100, y: 100 })))).toEqual(["a"]);
    expect(ids(space.search(new Point({ x: 150, y: 150 })))).toEqual(["c"]);
  });

  test("uses exact geometry, not just bounding boxes", () => {
    // Inside the diamond's bounding box corner, outside the diamond.
    expect(space.search(new Point({ x: 393, y: -7 }))).toEqual([]);
    expect(ids(space.search(new Point({ x: 420, y: 20 })))).toEqual(["diamond"]);

    const triangle = new Polygon([{ x: 150, y: 0 }, { x: 300, y: 0 }, { x: 300, y: 150 }]);
    // The triangle's bounding box covers "c" and "b", the triangle itself doesn't.
    expect(space.search(triangle)).toEqual([]);
  });

  test("collides", () => {
    expect(space.collides(new Rect({ x: 90, y: 90, w: 5, h: 5 }))).toBe(true);
    expect(space.collides(new Rect({ x: 110, y: 110, w: 5, h: 5 }))).toBe(false);
  });

  test("matches brute force on random data", () => {
    const geometries = randomGeometries(2000);
    const queries = randomGeometries(200, 7);
    const random = new Space({ maxEntries: 6 });
    geometries.forEach((geometry, i) => random.insert(geometry, { id: String(i) }));

    for (const query of queries) {
      const expected = geometries
        .flatMap((geometry, i) => (query.intersects(geometry) ? [String(i)] : []))
        .sort();

      expect(ids(random.search(query))).toEqual(expected);
    }
  });
});
