import { describe, expect, test } from "bun:test";
import { Point, Rect, Space } from "../../src";
import { randomGeometries } from "../fixtures/random";

describe("space / nearest", () => {
  const space = new Space();
  space.insert(new Rect({ x: 0, y: 0, w: 10, h: 10 }), { id: "a" });
  space.insert(new Rect({ x: 100, y: 0, w: 10, h: 10 }), { id: "b" });
  space.insert(new Rect({ x: 0, y: 100, w: 10, h: 10 }).rotate(45), { id: "c" });

  test("nearest", () => {
    expect(space.nearest(new Point({ x: 20, y: 5 }))?.id).toBe("a");
    expect(space.nearest(new Point({ x: 80, y: 5 }))?.id).toBe("b");
    expect(space.nearest(new Point({ x: 5, y: 90 }))?.id).toBe("c");
  });

  test("nearest on an empty space", () => {
    expect(new Space().nearest(new Point({ x: 0, y: 0 }))).toBeUndefined();
  });

  test("knn is ordered by distance", () => {
    const ids = space.knn(new Point({ x: 0, y: 0 }), 3).map((item) => item.id);
    expect(ids).toEqual(["a", "c", "b"]);
    expect(space.knn(new Point({ x: 0, y: 0 }), 10)).toHaveLength(3);
    expect(space.knn(new Point({ x: 0, y: 0 }), 0)).toEqual([]);
  });

  test("maxDistance", () => {
    expect(space.nearest(new Point({ x: 50, y: 50 }), { maxDistance: 10 })).toBeUndefined();
    expect(space.knn(new Point({ x: 20, y: 5 }), 3, { maxDistance: 80 }).map((item) => item.id)).toEqual(["a", "b"]);
  });

  test("matches brute force on random data", () => {
    const geometries = randomGeometries(2000);
    const queries = randomGeometries(100, 7);
    const random = new Space({ maxEntries: 6 });
    random.load(geometries.map((geometry, i) => ({ id: String(i), geometry })));

    for (const query of queries) {
      const expected = geometries
        .map((geometry) => query.distanceTo(geometry))
        .sort((a, b) => a - b)
        .slice(0, 5);

      const actual = random.knn(query, 5).map((item) => query.distanceTo(item.geometry));

      expect(actual).toEqual(expected);
    }
  });
});
