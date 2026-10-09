/**
 * A binary min-heap keyed by a numeric priority.
 *
 * Values and priorities live in parallel arrays so pushing doesn't allocate a
 * wrapper object per entry, which matters in hot nearest-neighbour loops.
 */
export class MinHeap<T> {
  private readonly values: T[] = [];
  private readonly priorities: number[] = [];

  get size() {
    return this.values.length;
  }

  push(value: T, priority: number) {
    const values = this.values;
    const priorities = this.priorities;

    let pos = values.length;
    values.push(value);
    priorities.push(priority);

    // Sift up.
    while (pos > 0) {
      const parent = (pos - 1) >> 1;
      const parentPriority = priorities[parent]!;
      if (priority >= parentPriority) break;

      values[pos] = values[parent]!;
      priorities[pos] = parentPriority;
      pos = parent;
    }

    values[pos] = value;
    priorities[pos] = priority;
  }

  peekPriority(): number | undefined {
    return this.priorities[0];
  }

  pop(): T | undefined {
    const values = this.values;
    const priorities = this.priorities;
    if (values.length === 0) return undefined;

    const top = values[0];
    const lastValue = values.pop()!;
    const lastPriority = priorities.pop()!;
    const length = values.length;

    if (length > 0) {
      // Sift down.
      let pos = 0;
      const half = length >> 1;

      while (pos < half) {
        let child = 2 * pos + 1;
        const right = child + 1;
        if (right < length && priorities[right]! < priorities[child]!)
          child = right;
        if (priorities[child]! >= lastPriority) break;

        values[pos] = values[child]!;
        priorities[pos] = priorities[child]!;
        pos = child;
      }

      values[pos] = lastValue;
      priorities[pos] = lastPriority;
    }

    return top;
  }
}
