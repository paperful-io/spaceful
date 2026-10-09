import type { BBox, Geometry, PointLike, RectLike } from "../types/general";
import {
  assertFinite,
  EPSILON,
  shapeContains,
  shapesDistance,
  shapesIntersect,
} from "../utils/geometry";
import { Point } from "./point";
import { Polygon } from "./polygon";

/**
 * An immutable, axis-aligned rectangle. `x` and `y` are its top-left corner
 * in y-down space. Negative sizes are normalized.
 *
 * @example
 * const rect = new Rect({ x: 10, y: 20, w: 200, h: 80 });
 */
export class Rect {
  readonly type = "rect" as const;

  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;

  private ring?: readonly PointLike[];

  constructor({ x, y, w, h }: RectLike) {
    assertFinite({ x, y, w, h });

    this.x = w < 0 ? x + w : x;
    this.y = h < 0 ? y + h : y;
    this.w = Math.abs(w);
    this.h = Math.abs(h);
  }

  get minX() {
    return this.x;
  }

  get minY() {
    return this.y;
  }

  get maxX() {
    return this.x + this.w;
  }

  get maxY() {
    return this.y + this.h;
  }

  get area() {
    return this.w * this.h;
  }

  get center(): Point {
    return new Point({ x: this.x + this.w / 2, y: this.y + this.h / 2 });
  }

  /**
   * The four corners, clockwise from the top-left.
   */
  corners(): [Point, Point, Point, Point] {
    return [
      new Point({ x: this.minX, y: this.minY }),
      new Point({ x: this.maxX, y: this.minY }),
      new Point({ x: this.maxX, y: this.maxY }),
      new Point({ x: this.minX, y: this.maxY }),
    ];
  }

  /**
   * Returns a new rectangle moved by the given offset.
   */
  translate({ x = 0, y = 0 }: Partial<PointLike>): Rect {
    return new Rect({ x: this.x + x, y: this.y + y, w: this.w, h: this.h });
  }

  /**
   * Rotates the rectangle by `degrees` (clockwise in y-down space) around its
   * center. A rotated rectangle is no longer axis-aligned, so this always
   * returns a polygon.
   */
  rotate(degrees: number): Polygon {
    return this.toPolygon().rotate(degrees);
  }

  /**
   * The same rectangle as a polygon.
   */
  toPolygon(): Polygon {
    return new Polygon(this.corners());
  }

  /**
   * Whether this rectangle overlaps or touches the given geometry.
   */
  intersects(other: Geometry): boolean {
    return shapesIntersect(this, other);
  }

  /**
   * Whether the given geometry lies entirely within this rectangle, boundary
   * included.
   */
  contains(other: Geometry): boolean {
    return shapeContains(this, other);
  }

  /**
   * The shortest distance between this rectangle and the given geometry, `0`
   * when they overlap or touch.
   */
  distanceTo(other: Geometry): number {
    return shapesDistance(this, other);
  }

  /**
   * Whether both rectangles share the same position and size (within a
   * tolerance).
   */
  equals(other: RectLike, epsilon = EPSILON): boolean {
    const rect = other instanceof Rect ? other : new Rect(other);

    return (
      Math.abs(this.x - rect.x) <= epsilon &&
      Math.abs(this.y - rect.y) <= epsilon &&
      Math.abs(this.w - rect.w) <= epsilon &&
      Math.abs(this.h - rect.h) <= epsilon
    );
  }

  /**
   * The axis-aligned bounding box, which for a rectangle is itself.
   */
  bounds(): Rect {
    return this;
  }

  /** @internal */
  bbox(): BBox {
    return this;
  }

  /** @internal */
  toRing(): readonly PointLike[] {
    return (this.ring ??= this.corners());
  }

  toJSON(): RectLike {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }
}
