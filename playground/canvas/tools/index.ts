import {
  Blend,
  Hand,
  MousePointer2,
  Pentagon,
  Radar,
  ScanSearch,
  Square,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

import type { ToolId, ToolProps } from "../types";

import { NearestTool } from "./nearest";
import { OverlapTool } from "./overlap";
import { PolygonTool } from "./polygon";
import { RectTool } from "./rect";
import { SearchTool } from "./search";
import { SelectTool } from "./select";

export type ToolDefinition = {
  id: ToolId;
  label: string;
  shortcut: string;
  icon: LucideIcon;
  hint: string;
  cursor: string;
  Component: ComponentType<ToolProps> | null;
};

export const TOOLS: Record<ToolId, ToolDefinition> = {
  select: {
    id: "select",
    label: "Select",
    shortcut: "V",
    icon: MousePointer2,
    hint: "Drag to move · drag the dashed ring to rotate (Shift snaps) · Delete removes",
    cursor: "default",
    Component: SelectTool,
  },
  hand: {
    id: "hand",
    label: "Pan",
    shortcut: "H",
    icon: Hand,
    hint: "Drag or scroll to pan · ⌘/Ctrl + scroll to zoom · hold Space to pan from any tool · 0 resets",
    cursor: "grab",
    Component: null,
  },
  rect: {
    id: "rect",
    label: "Rectangle",
    shortcut: "R",
    icon: Square,
    hint: "Click and drag to draw · Shift for a square",
    cursor: "crosshair",
    Component: RectTool,
  },
  polygon: {
    id: "polygon",
    label: "Polygon",
    shortcut: "P",
    icon: Pentagon,
    hint: "Click to add points · click the first point, double-click or Enter to close · Esc cancels",
    cursor: "crosshair",
    Component: PolygonTool,
  },
  overlap: {
    id: "overlap",
    label: "Overlaps",
    shortcut: "O",
    icon: Blend,
    hint: "Highlights every overlapping pair · move or rotate shapes to update live",
    cursor: "default",
    Component: OverlapTool,
  },
  search: {
    id: "search",
    label: "Search",
    shortcut: "S",
    icon: ScanSearch,
    hint: "Drag a query box or click a point · exact-shape hits, not just bounding boxes",
    cursor: "crosshair",
    Component: SearchTool,
  },
  nearest: {
    id: "nearest",
    label: "Nearest",
    shortcut: "N",
    icon: Radar,
    hint: "Move the pointer · finds the k closest shapes with knn",
    cursor: "crosshair",
    Component: NearestTool,
  },
};

export const ALL_TOOLS: ToolId[] = [
  "select",
  "hand",
  "rect",
  "polygon",
  "overlap",
  "search",
  "nearest",
];
