import type { Point } from "../models/point";
import type { Polygon } from "../models/polygon";
import type { Rect } from "../models/rect";

export type PointLike = {
  x: number;
  y: number;
};

export type RectLike = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type BBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type Geometry = Point | Rect | Polygon;

export type SpaceItem<M = unknown> = {
  readonly id: string;
  readonly geometry: Geometry;
  readonly meta: M;
};
