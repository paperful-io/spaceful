import { useScene, useSceneVersion } from "@/canvas/hooks";
import { createRandom, randomPolygon, randomSeeds } from "@/canvas/scene";
import type { Scene, ShapeSeed } from "@/canvas/scene";
import { SpaceCanvas } from "@/canvas/space-canvas";

import { Readout, ReadoutRow } from "./demo-section";

// Demo canvases are at least ~340px wide on phones; seeds stay near the
// top-left so the important shapes are visible at any width.
const DEMO_BOUNDS = { x: 24, y: 24, w: 520, h: 360 };

const seeded = (count: number, seed: number) =>
  randomSeeds(count, DEMO_BOUNDS, createRandom(seed));

export function ShapesDemo() {
  return (
    <SpaceCanvas
      tools={["rect", "polygon", "select"]}
      seeds={() => {
        const random = createRandom(11);
        return [
          { kind: "rect", x: 50, y: 60, w: 140, h: 90 },
          { kind: "polygon", points: randomPolygon(random, 300, 120, 70) },
        ];
      }}
      clearable
    />
  );
}

const rotationSeeds = (): ShapeSeed[] => [
  { kind: "rect", x: 70, y: 90, w: 160, h: 90, angle: 20 },
  {
    kind: "polygon",
    points: [
      { x: 320, y: 80 },
      { x: 420, y: 130 },
      { x: 390, y: 240 },
      { x: 300, y: 200 },
    ],
  },
];

export function RotationDemo() {
  const scene = useScene(rotationSeeds);
  const version = useSceneVersion(scene);

  return (
    <SpaceCanvas scene={scene} tools={["select"]}>
      <Readout key={version}>
        {scene.items().map((item) => (
          <ReadoutRow
            key={item.id}
            label={`${item.meta.kind}.rotate(${Math.round(item.meta.angle)})`}
            value={`→ ${item.geometry.type}`}
          />
        ))}
      </Readout>
    </SpaceCanvas>
  );
}

const relationSeeds = (): ShapeSeed[] => [
  { kind: "rect", x: 40, y: 150, w: 200, h: 160, color: "blue" },
  {
    kind: "polygon",
    color: "purple",
    points: [
      { x: 290, y: 170 },
      { x: 370, y: 220 },
      { x: 340, y: 300 },
      { x: 270, y: 280 },
    ],
  },
];

function RelationReadout({ scene }: { scene: Scene }) {
  useSceneVersion(scene);
  const [a, b] = scene.items();
  if (!a || !b) return null;

  const intersects = a.geometry.intersects(b.geometry);
  const aContainsB = a.geometry.contains(b.geometry);
  const bContainsA = b.geometry.contains(a.geometry);

  return (
    <Readout>
      <ReadoutRow
        label={<><span className="text-blue">a</span>.intersects(<span className="text-purple">b</span>)</>}
        value={String(intersects)}
        tone={intersects ? "yes" : "no"}
      />
      <ReadoutRow
        label={<><span className="text-blue">a</span>.contains(<span className="text-purple">b</span>)</>}
        value={String(aContainsB)}
        tone={aContainsB ? "yes" : "no"}
      />
      <ReadoutRow
        label={<><span className="text-purple">b</span>.contains(<span className="text-blue">a</span>)</>}
        value={String(bContainsA)}
        tone={bContainsA ? "yes" : "no"}
      />
      <ReadoutRow
        label={<><span className="text-blue">a</span>.distanceTo(<span className="text-purple">b</span>)</>}
        value={a.geometry.distanceTo(b.geometry).toFixed(1)}
      />
    </Readout>
  );
}

export function RelationsDemo() {
  const scene = useScene(relationSeeds);

  return (
    <SpaceCanvas scene={scene} tools={["select"]} hud={false}>
      <RelationReadout scene={scene} />
    </SpaceCanvas>
  );
}

export function SearchDemo() {
  return <SpaceCanvas tools={["search"]} seeds={() => seeded(40, 3)} />;
}

const collisionSeeds = (): ShapeSeed[] => {
  const random = createRandom(5);

  return [
    { kind: "rect", x: 40, y: 50, w: 90, h: 90, color: "primary" },
    { kind: "rect", x: 200, y: 40, w: 60, h: 220, angle: 15, color: "blue" },
    { kind: "polygon", points: randomPolygon(random, 380, 110, 60), color: "purple" },
    { kind: "rect", x: 320, y: 230, w: 150, h: 50, angle: -25, color: "green" },
    { kind: "polygon", points: randomPolygon(random, 120, 300, 55), color: "blue" },
  ];
};

export function CollisionDemo() {
  return <SpaceCanvas tools={["select", "overlap"]} seeds={collisionSeeds} />;
}

export function NearestDemo() {
  return (
    <SpaceCanvas
      tools={["nearest"]}
      seeds={() => seeded(30, 9)}
      initialOptions={{ k: 3, maxDistance: 200 }}
    />
  );
}

export function BulkDemo() {
  return (
    <SpaceCanvas
      tools={["search", "nearest", "overlap"]}
      seeds={() => seeded(300, 21)}
      randomCounts={[1000, 5000]}
      clearable
    />
  );
}
