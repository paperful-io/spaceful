import { describe, expect, test } from "bun:test";
import { Polygon, Rect } from "../../src";

describe("rect / transform", () => {
  const rect = new Rect({ x: 10, y: 20, w: 200, h: 80 });

  test("constructs", () => {
    expect(rect.minX).toBe(10);
    expect(rect.minY).toBe(20);
    expect(rect.maxX).toBe(210);
    expect(rect.maxY).toBe(100);
    expect(rect.area).toBe(16000);
    expect(rect.center.toJSON()).toEqual({ x: 110, y: 60 });
  });

  test("normalizes negative sizes", () => {
    const flipped = new Rect({ x: 10, y: 10, w: -10, h: -5 });

    expect(flipped.toJSON()).toEqual({ x: 0, y: 5, w: 10, h: 5 });
  });

  test("corners are clockwise from the top-left", () => {
    expect(rect.corners().map((corner) => corner.toJSON())).toEqual([
      { x: 10, y: 20 },
      { x: 210, y: 20 },
      { x: 210, y: 100 },
      { x: 10, y: 100 },
    ]);
  });

  test("translate", () => {
    const moved = rect.translate({ x: 20, y: 10 });

    expect(moved.toJSON()).toEqual({ x: 30, y: 30, w: 200, h: 80 });
    expect(rect.toJSON()).toEqual({ x: 10, y: 20, w: 200, h: 80 });
  });

  test("rotate returns a polygon around the center", () => {
    const rotated = rect.rotate(15);

    expect(rotated).toBeInstanceOf(Polygon);
    expect(rotated.centroid.equals(rect.center, 1e-6)).toBe(true);
    expect(rotated.area).toBeCloseTo(rect.area, 6);
  });

  test("rotate by 90 degrees swaps the bounds", () => {
    const square = new Rect({ x: 0, y: 0, w: 4, h: 2 });
    const rotated = square.rotate(90);

    expect(rotated.bounds().toJSON()).toEqual({ x: 1, y: -1, w: 2, h: 4 });
    // The top-left corner moves to the top-right visually (clockwise).
    expect(rotated.points[0]!.toJSON()).toEqual({ x: 3, y: -1 });
  });

  test("rotate by 360 degrees is the original", () => {
    expect(rect.rotate(360).equals(rect.toPolygon())).toBe(true);
  });

  test("equals", () => {
    expect(rect.equals({ x: 10, y: 20, w: 200, h: 80 })).toBe(true);
    expect(rect.equals({ x: 10, y: 20, w: 200, h: 81 })).toBe(false);
  });
});
