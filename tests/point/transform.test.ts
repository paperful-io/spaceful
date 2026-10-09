import { describe, expect, test } from "bun:test";
import { Point } from "../../src";

describe("point / transform", () => {
  test("constructs", () => {
    const point = new Point({ x: 10, y: 20 });

    expect(point.x).toBe(10);
    expect(point.y).toBe(20);
    expect(point.toJSON()).toEqual({ x: 10, y: 20 });
  });

  test("rejects non-finite coordinates", () => {
    expect(() => new Point({ x: NaN, y: 0 })).toThrow(TypeError);
    expect(() => new Point({ x: 0, y: Infinity })).toThrow(TypeError);
  });

  test("translate", () => {
    const point = new Point({ x: 10, y: 20 });
    const moved = point.translate({ x: 5, y: -5 });

    expect(moved.toJSON()).toEqual({ x: 15, y: 15 });
    expect(point.toJSON()).toEqual({ x: 10, y: 20 });
    expect(point.translate({ y: 1 }).toJSON()).toEqual({ x: 10, y: 21 });
  });

  test("rotate around itself is a no-op", () => {
    const point = new Point({ x: 10, y: 20 });

    expect(point.rotate(45).equals(point)).toBe(true);
  });

  test("rotate clockwise around an origin in y-down space", () => {
    const point = new Point({ x: 10, y: 0 });
    const origin = { x: 0, y: 0 };

    expect(point.rotate(90, origin).toJSON()).toEqual({ x: 0, y: 10 });
    expect(point.rotate(180, origin).toJSON()).toEqual({ x: -10, y: 0 });
    expect(point.rotate(-90, origin).toJSON()).toEqual({ x: 0, y: -10 });
    expect(point.rotate(45, origin).equals({ x: Math.SQRT1_2 * 10, y: Math.SQRT1_2 * 10 })).toBe(true);
  });

  test("bounds", () => {
    expect(new Point({ x: 3, y: 4 }).bounds().toJSON()).toEqual({ x: 3, y: 4, w: 0, h: 0 });
  });
});
