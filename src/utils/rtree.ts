import type { BBox } from "../types/general";
import { MinHeap } from "./heap";

/*!
 * Based on the algorithms of:
 * - rbush, Copyright (c) 2024 Volodymyr Agafonkin, MIT License
 *   https://github.com/mourner/rbush
 * - quickselect, Copyright (c) 2024 Vladimir Agafonkin, ISC License
 *   https://github.com/mourner/quickselect
 * - rbush-knn, Copyright (c) 2016 Vladimir Agafonkin, ISC License
 *   https://github.com/mourner/rbush-knn
 * See THIRD_PARTY_NOTICES.md for the full license texts.
 */

/*
 * An R-tree built on the algorithms popularised by rbush: R*-style node
 * splits, OMT bulk loading and best-first nearest-neighbour search.
 *
 * Differences that make it faster, especially on V8 (Chrome, Node):
 * - Node children are sorted with an insertion sort reading keys directly
 *   instead of Array#sort with a comparator, and bulk loading selects with a
 *   callback-free quickselect.
 * - Split selection never allocates: margins are computed incrementally and
 *   split candidates use preallocated prefix/suffix typed arrays.
 * - Nodes are plain object literals, which V8 optimizes better than class
 *   instances with declared fields.
 * - Traversals are iterative (no recursion, no generators).
 * - Removal from a leaf swaps with the last child instead of splicing.
 * - Nearest-neighbour search uses bounding box distance as a lower bound and
 *   computes the (possibly expensive) exact distance lazily.
 *
 * Only standard ECMAScript is used, so it runs anywhere: browsers, workers,
 * Node, Bun and Deno.
 */

type Node<T> = BBox & {
  children: (Node<T> | T)[];
  height: number;
  leaf: boolean;
};

function createNode<T>(children: (Node<T> | T)[]): Node<T> {
  return {
    children,
    height: 1,
    leaf: true,
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };
}

type Entry<T> = Node<T> | T;

function isNode<T>(entry: Entry<T>): entry is Node<T> {
  // Items never carry `children`, so this tells nodes apart without a class.
  return (entry as Node<T>).children !== undefined;
}

/**
 * Returns `true` to stop the traversal early.
 */
export type Visitor<T> = (item: T) => boolean | void;

export class RTree<T extends BBox> {
  private readonly maxEntries: number;
  private readonly minEntries: number;

  private root: Node<T>;

  // Scratch buffers for split selection: bounding boxes of children[0..i]
  // (prefix) and children[i..M-1] (suffix).
  private readonly pMinX: Float64Array;
  private readonly pMinY: Float64Array;
  private readonly pMaxX: Float64Array;
  private readonly pMaxY: Float64Array;
  private readonly sMinX: Float64Array;
  private readonly sMinY: Float64Array;
  private readonly sMaxX: Float64Array;
  private readonly sMaxY: Float64Array;

  constructor(maxEntries = 9) {
    this.maxEntries = Math.max(4, Math.floor(maxEntries));
    this.minEntries = Math.max(2, Math.ceil(this.maxEntries * 0.4));

    const size = this.maxEntries + 1;
    this.pMinX = new Float64Array(size);
    this.pMinY = new Float64Array(size);
    this.pMaxX = new Float64Array(size);
    this.pMaxY = new Float64Array(size);
    this.sMinX = new Float64Array(size);
    this.sMinY = new Float64Array(size);
    this.sMaxX = new Float64Array(size);
    this.sMaxY = new Float64Array(size);

    this.root = createNode<T>([]);
  }

  /**
   * Every item in the tree.
   */
  all(): T[] {
    const result: T[] = [];
    this.visitAll(this.root, (item) => {
      result.push(item);
    });
    return result;
  }

  /**
   * Visits every item whose bounding box intersects `bbox`.
   *
   * @returns `true` when the visitor stopped the traversal.
   */
  search(bbox: BBox, visit: Visitor<T>): boolean {
    let node: Node<T> | undefined = this.root;
    if (!intersects(bbox, node)) return false;

    const stack: Node<T>[] = [];

    while (node) {
      const children = node.children;

      for (let i = 0; i < children.length; i++) {
        const child = children[i]!;
        if (!intersects(bbox, child)) continue;

        if (node.leaf) {
          if (visit(child as T)) return true;
        } else if (contains(bbox, child)) {
          // Everything below lies inside the query, skip the bbox checks.
          if (this.visitAll(child as Node<T>, visit)) return true;
        } else {
          stack.push(child as Node<T>);
        }
      }

      node = stack.pop();
    }

    return false;
  }

  /**
   * Inserts a single item.
   */
  insert(item: T) {
    this.insertAt(item, this.root.height - 1);
  }

  /**
   * Bulk inserts items using Overlap Minimizing Top-down (OMT) packing, which
   * is much faster than inserting one by one and produces a better tree.
   */
  load(items: readonly T[]) {
    if (items.length === 0) return;

    if (items.length < this.minEntries) {
      for (const item of items) this.insert(item);
      return;
    }

    let node = this.build(items.slice(), 0, items.length - 1, 0);

    if (this.root.children.length === 0) {
      this.root = node;
    } else if (this.root.height === node.height) {
      this.splitRoot(this.root, node);
    } else {
      if (this.root.height < node.height) {
        const root = this.root;
        this.root = node;
        node = root;
      }

      // Insert the smaller tree into the larger one at the matching level.
      this.insertAt(node, this.root.height - node.height - 1);
    }
  }

  /**
   * Removes an item by reference.
   *
   * @returns whether the item was found.
   */
  remove(item: T): boolean {
    const path: Node<T>[] = [];
    const indexes: number[] = [];

    let node: Node<T> | undefined = this.root;
    let parent: Node<T> | undefined;
    let index = 0;
    let goingUp = false;

    // Depth-first search guided by bounding box containment.
    while (node || path.length) {
      if (!node) {
        node = path.pop()!;
        parent = path[path.length - 1];
        index = indexes.pop()!;
        goingUp = true;
      }

      if (node.leaf) {
        const children = node.children;
        const found = children.indexOf(item);

        if (found !== -1) {
          children[found] = children[children.length - 1]!;
          children.pop();
          path.push(node);
          this.condense(path);
          return true;
        }
      }

      if (!goingUp && !node.leaf && contains(node, item)) {
        path.push(node);
        indexes.push(index);
        index = 0;
        parent = node;
        node = node.children[0] as Node<T>;
      } else if (parent) {
        index++;
        node = parent.children[index] as Node<T> | undefined;
        goingUp = false;
      } else {
        node = undefined;
      }
    }

    return false;
  }

  clear() {
    this.root = createNode<T>([]);
  }

  /**
   * Best-first k-nearest-neighbour search.
   *
   * @param bbox Bounding box of the query, used as a lower bound to prune.
   * @param distance Exact distance from the query to an item. Must never be
   * smaller than the bounding box distance.
   */
  nearest(
    bbox: BBox,
    distance: (item: T) => number,
    k: number,
    maxDistance = Infinity,
  ): T[] {
    const result: T[] = [];
    if (k <= 0 || this.root.children.length === 0) return result;

    // Nodes and items ordered by their lower bound distance.
    const queue = new MinHeap<Entry<T>>();
    // Items whose exact distance is known.
    const exact = new MinHeap<T>();

    queue.push(this.root, bboxDistance(bbox, this.root));

    while (true) {
      // An item is the next nearest once nothing left can be closer.
      while (
        exact.size &&
        (queue.size === 0 || exact.peekPriority()! <= queue.peekPriority()!)
      ) {
        result.push(exact.pop()!);
        if (result.length === k) return result;
      }

      const next = queue.pop();
      if (next === undefined) break;

      if (isNode(next)) {
        const children = next.children;

        for (let i = 0; i < children.length; i++) {
          const child = children[i]!;
          const d = bboxDistance(bbox, child);
          if (d <= maxDistance) queue.push(child, d);
        }
      } else {
        const d = distance(next);
        if (d <= maxDistance) exact.push(next, d);
      }
    }

    return result;
  }

  private visitAll(node: Node<T>, visit: Visitor<T>): boolean {
    const stack: Node<T>[] = [];
    let current: Node<T> | undefined = node;

    while (current) {
      const children = current.children;

      if (current.leaf) {
        for (let i = 0; i < children.length; i++) {
          if (visit(children[i] as T)) return true;
        }
      } else {
        for (let i = 0; i < children.length; i++) {
          stack.push(children[i] as Node<T>);
        }
      }

      current = stack.pop();
    }

    return false;
  }

  private build(
    items: T[],
    left: number,
    right: number,
    height: number,
  ): Node<T> {
    const n = right - left + 1;
    let m = this.maxEntries;

    if (n <= m) {
      const node = createNode<T>(items.slice(left, right + 1));
      calcBBox(node);
      return node;
    }

    if (!height) {
      // Target height of the bulk-loaded tree.
      height = Math.ceil(Math.log(n) / Math.log(m));
      // Target number of root entries to maximize storage utilization.
      m = Math.ceil(n / Math.pow(m, height - 1));
    }

    const node = createNode<T>([]);
    node.leaf = false;
    node.height = height;

    // Split the items into m mostly square tiles.
    const n2 = Math.ceil(n / m);
    const n1 = n2 * Math.ceil(Math.sqrt(m));

    multiSelect(items, left, right, n1, false);

    for (let i = left; i <= right; i += n1) {
      const right2 = Math.min(i + n1 - 1, right);

      multiSelect(items, i, right2, n2, true);

      for (let j = i; j <= right2; j += n2) {
        const right3 = Math.min(j + n2 - 1, right2);
        node.children.push(this.build(items, j, right3, height - 1));
      }
    }

    calcBBox(node);
    return node;
  }

  private insertAt(item: Entry<T>, level: number) {
    const path: Node<T>[] = [];
    const node = this.chooseSubtree(item, this.root, level, path);

    node.children.push(item);
    extend(node, item);

    // Split overflowing nodes upwards.
    while (level >= 0 && path[level]!.children.length > this.maxEntries) {
      this.split(path, level);
      level--;
    }

    for (let i = level; i >= 0; i--) extend(path[i]!, item);
  }

  private chooseSubtree(
    bbox: BBox,
    node: Node<T>,
    level: number,
    path: Node<T>[],
  ): Node<T> {
    while (true) {
      path.push(node);
      if (node.leaf || path.length - 1 === level) return node;

      const children = node.children as Node<T>[];
      let target = children[0]!;
      let minArea = Infinity;
      let minEnlargement = Infinity;

      for (let i = 0; i < children.length; i++) {
        const child = children[i]!;
        const area = bboxArea(child);
        const enlargement =
          (Math.max(bbox.maxX, child.maxX) - Math.min(bbox.minX, child.minX)) *
            (Math.max(bbox.maxY, child.maxY) - Math.min(bbox.minY, child.minY)) -
          area;

        // Least enlargement first, then least area to resolve ties.
        if (enlargement < minEnlargement) {
          minEnlargement = enlargement;
          minArea = area < minArea ? area : minArea;
          target = child;
        } else if (enlargement === minEnlargement && area < minArea) {
          minArea = area;
          target = child;
        }
      }

      node = target;
    }
  }

  private split(path: Node<T>[], level: number) {
    const node = path[level]!;
    const total = node.children.length;
    const min = this.minEntries;

    this.chooseSplitAxis(node, min, total);
    const index = this.chooseSplitIndex(min, total);

    const sibling = createNode<T>(node.children.splice(index, total - index));
    sibling.height = node.height;
    sibling.leaf = node.leaf;

    calcBBox(node);
    calcBBox(sibling);

    if (level) path[level - 1]!.children.push(sibling);
    else this.splitRoot(node, sibling);
  }

  private splitRoot(node: Node<T>, sibling: Node<T>) {
    this.root = createNode<T>([node, sibling]);
    this.root.height = node.height + 1;
    this.root.leaf = false;
    calcBBox(this.root);
  }

  /**
   * Sorts the children along the axis with the smallest total margin of all
   * valid distributions, leaving the prefix/suffix buffers ready for it.
   */
  private chooseSplitAxis(node: Node<T>, min: number, total: number) {
    const children = node.children;

    sortByMinX(children);
    const xMargin = marginSum(children, min, total);

    sortByMinY(children);
    const yMargin = marginSum(children, min, total);

    if (xMargin < yMargin) sortByMinX(children);

    this.fillPrefixSuffix(children);
  }

  /**
   * The split index with the least overlap between both halves, then the
   * least total area.
   */
  private chooseSplitIndex(min: number, total: number) {
    const pMinX = this.pMinX;
    const pMinY = this.pMinY;
    const pMaxX = this.pMaxX;
    const pMaxY = this.pMaxY;
    const sMinX = this.sMinX;
    const sMinY = this.sMinY;
    const sMaxX = this.sMaxX;
    const sMaxY = this.sMaxY;

    let index = total - min;
    let minOverlap = Infinity;
    let minArea = Infinity;

    for (let i = min; i <= total - min; i++) {
      const l = i - 1;

      const overlapW = Math.min(pMaxX[l]!, sMaxX[i]!) - Math.max(pMinX[l]!, sMinX[i]!);
      const overlapH = Math.min(pMaxY[l]!, sMaxY[i]!) - Math.max(pMinY[l]!, sMinY[i]!);
      const overlap = Math.max(0, overlapW) * Math.max(0, overlapH);

      const area =
        (pMaxX[l]! - pMinX[l]!) * (pMaxY[l]! - pMinY[l]!) +
        (sMaxX[i]! - sMinX[i]!) * (sMaxY[i]! - sMinY[i]!);

      if (overlap < minOverlap || (overlap === minOverlap && area < minArea)) {
        minOverlap = overlap;
        minArea = area;
        index = i;
      }
    }

    return index;
  }

  private fillPrefixSuffix(children: readonly BBox[]) {
    const pMinX = this.pMinX;
    const pMinY = this.pMinY;
    const pMaxX = this.pMaxX;
    const pMaxY = this.pMaxY;
    const sMinX = this.sMinX;
    const sMinY = this.sMinY;
    const sMaxX = this.sMaxX;
    const sMaxY = this.sMaxY;
    const n = children.length;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < n; i++) {
      const child = children[i]!;
      if (child.minX < minX) minX = child.minX;
      if (child.minY < minY) minY = child.minY;
      if (child.maxX > maxX) maxX = child.maxX;
      if (child.maxY > maxY) maxY = child.maxY;
      pMinX[i] = minX;
      pMinY[i] = minY;
      pMaxX[i] = maxX;
      pMaxY[i] = maxY;
    }

    minX = Infinity;
    minY = Infinity;
    maxX = -Infinity;
    maxY = -Infinity;

    for (let i = n - 1; i >= 0; i--) {
      const child = children[i]!;
      if (child.minX < minX) minX = child.minX;
      if (child.minY < minY) minY = child.minY;
      if (child.maxX > maxX) maxX = child.maxX;
      if (child.maxY > maxY) maxY = child.maxY;
      sMinX[i] = minX;
      sMinY[i] = minY;
      sMaxX[i] = maxX;
      sMaxY[i] = maxY;
    }
  }

  /**
   * Removes empty nodes and shrinks bounding boxes along the path.
   */
  private condense(path: Node<T>[]) {
    for (let i = path.length - 1; i >= 0; i--) {
      const node = path[i]!;

      if (node.children.length === 0) {
        if (i > 0) {
          const siblings = path[i - 1]!.children;
          siblings.splice(siblings.indexOf(node), 1);
        } else {
          this.clear();
        }
      } else {
        calcBBox(node);
      }
    }
  }
}

/**
 * Sum of the margins of both halves for every valid split index, computed
 * incrementally without allocating.
 */
function marginSum(children: readonly BBox[], min: number, total: number) {
  let lMinX = Infinity, lMinY = Infinity, lMaxX = -Infinity, lMaxY = -Infinity;
  let rMinX = Infinity, rMinY = Infinity, rMaxX = -Infinity, rMaxY = -Infinity;

  for (let i = 0; i < min; i++) {
    const left = children[i]!;
    if (left.minX < lMinX) lMinX = left.minX;
    if (left.minY < lMinY) lMinY = left.minY;
    if (left.maxX > lMaxX) lMaxX = left.maxX;
    if (left.maxY > lMaxY) lMaxY = left.maxY;

    const right = children[total - 1 - i]!;
    if (right.minX < rMinX) rMinX = right.minX;
    if (right.minY < rMinY) rMinY = right.minY;
    if (right.maxX > rMaxX) rMaxX = right.maxX;
    if (right.maxY > rMaxY) rMaxY = right.maxY;
  }

  let sum = lMaxX - lMinX + (lMaxY - lMinY) + (rMaxX - rMinX) + (rMaxY - rMinY);

  for (let i = min; i < total - min; i++) {
    const left = children[i]!;
    if (left.minX < lMinX) lMinX = left.minX;
    if (left.minY < lMinY) lMinY = left.minY;
    if (left.maxX > lMaxX) lMaxX = left.maxX;
    if (left.maxY > lMaxY) lMaxY = left.maxY;
    sum += lMaxX - lMinX + (lMaxY - lMinY);

    const right = children[total - 1 - i]!;
    if (right.minX < rMinX) rMinX = right.minX;
    if (right.minY < rMinY) rMinY = right.minY;
    if (right.maxX > rMaxX) rMaxX = right.maxX;
    if (right.maxY > rMaxY) rMaxY = right.maxY;
    sum += rMaxX - rMinX + (rMaxY - rMinY);
  }

  return sum;
}

// Nodes hold at most `maxEntries + 1` children, where insertion sort reading
// the keys directly beats Array#sort with a comparator callback.
function sortByMinX(items: BBox[]) {
  for (let i = 1; i < items.length; i++) {
    const item = items[i]!;
    const key = item.minX;
    let j = i - 1;
    while (j >= 0 && items[j]!.minX > key) {
      items[j + 1] = items[j]!;
      j--;
    }
    items[j + 1] = item;
  }
}

function sortByMinY(items: BBox[]) {
  for (let i = 1; i < items.length; i++) {
    const item = items[i]!;
    const key = item.minY;
    let j = i - 1;
    while (j >= 0 && items[j]!.minY > key) {
      items[j + 1] = items[j]!;
      j--;
    }
    items[j + 1] = item;
  }
}

function calcBBox<T extends BBox>(node: Node<T>) {
  node.minX = Infinity;
  node.minY = Infinity;
  node.maxX = -Infinity;
  node.maxY = -Infinity;

  const children = node.children;
  for (let i = 0; i < children.length; i++) extend(node, children[i]!);
}

function extend(a: BBox, b: BBox) {
  if (b.minX < a.minX) a.minX = b.minX;
  if (b.minY < a.minY) a.minY = b.minY;
  if (b.maxX > a.maxX) a.maxX = b.maxX;
  if (b.maxY > a.maxY) a.maxY = b.maxY;
}

function intersects(a: BBox, b: BBox) {
  return (
    b.minX <= a.maxX && b.minY <= a.maxY && b.maxX >= a.minX && b.maxY >= a.minY
  );
}

function contains(a: BBox, b: BBox) {
  return (
    a.minX <= b.minX && a.minY <= b.minY && b.maxX <= a.maxX && b.maxY <= a.maxY
  );
}

function bboxArea(a: BBox) {
  return (a.maxX - a.minX) * (a.maxY - a.minY);
}

function bboxDistance(a: BBox, b: BBox) {
  const dx = Math.max(0, a.minX - b.maxX, b.minX - a.maxX);
  const dy = Math.max(0, a.minY - b.maxY, b.minY - a.maxY);
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Partially sorts `items[left..right]` so it's split into groups of `n`
 * items that are unsorted within but ordered between each other.
 */
function multiSelect(
  items: BBox[],
  left: number,
  right: number,
  n: number,
  byY: boolean,
) {
  const stack = [left, right];

  while (stack.length) {
    right = stack.pop()!;
    left = stack.pop()!;

    if (right - left <= n) continue;

    const mid = left + Math.ceil((right - left) / n / 2) * n;
    quickselect(items, mid, left, right, byY);

    stack.push(left, mid, mid, right);
  }
}

/**
 * Floyd-Rivest selection: rearranges items so that `items[k]` is the element
 * that would be there if sorted, with smaller items before it and larger
 * after it.
 */
function quickselect(
  items: BBox[],
  k: number,
  left: number,
  right: number,
  byY: boolean,
) {
  while (right > left) {
    if (right - left > 600) {
      const n = right - left + 1;
      const m = k - left + 1;
      const z = Math.log(n);
      const s = 0.5 * Math.exp((2 * z) / 3);
      const sd =
        0.5 * Math.sqrt((z * s * (n - s)) / n) * (m - n / 2 < 0 ? -1 : 1);
      const newLeft = Math.max(left, Math.floor(k - (m * s) / n + sd));
      const newRight = Math.min(right, Math.floor(k + ((n - m) * s) / n + sd));
      quickselect(items, k, newLeft, newRight, byY);
    }

    const pivot = key(items[k]!, byY);
    let i = left;
    let j = right;

    swap(items, left, k);
    if (key(items[right]!, byY) > pivot) swap(items, left, right);

    while (i < j) {
      swap(items, i, j);
      i++;
      j--;
      while (key(items[i]!, byY) < pivot) i++;
      while (key(items[j]!, byY) > pivot) j--;
    }

    if (key(items[left]!, byY) === pivot) {
      swap(items, left, j);
    } else {
      j++;
      swap(items, j, right);
    }

    if (j <= k) left = j + 1;
    if (k <= j) right = j - 1;
  }
}

function key(item: BBox, byY: boolean) {
  return byY ? item.minY : item.minX;
}

function swap<T>(items: T[], i: number, j: number) {
  const tmp = items[i]!;
  items[i] = items[j]!;
  items[j] = tmp;
}
