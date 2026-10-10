import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Github } from "lucide-react";
import { motion } from "motion/react";

import { buttonVariant } from "@/components/button";
import { InstallCommand } from "@/components/code";
import { DemoSection } from "@/components/demo-section";
import {
  BulkDemo,
  CollisionDemo,
  NearestDemo,
  RelationsDemo,
  RotationDemo,
  SearchDemo,
  ShapesDemo,
} from "@/components/demos";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const GITHUB_URL = "https://github.com/paperful-io/spaceful";

export const Route = createFileRoute("/")({
  component: Home,
});

const SECTIONS = [
  { id: "shapes", label: "Shapes" },
  { id: "rotation", label: "Rotation" },
  { id: "relations", label: "Relations" },
  { id: "search", label: "Search" },
  { id: "collisions", label: "Collisions" },
  { id: "nearest", label: "Nearest" },
  { id: "bulk", label: "Bulk load" },
];

function Home() {
  return (
    <div className="min-h-dvh bg-shade-100 dark:bg-shade-50">
      <Header />
      <Hero />

      <DemoSection
        id="shapes"
        index={1}
        title="Shapes"
        code={`
import { Point, Rect, Polygon, Space } from "spaceful";

const space = new Space();

space.insert(new Rect({ x: 50, y: 60, w: 140, h: 90 }));
space.insert(new Polygon([
  { x: 260, y: 60 }, { x: 360, y: 110 }, { x: 290, y: 190 },
]));
`}
        demo={<ShapesDemo />}
      >
        <p>
          Three immutable primitives: <code>Point</code>, <code>Rect</code> and{" "}
          <code>Polygon</code>. Polygons can be convex or concave, and every
          transform returns a new shape.
        </p>
        <p>
          Drag to draw a rectangle (Shift for a square). Switch to the polygon tool
          and click to place points, then click the first one to close it.
        </p>
      </DemoSection>

      <DemoSection
        id="rotation"
        index={2}
        title="Rotation"
        code={`
const rect = new Rect({ x: 70, y: 90, w: 160, h: 90 });

// Rotates clockwise around the center.
const rotated = rect.rotate(20);
rotated.type; // "polygon"

space.update(id, { geometry: rotated });
`}
        demo={<RotationDemo />}
      >
        <p>
          Shapes rotate around their center. A rotated rectangle isn't
          axis-aligned anymore, so <code>Rect.rotate</code> returns a{" "}
          <code>Polygon</code>.
        </p>
        <p>
          Hover a shape and drag the dashed ring to rotate it. Hold Shift to snap
          to 15°.
        </p>
      </DemoSection>

      <DemoSection
        id="relations"
        index={3}
        title="Relations"
        code={`
a.intersects(b); // touching counts
a.contains(b);
a.distanceTo(b); // 0 when they overlap
`}
        demo={<RelationsDemo />}
      >
        <p>
          Every shape can test itself against any other: <code>intersects</code>,{" "}
          <code>contains</code> and <code>distanceTo</code>. The tests use the
          exact outline, not the bounding box.
        </p>
        <p>Drag the shapes around and watch the values update.</p>
      </DemoSection>

      <DemoSection
        id="search"
        index={4}
        title="Search"
        code={`
const hits = space.search(new Rect({ x: 0, y: 0, w: 200, h: 120 }));
const underCursor = space.search(new Point({ x, y }));

space.collides(area); // stops at the first hit
`}
        demo={<SearchDemo />}
      >
        <p>
          <code>Space</code> is an R-tree. <code>search</code> returns every item
          that touches a query shape, and a <code>Point</code> works as a query
          too, which gives you hit testing.
        </p>
        <p>
          Drag a box or click a point. Switch to <code>collides()</code> to just
          ask whether anything is there.
        </p>
      </DemoSection>

      <DemoSection
        id="collisions"
        index={5}
        title="Collisions"
        code={`
const others = space
  .search(item.geometry)
  .filter((other) => other.id !== item.id);

if (others.length) {
  // overlapping!
}
`}
        demo={<CollisionDemo />}
      >
        <p>
          Querying with a shape's own geometry finds everything it overlaps. Drag a
          shape into another one and both turn red.
        </p>
        <p>
          The overlaps tool runs one search per shape and links every overlapping
          pair.
        </p>
      </DemoSection>

      <DemoSection
        id="nearest"
        index={6}
        title="Nearest"
        code={`
const closest = space.nearest(new Point({ x, y }));

const three = space.knn(new Point({ x, y }), 3, {
  maxDistance: 200,
});
`}
        demo={<NearestDemo />}
      >
        <p>
          <code>nearest</code> and <code>knn</code> return items ordered by their
          true distance to the query. Shapes that contain the point come first,
          at distance 0.
        </p>
        <p>
          Move the pointer over the canvas. Change <code>k</code> and the search
          radius in the toolbar.
        </p>
      </DemoSection>

      <DemoSection
        id="bulk"
        index={7}
        title="Bulk load"
        code={`
space.load(
  shapes.map((geometry) => ({ geometry, meta: { color } })),
);
`}
        demo={<BulkDemo />}
      >
        <p>
          <code>load</code> builds the tree in one pass, which is much faster than
          inserting items one by one. Queries stay fast as the index grows.
        </p>
        <p>
          Add thousands of shapes and compare the query timings in the corner.
        </p>
      </DemoSection>

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-shade-200 bg-shade-100/80 backdrop-blur dark:bg-shade-50/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 md:px-6">
        <Link to="/">
          <Logo />
        </Link>
        <nav className="hidden flex-1 items-center gap-1 text-sm lg:flex">
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-lg px-2.5 py-1.5 text-shade-500 transition hover:bg-shade-200 hover:text-shade-900"
            >
              {section.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <a
            href={GITHUB_URL}
            className={buttonVariant({ size: "sm" })}
            aria-label="GitHub"
          >
            <Github className="size-[18px]" strokeWidth={1.75} />
          </a>
          <ThemeToggle />
          <Link to="/playground" className={buttonVariant({ design: "primary", size: "sm" })}>
            Playground
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 [background-image:linear-gradient(var(--color-shade-200)_1px,transparent_1px),linear-gradient(90deg,var(--color-shade-200)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
      />
      <HeroShapes />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto flex max-w-3xl flex-col items-center gap-7 px-4 py-28 text-center md:py-40"
      >
        <h1 className="font-display text-5xl font-semibold tracking-tight text-shade-900 md:text-7xl">
          Spatial superpowers for TypeScript
        </h1>
        <p className="max-w-xl text-lg text-shade-600">
          Lightweight 2D geometry and an R-tree spatial index. Search, collide and
          find the nearest shapes, including rotated rectangles and concave polygons.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/playground" className={buttonVariant({ design: "primary" })}>
            Open the playground
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </Link>
          <InstallCommand command="bun add spaceful" />
        </div>
        <p className="text-sm text-shade-400">
          Zero dependencies · ESM + CJS · scroll down for live demos
        </p>
      </motion.div>
    </section>
  );
}

/** Decorative floating shapes behind the hero text. */
function HeroShapes() {
  const shapes = [
    { className: "left-[8%] top-[18%] size-24 rounded-md border-primary", rotate: 12 },
    { className: "right-[10%] top-[22%] size-16 rounded-sm border-blue", rotate: -20 },
    { className: "left-[14%] bottom-[14%] h-14 w-28 rounded-sm border-purple", rotate: -8 },
    { className: "right-[16%] bottom-[18%] size-20 rounded-md border-green", rotate: 30 },
  ];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
      {shapes.map((shape, i) => (
        <motion.div
          key={i}
          className={`absolute border-2 bg-current/0 opacity-40 ${shape.className}`}
          initial={{ rotate: shape.rotate, y: 0 }}
          animate={{ rotate: shape.rotate + 360, y: [0, -12, 0] }}
          transition={{
            rotate: { duration: 60 + i * 12, repeat: Infinity, ease: "linear" },
            y: { duration: 6 + i, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      ))}
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-shade-200">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-shade-500 md:flex-row md:px-6">
        <Logo />
        <span>Apache-2.0 · Built for Paperful</span>
        <div className="flex items-center gap-4">
          <a href={GITHUB_URL} className="hover:text-shade-900">
            GitHub
          </a>
          <a href="https://www.npmjs.com/package/spaceful" className="hover:text-shade-900">
            npm
          </a>
          <Link to="/playground" className="hover:text-shade-900">
            Playground
          </Link>
        </div>
      </div>
    </footer>
  );
}
