# Spaceful

**Delightful, lightweight 2D geometry and spatial indexing for TypeScript.**

Spaceful gives your app spatial superpowers with simple geometry primitives and fast spatial queries for points, rectangles, polygons, and rotated shapes.

Built for document processing, layout engines, canvas systems, editors, diagrams, and anything else that lives in 2D space.

## Install

```bash
# npm
npm install spaceful

# Bun
bun add spaceful

# Yarn
yarn add spaceful

# pnpm
pnpm add spaceful
```

## Geometry

```ts
import { Point, Rect, Polygon } from "spaceful";

const point = new Point({ x: 10, y: 20 });

const rect = new Rect({ x: 10, y: 20, w: 200, h: 80 });

const polygon = new Polygon([
  new Point({ x: 0, y: 0 }),
  new Point({ x: 100, y: 0 }),
  new Point({ x: 80, y: 50 }),
]);
```

Spaceful geometry is immutable, predictable, and easy to compose.

```ts
const moved = rect.translate({ x: 20, y: 10 });

const rotated = rect.rotate(15);
```

Rotation happens around the center of the shape.

A rotated rectangle naturally becomes a polygon.

```ts
const rotated = rect.rotate(15);

rotated instanceof Polygon;
// true
```

## Spatial superpowers

Geometry objects come with the operations you need most:

```ts
rect.intersects(other);

rect.contains(point);

rect.distanceTo(other);

rect.bounds();
```

No large geometry framework. No complicated setup.

Just a lightweight API for working with 2D space.

## Spatial index

Create a space and start adding things:

```ts
import { Space, Rect } from "spaceful";

const space = new Space();

space.insert(new Rect({ x: 0, y: 0, w: 100, h: 100 }), {
  id: "node_1",
  meta: {
    name: "Hello",
  },
});
```

Search an area:

```ts
const results = space.search(new Rect({ x: 20, y: 20, w: 50, h: 50 }));
```

Find the nearest item:

```ts
const nearest = space.nearest(new Point({ x: 10, y: 10 }));
```

Remove an item:

```ts
space.remove("node_1");
```

Bulk load:

```ts
space.load([
  {
    id: "a",
    geometry: new Rect({ x: 0, y: 0, w: 100, h: 100 }),
    meta: {},
  },
  {
    id: "b",
    geometry: new Rect({ x: 200, y: 200, w: 100, h: 100 }),
    meta: {},
  },
]);
```

Bulk loading is much faster than inserting items one by one, and builds a better tree.

Searches use the exact shape, not just bounding boxes, so a rotated item is only found where it really is.

### More spatial superpowers

Find the `k` nearest items, closest first:

```ts
const closest = space.knn(new Point({ x: 10, y: 10 }), 5);
```

Only look so far:

```ts
space.nearest(new Point({ x: 10, y: 10 }), { maxDistance: 50 });

space.knn(new Point({ x: 10, y: 10 }), 5, { maxDistance: 50 });
```

Check if anything is in the way, stopping at the first hit:

```ts
space.collides(new Rect({ x: 20, y: 20, w: 50, h: 50 }));
// true
```

Move an item or change its meta:

```ts
space.update("node_1", {
  geometry: new Rect({ x: 300, y: 300, w: 100, h: 100 }),
});

space.update("node_1", { meta: { name: "Renamed" } });
```

Look things up:

```ts
space.get("node_1");
// { id: "node_1", geometry: Rect, meta: { name: "Renamed" } }

space.has("node_1");

space.size;

space.all();

for (const item of space) {
  // ...
}

space.clear();
```

Ids are optional. When you leave them out, Spaceful generates one for you:

```ts
const { id } = space.insert(new Point({ x: 10, y: 10 }));
```

Type your meta for a fully typed space:

```ts
const space = new Space<{ name: string }>();

space.insert(rect, { id: "node_1", meta: { name: "Hello" } });

space.get("node_1")?.meta.name;
// string
```

Tune the tree for your workload. Higher values make inserts faster and searches slightly slower:

```ts
const space = new Space({ maxEntries: 16 });
// default: 9
```

## Shapes

Spaceful keeps the core small:

- `Point`
- `Rect`
- `Polygon`

More complex and rotated shapes can be represented using polygons without making the API unnecessarily complicated.

## Runs anywhere

Spaceful has zero dependencies and only uses standard JavaScript, so it works in browsers, web workers, Node, Bun and Deno.

## Credits

The spatial index is built on the brilliant work of [Volodymyr Agafonkin](https://github.com/mourner):

- [rbush](https://github.com/mourner/rbush) (MIT): the R-tree, R\*-style node splitting and OMT bulk loading.
- [quickselect](https://github.com/mourner/quickselect) (ISC): the Floyd-Rivest selection used by bulk loading.
- [rbush-knn](https://github.com/mourner/rbush-knn) (ISC): the best-first nearest-neighbour search.

Spaceful reimplements these algorithms with optimizations of its own. See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) for their licenses.

## Built by Paperful

Spaceful was created to power spatial operations inside [Paperful](https://paperful.io).

It helps us work with document nodes, rotated text, layout analysis, hit testing, and spatial search.

Now those same spatial superpowers are available anywhere.
