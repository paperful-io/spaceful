import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { createRandom, randomPolygon } from "@/canvas/scene";
import type { ShapeSeed } from "@/canvas/scene";
import { SpaceCanvas } from "@/canvas/space-canvas";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { getTitle } from "@/utils/meta.util";

export const Route = createFileRoute("/playground")({
  head: () => ({ meta: [{ title: getTitle("Playground") }] }),
  component: Playground,
});

const starterShapes = (): ShapeSeed[] => {
  const random = createRandom(7);

  return [
    { kind: "rect", x: 180, y: 220, w: 180, h: 110 },
    { kind: "rect", x: 320, y: 290, w: 120, h: 120, angle: 30 },
    { kind: "polygon", points: randomPolygon(random, 580, 300, 90) },
    { kind: "rect", x: 640, y: 440, w: 220, h: 70, angle: -15 },
    { kind: "polygon", points: randomPolygon(random, 260, 500, 70) },
    { kind: "polygon", points: randomPolygon(random, 880, 260, 60) },
  ];
};

function Playground() {
  return (
    <main className="relative">
      <SpaceCanvas
        fullscreen
        seeds={starterShapes}
        randomCounts={[100, 1000]}
        clearable
      >
        <div className="absolute left-4 top-4 flex items-center gap-1 rounded-xl border border-shade-200 bg-shade-50/85 py-1 pl-2 pr-1 backdrop-blur">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg px-1 py-0.5 transition hover:bg-shade-200"
          >
            <ArrowLeft className="size-4 text-shade-500" />
            <Logo />
          </Link>
          <span className="mx-1 h-5 w-px bg-shade-200" />
          <span className="pr-1 text-sm text-shade-500">playground</span>
          <ThemeToggle />
        </div>
      </SpaceCanvas>
    </main>
  );
}
