import type { BBox, Geometry, PointLike } from "../types/general";
import {
  EPSILON,
  ringBBox,
  ringCentroid,
  ringSignedArea,
  rotatePoint,
  shapeContains,
  shapesDistance,
  shapesIntersect,
} from "../utils/geometry";
import { Point } from "./point";
import { Rect } from "./rect";

/**
 * An immutable, simple polygon (convex or concave). The ring is implicitly
 * closed, so the first point should not be repeated at the end.
 *
 * @example
 * const triangle = new Polygon([
 *   new Point({ x: 0, y: 0 }),
 *   new Point({ x: 100, y: 0 }),
 *   new Point({ x: 80, y: 50 }),
 * ]);
 */
export class Polygon {
  readonly type = "polygon" as const;

  readonly points: readonly Point[];

  private readonly box: BBox;

  constructor(points: readonly PointLike[]) {
    if (points.length < 3)
      throw new RangeError(
        `A polygon needs at least 3 points, got ${points.length}.`,
      );

    this.points = Object.freeze(
      points.map((point) => (point instanceof Point ? point : new Point(point))),
    );
    this.box = ringBBox(this.points);
  }

  get area() {
    return Math.abs(ringSignedArea(this.points));
  }

  /**
   * The center of mass of the polygon, which stays put when it rotates.
   */
  get centroid(): Point {
    return new Point(ringCentroid(this.points));
  }

  /**
   * Returns a new polygon moved by the given offset.
   */
  translate(offset: Partial<PointLike>): Polygon {
    return new Polygon(this.points.map((point) => point.translate(offset)));
  }

  /**
   * Returns a new polygon rotated by `degrees` (clockwise in y-down space)
   * around its centroid.
   */
  rotate(degrees: number): Polygon {
    const origin = ringCentroid(this.points);

    return new Polygon(
      this.points.map((point) => rotatePoint(point, origin, degrees)),
    );
  }

  /**
   * Whether this polygon overlaps or touches the given geometry.
   */
  intersects(other: Geometry): boolean {
    return shapesIntersect(this, other);
  }

  /**
   * Whether the given geometry lies entirely within this polygon, boundary
   * included.
   */
  contains(other: Geometry): boolean {
    return shapeContains(this, other);
  }

  /**
   * The shortest distance between this polygon and the given geometry, `0`
   * when they overlap or touch.
   */
  distanceTo(other: Geometry): number {
    return shapesDistance(this, other);
  }

  /**
   * Whether both polygons have the same points in the same order (within a
   * tolerance).
   */
  equals(other: Polygon, epsilon = EPSILON): boolean {
    return (
      this.points.length === other.points.length &&
      this.points.every((point, i) => point.equals(other.points[i]!, epsilon))
    );
  }

  /**
   * The smallest axis-aligned rectangle containing the polygon.
   */
  bounds(): Rect {
    const { minX, minY, maxX, maxY } = this.box;
    return new Rect({ x: minX, y: minY, w: maxX - minX, h: maxY - minY });
  }

  /** @internal */
  bbox(): BBox {
    return this.box;
  }

  /** @internal */
  toRing(): readonly PointLike[] {
    return this.points;
  }

  toJSON(): PointLike[] {
    return this.points.map((point) => point.toJSON());
  }
}
