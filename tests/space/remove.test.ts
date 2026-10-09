import { describe, expect, test } from "bun:test";
import { Point, Rect, Space } from "../../src";
import { randomGeometries } from "../fixtures/random";

describe("space / remove", () => {
  test("remove", () => {
    const space = new Space();
    space.insert(new Rect({ x: 0, y: 0, w: 100, h: 100 }), { id: "node_1" });

    expect(space.remove("node_1")).toBe(true);
    expect(space.remove("node_1")).toBe(false);
    expect(space.size).toBe(0);
    expect(space.search(new Point({ x: 50, y: 50 }))).toEqual([]);
  });

  test("clear", () => {
    const space = new Space();
    space.insert(new Point({ x: 0, y: 0 }), { id: "a" });
    space.clear();

    expect(space.size).toBe(0);
    expect(space.has("a")).toBe(false);
    expect(space.search(new Point({ x: 0, y: 0 }))).toEqual([]);
  });

  test("removing half keeps the rest searchable", () => {
    const geometries = randomGeometries(1000);
    const space = new Space({ maxEntries: 4 });
    space.load(geometries.map((geometry, i) => ({ id: String(i), geometry })));

    for (let i = 0; i < geometries.length; i += 2) {
      expect(space.remove(String(i))).toBe(true);
    }

    const everything = new Rect({ x: -100, y: -100, w: 1200, h: 1200 });
    const ids = space.search(everything).map((item) => Number(item.id));

    expect(space.size).toBe(500);
    expect(ids.sort((a, b) => a - b)).toEqual(
      Array.from({ length: 500 }, (_, i) => i * 2 + 1),
    );

    for (let i = 1; i < geometries.length; i += 2) space.remove(String(i));
    expect(space.search(everything)).toEqual([]);

    // Still usable after being emptied.
    space.insert(new Point({ x: 1, y: 1 }), { id: "again" });
    expect(space.search(everything).map((item) => item.id)).toEqual(["again"]);
  });
});
