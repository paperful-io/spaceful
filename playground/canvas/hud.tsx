import { cn } from "@/utils/classes.util";

import { useSceneStat, useSceneVersion } from "./hooks";
import type { Scene } from "./scene";

const formatMs = (ms: number) =>
  ms < 0.01 ? "<0.01 ms" : ms < 10 ? `${ms.toFixed(2)} ms` : `${ms.toFixed(0)} ms`;

/** Item count and the timing of the last query. */
export function Hud({ scene, className }: { scene: Scene; className?: string }) {
  const stat = useSceneStat(scene);
  useSceneVersion(scene);

  return (
    <div
      className={cn(
        "pointer-events-none flex items-center gap-3 rounded-xl border border-shade-200 bg-shade-50/85 px-3 py-1.5 text-xs tabular-nums text-shade-500 backdrop-blur",
        className,
      )}
    >
      <span>
        <span className="text-shade-800">{scene.space.size}</span> items
      </span>
      {stat && (
        <>
          <span className="h-3 w-px bg-shade-200" />
          <span className="font-mono text-shade-700">{stat.name}</span>
          <span className="text-shade-800">{stat.result}</span>
          <span className="text-primary">{formatMs(stat.ms)}</span>
        </>
      )}
    </div>
  );
}
