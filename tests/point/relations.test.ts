import { describe, expect, test } from "bun:test";
import { Point, Polygon, Rect } from "../../src";

describe("point / relations", () => {
  const point = new Point({ x: 10, y: 10 });

  test("intersects", () => {
    expect(point.intersects(new Point({ x: 10, y: 10 }))).toBe(true);
    expect(point.intersects(new Point({ x: 10, y: 11 }))).toBe(false);
    expect(point.intersects(new Rect({ x: 0, y: 0, w: 10, h: 10 }))).toBe(true);
    expect(point.intersects(new Rect({ x: 11, y: 0, w: 10, h: 10 }))).toBe(false);
    expect(
      point.intersects(new Polygon([{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 0, y: 20 }])),
    ).toBe(true);
  });

  test("contains only an equal point", () => {
    expect(point.contains(new Point({ x: 10, y: 10 }))).toBe(true);
    expect(point.contains(new Point({ x: 0, y: 0 }))).toBe(false);
    expect(point.contains(new Rect({ x: 10, y: 10, w: 1, h: 1 }))).toBe(false);
  });

  test("distanceTo", () => {
    expect(point.distanceTo(new Point({ x: 13, y: 14 }))).toBe(5);
    expect(point.distanceTo(new Rect({ x: 13, y: 14, w: 10, h: 10 }))).toBe(5);
    expect(point.distanceTo(new Rect({ x: 0, y: 0, w: 20, h: 20 }))).toBe(0);
    expect(
      point.distanceTo(new Polygon([{ x: 20, y: 0 }, { x: 30, y: 0 }, { x: 20, y: 30 }])),
    ).toBe(10);
  });
});
