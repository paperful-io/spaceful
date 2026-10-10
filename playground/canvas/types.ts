import type { PointLike } from "spaceful";
import type { RefObject } from "react";

import type { Scene } from "./scene";

export type ToolId =
  | "select"
  | "hand"
  | "rect"
  | "polygon"
  | "overlap"
  | "search"
  | "nearest";

export type Viewport = { x: number; y: number; zoom: number };

export type CanvasOptions = {
  /** How many neighbours the nearest tool asks for. */
  k: number;
  /** Nearest tool search radius in world units; Infinity means no limit. */
  maxDistance: number;
  /** Which query the search tool runs. */
  searchMode: "search" | "collides";
};

export type ToolEvent = {
  /** Pointer position in world coordinates. */
  point: PointLike;
  shiftKey: boolean;
  /** Milliseconds since the page loaded, for double-click detection. */
  timeStamp: number;
};

export type ToolHandlers = {
  down?(event: ToolEvent): void;
  move?(event: ToolEvent): void;
  up?(event: ToolEvent): void;
  leave?(): void;
  /** Return true when the key was handled. */
  key?(event: KeyboardEvent): boolean | void;
};

export type ToolProps = {
  scene: Scene;
  version: number;
  view: Viewport;
  options: CanvasOptions;
  handlers: RefObject<ToolHandlers>;
  setCursor(cursor: string): void;
};
