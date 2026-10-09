import { describe, expect, test } from "bun:test";
import { Point, Polygon, Rect } from "../../src";

describe("rect / relations", () => {
  const rect = new Rect({ x: 0, y: 0, w: 100, h: 100 });

  test("intersects rects", () => {
    expect(rect.intersects(new Rect({ x: 50, y: 50, w: 100, h: 100 }))).toBe(true);
    expect(rect.intersects(new Rect({ x: 100, y: 0, w: 10, h: 10 }))).toBe(true);
    expect(rect.intersects(new Rect({ x: 101, y: 0, w: 10, h: 10 }))).toBe(false);
  });

  test("intersects polygons beyond their bounds", () => {
    const diamond = new Rect({ x: 105, y: 105, w: 40, h: 40 }).rotate(45);
    // The diamond's bounding box overlaps the rect's corner, the diamond does not.
    expect(diamond.bounds().intersects(rect)).toBe(true);
    expect(rect.intersects(diamond)).toBe(false);

    expect(rect.intersects(new Rect({ x: 80, y: 80, w: 40, h: 40 }).rotate(45))).toBe(true);
  });

  test("intersects when one contains the other", () => {
    const inner = new Polygon([{ x: 10, y: 10 }, { x: 20, y: 10 }, { x: 15, y: 20 }]);
    expect(rect.intersects(inner)).toBe(true);
    expect(inner.intersects(rect)).toBe(true);
  });

  test("contains", () => {
    expect(rect.contains(new Point({ x: 100, y: 100 }))).toBe(true);
    expect(rect.contains(new Rect({ x: 10, y: 10, w: 90, h: 90 }))).toBe(true);
    expect(rect.contains(new Rect({ x: 10, y: 10, w: 91, h: 90 }))).toBe(false);
    expect(rect.contains(new Rect({ x: 40, y: 40, w: 20, h: 20 }).rotate(30))).toBe(true);
  });

  test("distanceTo", () => {
    expect(rect.distanceTo(new Rect({ x: 103, y: 104, w: 10, h: 10 }))).toBe(5);
    expect(rect.distanceTo(new Rect({ x: 110, y: 0, w: 10, h: 10 }))).toBe(10);
    expect(rect.distanceTo(new Rect({ x: 50, y: 50, w: 10, h: 10 }))).toBe(0);
    expect(
      rect.distanceTo(new Polygon([{ x: 110, y: 50 }, { x: 120, y: 40 }, { x: 120, y: 60 }])),
    ).toBe(10);
  });

  test("bounds is itself", () => {
    expect(rect.bounds()).toBe(rect);
  });
});
