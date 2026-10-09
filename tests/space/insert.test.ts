import { describe, expect, test } from "bun:test";
import { Point, Rect, Space } from "../../src";

describe("space / insert", () => {
  test("insert and get", () => {
    const space = new Space<{ name: string }>();
    const geometry = new Rect({ x: 0, y: 0, w: 100, h: 100 });

    const item = space.insert(geometry, { id: "node_1", meta: { name: "Hello" } });

    expect(item).toEqual({ id: "node_1", geometry, meta: { name: "Hello" } });
    expect(space.get("node_1")).toBe(item);
    expect(space.has("node_1")).toBe(true);
    expect(space.size).toBe(1);
  });

  test("generates ids that don't collide", () => {
    const space = new Space();
    space.insert(new Point({ x: 0, y: 0 }), { id: "0" });

    const a = space.insert(new Point({ x: 1, y: 1 }));
    const b = space.insert(new Point({ x: 2, y: 2 }));

    expect(a.id).not.toBe("0");
    expect(b.id).not.toBe(a.id);
    expect(space.size).toBe(3);
  });

  test("rejects duplicate ids", () => {
    const space = new Space();
    space.insert(new Point({ x: 0, y: 0 }), { id: "a" });

    expect(() => space.insert(new Point({ x: 1, y: 1 }), { id: "a" })).toThrow();
    expect(space.size).toBe(1);
  });

  test("update moves an item", () => {
    const space = new Space<string>();
    space.insert(new Rect({ x: 0, y: 0, w: 10, h: 10 }), { id: "a", meta: "hi" });

    const updated = space.update("a", { geometry: new Rect({ x: 500, y: 500, w: 10, h: 10 }) });

    expect(updated?.meta).toBe("hi");
    expect(space.search(new Point({ x: 5, y: 5 }))).toEqual([]);
    expect(space.search(new Point({ x: 505, y: 505 })).map((item) => item.id)).toEqual(["a"]);
    expect(space.update("missing", { meta: "x" })).toBeUndefined();
  });

  test("iterates in insertion order", () => {
    const space = new Space();
    for (const id of ["c", "a", "b"]) space.insert(new Point({ x: 0, y: 0 }), { id });

    expect([...space].map((item) => item.id)).toEqual(["c", "a", "b"]);
    expect(space.all().map((item) => item.id)).toEqual(["c", "a", "b"]);
  });
});
