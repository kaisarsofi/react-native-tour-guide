import type { RefObject } from "react";
import type { View } from "react-native";

import type { Rect, ScrollableNode, TourScrollOptions } from "../types";

export const DEFAULT_SCROLL_PADDING = 24;
/** Minimum pause after dispatching a scroll, before we start watching it. */
export const DEFAULT_SETTLE_DELAY = 120;
/** Give up waiting for a scroll to settle after this long. */
export const MAX_SETTLE_WAIT = 1600;

/**
 * `FlatList` / `SectionList` refs aren't measurable themselves — the real
 * scrollable host sits one level down. Unwrap to whatever can be measured.
 */
export function measurableScrollNode(node: ScrollableNode | null): View | null {
  if (!node) return null;

  if (typeof node.getNativeScrollRef === "function") {
    const inner = node.getNativeScrollRef();
    if (inner) return inner as View;
  }

  const candidate = node as unknown as Partial<View>;
  if (
    typeof candidate.measureInWindow === "function" ||
    typeof candidate.measure === "function"
  ) {
    return node as unknown as View;
  }

  return null;
}

/**
 * How far the list has to move for `target` to sit fully inside `container`,
 * with `padding` to spare. Returns `null` when it is already comfortably
 * visible, so callers can skip scrolling (and skip the settle delay) entirely.
 */
export function computeScrollOffset({
  container,
  target,
  currentOffset,
  horizontal,
  padding = DEFAULT_SCROLL_PADDING,
}: {
  container: Rect;
  target: Rect;
  currentOffset: number;
  horizontal: boolean;
  padding?: number;
}): number | null {
  const containerStart = horizontal ? container.x : container.y;
  const containerSize = horizontal ? container.width : container.height;
  const targetStart = horizontal ? target.x : target.y;
  const targetSize = horizontal ? target.width : target.height;

  // Padding on both sides can exceed a short list; fall back to centring.
  if (targetSize + padding * 2 > containerSize) {
    const centred =
      currentOffset + (targetStart - containerStart) - (containerSize - targetSize) / 2;
    return Math.max(0, centred);
  }

  const visibleStart = containerStart + padding;
  const visibleEnd = containerStart + containerSize - padding;

  let delta = 0;
  if (targetStart < visibleStart) {
    delta = targetStart - visibleStart;
  } else if (targetStart + targetSize > visibleEnd) {
    delta = targetStart + targetSize - visibleEnd;
  } else {
    return null;
  }

  return Math.max(0, currentOffset + delta);
}

/** Dispatch a scroll through whichever API this node actually implements. */
export function scrollNodeToOffset(
  node: ScrollableNode,
  offset: number,
  horizontal: boolean,
  animated = true,
): boolean {
  if (typeof node.scrollToOffset === "function") {
    node.scrollToOffset({ offset, animated });
    return true;
  }
  if (typeof node.scrollTo === "function") {
    node.scrollTo(horizontal ? { x: offset, animated } : { y: offset, animated });
    return true;
  }
  return false;
}

export function scrollNodeToIndex(
  node: ScrollableNode,
  index: number,
  viewPosition: number,
  animated = true,
): boolean {
  if (typeof node.scrollToIndex !== "function") return false;
  node.scrollToIndex({ index, animated, viewPosition });
  return true;
}

export function scrollSettleDelay(options: TourScrollOptions): number {
  return options.settleDelay ?? DEFAULT_SETTLE_DELAY;
}

const wait = (ms: number) =>
  new Promise<void>((done) => {
    setTimeout(done, ms);
  });

/**
 * Waits for an animated scroll to actually come to rest.
 *
 * A fixed delay can't work here: scrolling one row takes a moment, scrolling
 * twenty takes much longer, and measuring mid-flight puts the spotlight on
 * empty space. Instead we watch the offset the hook records from `onScroll`
 * and return once it stops changing — falling back to `MAX_SETTLE_WAIT` so a
 * list that never reports (e.g. `scrollProps` wasn't spread) can't hang.
 */
export async function waitForScrollSettle(
  handle: TourScrollOptions["handle"],
  maxWait = MAX_SETTLE_WAIT,
): Promise<void> {
  const axis = handle.horizontal ? "x" : "y";
  const tick = 50;
  const stableTarget = 150;

  let previous = handle.offsetRef.current[axis];
  let stableFor = 0;

  for (let waited = 0; waited < maxWait; waited += tick) {
    await wait(tick);
    const current = handle.offsetRef.current[axis];

    if (Math.abs(current - previous) < 0.5) {
      stableFor += tick;
      if (stableFor >= stableTarget) return;
    } else {
      stableFor = 0;
    }
    previous = current;
  }
}

/**
 * Brings a step's target into view before it gets measured.
 *
 * Two routes: an explicit `index` goes straight through `scrollToIndex`
 * (the only option for a virtualized row that isn't mounted yet), otherwise
 * we measure the target and the list and compute the offset ourselves.
 * Either way we only pay the settle delay if we actually scrolled.
 */
export async function scrollStepIntoView(
  options: TourScrollOptions,
  targetRef: RefObject<View | null> | undefined,
): Promise<void> {
  const node = options.handle.ref.current;
  if (!node) return;

  if (options.index != null || options.handle.pagingEnabled) {
    // A paging list can't be measured and scrolled by pixel offset the way
    // a plain one can, so a bound `pagingEnabled` handle defaults to
    // `scrollToIndex(0)` even when the step itself didn't set `index` —
    // the consumer never has to know to reach for `index` instead of a
    // pixel offset just because the list happens to page.
    const index = options.index ?? 0;
    if (scrollNodeToIndex(node, index, options.viewPosition ?? 0.5)) {
      await wait(scrollSettleDelay(options));
      await waitForScrollSettle(options.handle);
    }
    return;
  }

  const target = targetRef?.current;
  const container = measurableScrollNode(node);
  if (!target || !container) return;

  const [targetRect, containerRect] = await Promise.all([
    measureInWindow(target),
    measureInWindow(container),
  ]);
  if (!targetRect || !containerRect) return;

  const horizontal = options.handle.horizontal;
  const currentOffset = horizontal
    ? options.handle.offsetRef.current.x
    : options.handle.offsetRef.current.y;

  const offset = computeScrollOffset({
    container: containerRect,
    target: targetRect,
    currentOffset,
    horizontal,
    padding: options.padding,
  });
  if (offset == null) return;

  if (scrollNodeToOffset(node, offset, horizontal)) {
    await wait(scrollSettleDelay(options));
    await waitForScrollSettle(options.handle);
  }
}

function measureInWindow(node: View): Promise<Rect | null> {
  return new Promise((resolve) => {
    if (typeof node.measureInWindow !== "function") {
      resolve(null);
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      if (width === 0 && height === 0) {
        resolve(null);
        return;
      }
      resolve({ x, y, width, height });
    });
  });
}
