import type { BBox, Geometry, SpaceItem } from "../types/general";
import { bboxContains, EPSILON, shapesIntersect } from "../utils/geometry";
import { RTree } from "../utils/rtree";

type Entry<M> = BBox & { readonly item: SpaceItem<M> };

/**
 * A spatial index of geometries, backed by an R-tree.
 *
 * @example
 * const space = new Space<{ name: string }>();
 *
 * space.insert(new Rect({ x: 0, y: 0, w: 100, h: 100 }), {
 *   id: "node_1",
 *   meta: { name: "Hello" },
 * });
 *
 * space.search(new Rect({ x: 20, y: 20, w: 50, h: 50 }));
 */
export class Space<M = unknown> {
  private readonly tree: RTree<Entry<M>>;
  private readonly entries = new Map<string, Entry<M>>();

  private nextId = 0;

  constructor({
    maxEntries = 9,
  }: {
    /**
     * Maximum number of children per tree node. Higher values make inserts
     * faster and searches slightly slower.
     *
     * @default 9
     */
    maxEntries?: number;
  } = {}) {
    this.tree = new RTree(maxEntries);
  }

  /**
   * The number of items in the space.
   */
  get size() {
    return this.entries.size;
  }

  /**
   * Adds a geometry to the space. When no id is given, one is generated.
   *
   * @throws when an item with the same id already exists.
   */
  insert(geometry: Geometry, { id, meta }: { id?: string; meta?: M } = {}) {
    const entry = this.createEntry(geometry, id, meta);

    this.tree.insert(entry);
    this.entries.set(entry.item.id, entry);

    return entry.item;
  }

  /**
   * Adds many items at once. Much faster than inserting them one by one,
   * especially into an empty space.
   *
   * @throws when any id is already taken or repeated, without adding anything.
   */
  load(items: readonly { id?: string; geometry: Geometry; meta?: M }[]) {
    const ids = new Set<string>();

    for (const { id } of items) {
      if (id === undefined) continue;
      if (this.entries.has(id) || ids.has(id))
        throw new Error(`An item with id "${id}" already exists.`);
      ids.add(id);
    }

    const entries = items.map(({ id, geometry, meta }) =>
      this.createEntry(geometry, id ?? this.generateId(ids), meta),
    );

    this.tree.load(entries);
    for (const entry of entries) this.entries.set(entry.item.id, entry);

    return entries.map((entry) => entry.item);
  }

  /**
   * Replaces the geometry and/or meta of an existing item.
   *
   * @returns the updated item, or `undefined` if the id doesn't exist.
   */
  update(id: string, changes: { geometry?: Geometry; meta?: M }) {
    const current = this.entries.get(id);
    if (!current) return undefined;

    const entry = this.createEntry(
      changes.geometry ?? current.item.geometry,
      id,
      "meta" in changes ? changes.meta : current.item.meta,
      true,
    );

    this.tree.remove(current);
    this.tree.insert(entry);
    this.entries.set(id, entry);

    return entry.item;
  }

  /**
   * Removes an item by id.
   *
   * @returns whether the item existed.
   */
  remove(id: string) {
    const entry = this.entries.get(id);
    if (!entry) return false;

    this.tree.remove(entry);
    this.entries.delete(id);

    return true;
  }

  get(id: string): SpaceItem<M> | undefined {
    return this.entries.get(id)?.item;
  }

  has(id: string) {
    return this.entries.has(id);
  }

  /**
   * Removes every item.
   */
  clear() {
    this.tree.clear();
    this.entries.clear();
  }

  /**
   * Every item, in insertion order.
   */
  all(): SpaceItem<M>[] {
    return Array.from(this.entries.values(), (entry) => entry.item);
  }

  *[Symbol.iterator](): IterableIterator<SpaceItem<M>> {
    for (const entry of this.entries.values()) yield entry.item;
  }

  /**
   * Items whose geometry intersects (or touches) the given geometry.
   */
  search(geometry: Geometry): SpaceItem<M>[] {
    const result: SpaceItem<M>[] = [];

    this.query(geometry, (item) => {
      result.push(item);
    });

    return result;
  }

  /**
   * Whether any item intersects (or touches) the given geometry. Faster than
   * `search` as it stops at the first match.
   */
  collides(geometry: Geometry): boolean {
    return this.query(geometry, () => true);
  }

  /**
   * The item closest to the given geometry.
   */
  nearest(
    geometry: Geometry,
    options: { maxDistance?: number } = {},
  ): SpaceItem<M> | undefined {
    return this.knn(geometry, 1, options)[0];
  }

  /**
   * The `k` items closest to the given geometry, nearest first. Items that
   * intersect the geometry have a distance of `0`.
   */
  knn(
    geometry: Geometry,
    k: number,
    { maxDistance = Infinity }: { maxDistance?: number } = {},
  ): SpaceItem<M>[] {
    return this.tree
      .nearest(
        geometry.bbox(),
        (entry) => geometry.distanceTo(entry.item.geometry),
        k,
        maxDistance,
      )
      .map((entry) => entry.item);
  }

  private query(geometry: Geometry, visit: (item: SpaceItem<M>) => boolean | void) {
    const { minX, minY, maxX, maxY } = geometry.bbox();
    const query = {
      minX: minX - EPSILON,
      minY: minY - EPSILON,
      maxX: maxX + EPSILON,
      maxY: maxY + EPSILON,
    };
    const isBox = geometry.type !== "polygon";

    return this.tree.search(query, (entry) => {
      const other = entry.item.geometry;

      // Bounding boxes already overlap, so boxes intersect, and a box query
      // intersects anything whose bounding box it contains. Only fall back to
      // the exact test otherwise.
      if (
        (isBox && (other.type !== "polygon" || bboxContains(query, entry))) ||
        shapesIntersect(geometry, other)
      ) {
        return visit(entry.item);
      }
    });
  }

  private createEntry(
    geometry: Geometry,
    id: string | undefined,
    meta: M | undefined,
    replacing = false,
  ): Entry<M> {
    if (id !== undefined && !replacing && this.entries.has(id))
      throw new Error(`An item with id "${id}" already exists.`);

    const { minX, minY, maxX, maxY } = geometry.bbox();

    return {
      minX,
      minY,
      maxX,
      maxY,
      item: { id: id ?? this.generateId(), geometry, meta: meta as M },
    };
  }

  private generateId(reserved?: Set<string>) {
    let id: string;
    do {
      id = String(this.nextId++);
    } while (this.entries.has(id) || reserved?.has(id));
    return id;
  }
}
