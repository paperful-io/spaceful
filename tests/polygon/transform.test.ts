import { describe, expect, test } from "bun:test";
import { Point, Polygon } from "../../src";

describe("polygon / transform", () => {
  const triangle = new Polygon([
    new Point({ x: 0, y: 0 }),
    new Point({ x: 100, y: 0 }),
    new Point({ x: 80, y: 50 }),
  ]);

  test("constructs from points or point-likes", () => {
    const polygon = new Polygon([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }]);

    expect(polygon.points[0]).toBeInstanceOf(Point);
    expect(Object.isFrozen(polygon.points)).toBe(true);
  });

  test("needs at least 3 points", () => {
    expect(() => new Polygon([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toThrow(RangeError);
  });

  test("area and centroid", () => {
    expect(triangle.area).toBe(2500);
    expect(triangle.centroid.equals({ x: 60, y: 50 / 3 })).toBe(true);
  });

  test("area is independent of winding", () => {
    const reversed = new Polygon([...triangle.points].reverse());
    expect(reversed.area).toBe(triangle.area);
  });

  test("bounds", () => {
    expect(triangle.bounds().toJSON()).toEqual({ x: 0, y: 0, w: 100, h: 50 });
  });

  test("translate", () => {
    const moved = triangle.translate({ x: 10, y: 10 });

    expect(moved.toJSON()).toEqual([
      { x: 10, y: 10 },
      { x: 110, y: 10 },
      { x: 90, y: 60 },
    ]);
    expect(triangle.points[0]!.toJSON()).toEqual({ x: 0, y: 0 });
  });

  test("rotate keeps the centroid and area", () => {
    const rotated = triangle.rotate(33);

    expect(rotated.centroid.equals(triangle.centroid, 1e-6)).toBe(true);
    expect(rotated.area).toBeCloseTo(triangle.area, 6);
    expect(rotated.rotate(-33).equals(triangle, 1e-6)).toBe(true);
  });
});
