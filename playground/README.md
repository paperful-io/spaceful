# Spaceful playground

The Spaceful website: a landing page with a live demo for each feature, plus a full-screen playground at `/playground`.

It's built with TanStack Start, Tailwind v4 and SVG. It imports the library straight from `../src`, so changes to the library show up without rebuilding.

```bash
bun install
bun run dev        # http://localhost:3001
bun run build      # prerenders / and /playground into dist/
```

## Layout

- `routes/`: `index.tsx` (landing page) and `playground.tsx`
- `canvas/`: the `<SpaceCanvas>` used by every demo
  - `scene.ts`: wraps a `Space` and stores each shape's unrotated base plus its angle
  - `tools/`: select (move and rotate), rect, polygon, overlaps, search, nearest
- `components/`: landing page sections, code snippets, theme toggle
- `constants/`, `css/`, `assets/fonts/`: theme and fonts copied from the Paperful website
