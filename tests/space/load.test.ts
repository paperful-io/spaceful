import { describe, expect, test } from "bun:test";
import { Point, Rect, Space } from "../../src";
import { randomGeometries } from "../fixtures/random";

describe("space / load", () => {
  test("load", () => {
    const space = new Space();

    space.load([
      { id: "a", geometry: new Rect({ x: 0, y: 0, w: 100, h: 100 }), meta: {} },
      { id: "b", geometry: new Rect({ x: 200, y: 200, w: 100, h: 100 }), meta: {} },
    ]);

    expect(space.size).toBe(2);
    expect(space.search(new Point({ x: 250, y: 250 })).map((item) => item.id)).toEqual(["b"]);
  });

  test("rejects taken or repeated ids without adding anything", () => {
    const space = new Space();
    space.insert(new Point({ x: 0, y: 0 }), { id: "a" });

    expect(() =>
      space.load([
        { id: "b", geometry: new Point({ x: 1, y: 1 }) },
        { id: "a", geometry: new Point({ x: 1, y: 1 }) },
      ]),
    ).toThrow();
    expect(() =>
      space.load([
        { id: "c", geometry: new Point({ x: 1, y: 1 }) },
        { id: "c", geometry: new Point({ x: 1, y: 1 }) },
      ]),
    ).toThrow();
    expect(space.size).toBe(1);
  });

  test("loads into a non-empty space of any size", () => {
    const geometries = randomGeometries(3000);
    const everything = new Rect({ x: -100, y: -100, w: 1200, h: 1200 });

    // Small tree into big tree, big into small, and equal heights.
    for (const [first, second] of [[2500, 3000], [10, 3000], [1500, 3000]] as const) {
      const space = new Space({ maxEntries: 4 });
      space.load(geometries.slice(0, first).map((geometry, i) => ({ id: String(i), geometry })));
      space.load(
        geometries.slice(first, second).map((geometry, i) => ({ id: String(first + i), geometry })),
      );

      expect(space.size).toBe(second);
      expect(space.search(everything)).toHaveLength(second);
    }
  });
});
