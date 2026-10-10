import { useLayoutEffect, useState, useSyncExternalStore } from "react";

import { Scene } from "./scene";
import type { ShapeSeed } from "./scene";
import type { ToolHandlers, ToolProps } from "./types";

/** A scene that lives as long as the component. Seeds are read once. */
export const useScene = (seeds?: ShapeSeed[] | (() => ShapeSeed[])) => {
  const [scene] = useState(
    () => new Scene(typeof seeds === "function" ? seeds() : seeds),
  );

  return scene;
};

/** Re-renders whenever shapes are added, moved, rotated or removed. */
export const useSceneVersion = (scene: Scene) =>
  useSyncExternalStore(scene.subscribe, scene.getVersion, scene.getVersion);

export const useSceneStat = (scene: Scene) =>
  useSyncExternalStore(scene.subscribeStat, scene.getStat, scene.getStat);

/** Registers the active tool's pointer and key handlers with the canvas. */
export const useToolHandlers = (
  { handlers }: Pick<ToolProps, "handlers">,
  next: ToolHandlers,
) => {
  useLayoutEffect(() => {
    handlers.current = next;
  });
};
