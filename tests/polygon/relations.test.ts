import { describe, expect, test } from "bun:test";
import { Point, Polygon, Rect } from "../../src";

describe("polygon / relations", () => {
  // A "U" shape: the notch between x=10..20 is open at the top.
  const u = new Polygon([
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 20 },
    { x: 20, y: 20 },
    { x: 20, y: 0 },
    { x: 30, y: 0 },
    { x: 30, y: 30 },
    { x: 0, y: 30 },
  ]);

  test("contains points in a concave polygon", () => {
    expect(u.contains(new Point({ x: 5, y: 5 }))).toBe(true);
    expect(u.contains(new Point({ x: 15, y: 10 }))).toBe(false);
    expect(u.contains(new Point({ x: 15, y: 20 }))).toBe(true);
    expect(u.contains(new Point({ x: 0, y: 30 }))).toBe(true);
  });

  test("does not contain geometry spanning the notch", () => {
    expect(u.contains(new Rect({ x: 2, y: 2, w: 6, h: 6 }))).toBe(true);
    expect(u.contains(new Rect({ x: 5, y: 5, w: 20, h: 5 }))).toBe(false);
    // All vertices inside, but the edge passes through the notch.
    expect(u.contains(new Polygon([{ x: 5, y: 5 }, { x: 25, y: 5 }, { x: 15, y: 25 }]))).toBe(false);
  });

  test("intersects", () => {
    expect(u.intersects(new Rect({ x: 12, y: 2, w: 6, h: 6 }))).toBe(false);
    expect(u.intersects(new Rect({ x: 12, y: 2, w: 6, h: 20 }))).toBe(true);
    expect(u.intersects(new Point({ x: 10, y: 10 }))).toBe(true);
  });

  test("distanceTo", () => {
    expect(u.distanceTo(new Rect({ x: 12, y: 2, w: 6, h: 6 }))).toBe(2);
    expect(u.distanceTo(new Point({ x: 15, y: 0 }))).toBe(5);
    expect(u.distanceTo(new Point({ x: 5, y: 5 }))).toBe(0);
    expect(u.distanceTo(new Point({ x: 40, y: 30 }))).toBe(10);
  });

  test("relations are symmetric", () => {
    const rotated = new Rect({ x: 25, y: 25, w: 20, h: 20 }).rotate(20);

    expect(u.intersects(rotated)).toBe(rotated.intersects(u));
    expect(u.distanceTo(rotated)).toBe(rotated.distanceTo(u));
  });
});
