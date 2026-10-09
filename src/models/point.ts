import type { BBox, Geometry, PointLike } from "../types/general";
import {
  assertFinite,
  EPSILON,
  rotatePoint,
  shapeContains,
  shapesDistance,
  shapesIntersect,
} from "../utils/geometry";
import { Rect } from "./rect";

/**
 * An immutable point in 2D space.
 *
 * @example
 * const point = new Point({ x: 10, y: 20 });
 */
export class Point {
  readonly type = "point" as const;

  readonly x: number;
  readonly y: number;

  constructor({ x, y }: PointLike) {
    assertFinite({ x, y });

    this.x = x;
    this.y = y;
  }

  /**
   * Returns a new point moved by the given offset.
   */
  translate({ x = 0, y = 0 }: Partial<PointLike>): Point {
    return new Point({ x: this.x + x, y: this.y + y });
  }

  /**
   * Returns a new point rotated by `degrees` (clockwise in y-down space)
   * around `origin`. Without an origin, the point rotates around itself.
   */
  rotate(degrees: number, origin: PointLike = this): Point {
    return new Point(rotatePoint(this, origin, degrees));
  }

  /**
   * Whether this point touches the given geometry.
   */
  intersects(other: Geometry): boolean {
    return shapesIntersect(this, other);
  }

  /**
   * Whether the given geometry lies entirely within this point, which is only
   * true for an equal point.
   */
  contains(other: Geometry): boolean {
    return shapeContains(this, other);
  }

  /**
   * The shortest distance between this point and the given geometry.
   */
  distanceTo(other: Geometry): number {
    return shapesDistance(this, other);
  }

  /**
   * Whether both points share the same coordinates (within a tolerance).
   */
  equals(other: PointLike, epsilon = EPSILON): boolean {
    return (
      Math.abs(this.x - other.x) <= epsilon &&
      Math.abs(this.y - other.y) <= epsilon
    );
  }

  /**
   * A zero-sized rectangle at this point.
   */
  bounds(): Rect {
    return new Rect({ x: this.x, y: this.y, w: 0, h: 0 });
  }

  /** @internal */
  bbox(): BBox {
    return { minX: this.x, minY: this.y, maxX: this.x, maxY: this.y };
  }

  /** @internal */
  toRing(): readonly PointLike[] {
    return [this];
  }

  toJSON(): PointLike {
    return { x: this.x, y: this.y };
  }
}
