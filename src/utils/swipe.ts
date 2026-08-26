import type { SwipeDirection, TourScrollHandle, TourStep } from "../types";
import { scrollNodeToIndex, scrollNodeToOffset } from "./scroll";

/** Distance (px) a finger has to travel before it counts as a swipe. */
export const SWIPE_THRESHOLD = 48;

/** Counted swipes before a `swipeHint` step moves on. Overridden by `swipeCount`. */
export const DEFAULT_SWIPE_COUNT = 3;

const NEXT_SIGN: Record<SwipeDirection, number> = {
  up: -1,
  down: 1,
  left: -1,
  right: 1,
};

/**
 * A swipe-hint step is a gesture demo, not a coach-mark. Hide the tooltip
 * (and its Next/Back row) unless the caller opted back in with
 * `hideTooltip: false`.
 */
export function isTooltipHidden(step: TourStep): boolean {
  if (step.hideTooltip === true) return true;
  if (step.hideTooltip === false) return false;
  return step.swipeHint != null;
}

export function isSwipeAdvanceEnabled(step: TourStep): boolean {
  if (!step.swipeHint) return false;
  return step.advanceOnSwipe !== false;
}

export function resolveSwipeCount(step: TourStep, configCount?: number): number {
  if (!step.swipeHint) return 1;
  const raw = step.swipeCount ?? configCount ?? DEFAULT_SWIPE_COUNT;
  if (!Number.isFinite(raw) || raw < 1) return DEFAULT_SWIPE_COUNT;
  return Math.floor(raw);
}

export type CountedSwipeAction = "scroll" | "complete" | "rewind" | "idle";

/**
 * Count a swipe against `swipeCount` without leaving the step until the
 * last one. Prev on the first page is a no-op (`idle`) so we don't end
 * the tour by accident.
 */
export function resolveCountedSwipe(
  progress: number,
  max: number,
  gesture: "next" | "prev" | null,
  canRewindStep: boolean,
): { progress: number; action: CountedSwipeAction } {
  if (gesture === "next") {
    const next = progress + 1;
    if (next >= max) return { progress, action: "complete" };
    return { progress: next, action: "scroll" };
  }
  if (gesture === "prev") {
    if (progress > 0) return { progress: progress - 1, action: "scroll" };
    if (canRewindStep) return { progress: 0, action: "rewind" };
    return { progress: 0, action: "idle" };
  }
  return { progress, action: "scroll" };
}

/** Same spotlight hole — keep it up when paging through a list. */
export function isSameTourTarget(a: TourStep, b: TourStep): boolean {
  if (a.targetId && a.targetId === b.targetId) return true;
  if (a.targetRef && a.targetRef === b.targetRef) return true;
  return false;
}

/**
 * Map a pan delta onto next / prev relative to the hinted direction.
 * A left hint treats a leftward swipe as next and a rightward one as prev.
 * Returns `null` when the gesture is too short or mostly perpendicular.
 */
export function resolveSwipeGesture(
  direction: SwipeDirection,
  dx: number,
  dy: number,
  threshold = SWIPE_THRESHOLD,
): "next" | "prev" | null {
  const vertical = direction === "up" || direction === "down";
  const primary = vertical ? dy : dx;
  const cross = vertical ? dx : dy;
  if (Math.abs(primary) < threshold) return null;
  if (Math.abs(cross) > Math.abs(primary)) return null;
  return Math.sign(primary) === NEXT_SIGN[direction] ? "next" : "prev";
}

function firstScrollOptions(step: TourStep | undefined) {
  if (!step?.scroll) return null;
  return Array.isArray(step.scroll) ? (step.scroll[0] ?? null) : step.scroll;
}

function handleFromStep(step: TourStep | undefined): TourScrollHandle | null {
  return firstScrollOptions(step)?.handle ?? null;
}

/**
 * Prefer the current step's list, then a later step's, then an earlier one.
 * Gesture steps often spotlight the list first and only attach `scroll` on
 * the row that needs to be brought on-screen.
 */
export function resolveTourScrollHandle(
  steps: TourStep[],
  index: number,
): TourScrollHandle | null {
  const current = handleFromStep(steps[index]);
  if (current) return current;
  for (let i = index + 1; i < steps.length; i += 1) {
    const handle = handleFromStep(steps[i]);
    if (handle) return handle;
  }
  for (let i = index - 1; i >= 0; i -= 1) {
    const handle = handleFromStep(steps[i]);
    if (handle) return handle;
  }
  return null;
}

function applyOffset(handle: TourScrollHandle, offset: number): void {
  if (handle.horizontal) {
    handle.offsetRef.current.x = offset;
  } else {
    handle.offsetRef.current.y = offset;
  }
}

/**
 * Drag the bound list with the finger. `origin` is the offset at gesture
 * start so repeated move events don't compound. Swiping up/left increases
 * the offset (content moves the same way a native list would).
 */
export function dragScrollHandle(
  handle: TourScrollHandle,
  origin: { x: number; y: number },
  dx: number,
  dy: number,
): void {
  const node = handle.ref.current;
  if (!node) return;
  const offset = Math.max(0, handle.horizontal ? origin.x - dx : origin.y - dy);
  if (scrollNodeToOffset(node, offset, handle.horizontal, false)) {
    applyOffset(handle, offset);
  }
}

/**
 * Coalesce pan-move scrolls to one native scroll per frame. Low-end Android
 * drops frames if we `scrollTo` on every JS touch event.
 */
export function createDragFrameScheduler(apply: (dx: number, dy: number) => void): {
  move: (dx: number, dy: number) => void;
  flush: () => void;
  cancel: () => void;
} {
  let frame = 0;
  let dx = 0;
  let dy = 0;

  const run = () => {
    frame = 0;
    apply(dx, dy);
  };

  return {
    move(nextDx: number, nextDy: number) {
      dx = nextDx;
      dy = nextDy;
      if (frame) return;
      frame = requestAnimationFrame(run);
    },
    flush() {
      if (!frame) return;
      cancelAnimationFrame(frame);
      run();
    },
    cancel() {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    },
  };
}

/**
 * Settle the list at a counted-swipe position. Paging steps use
 * `scroll.index + progress`; others use `origin + progress * pageSize`.
 */
export function snapScrollToProgress(
  step: TourStep | undefined,
  progress: number,
  origin: { x: number; y: number },
): void {
  const options = firstScrollOptions(step);
  if (!options) return;
  const node = options.handle.ref.current;
  if (!node) return;

  if (options.index != null) {
    scrollNodeToIndex(node, options.index + progress, options.viewPosition ?? 0);
    return;
  }

  const page = options.pageSize;
  if (page == null || page <= 0) return;
  const offset = Math.max(
    0,
    (options.handle.horizontal ? origin.x : origin.y) + progress * page,
  );
  if (scrollNodeToOffset(node, offset, options.handle.horizontal, true)) {
    applyOffset(options.handle, offset);
  }
}

/**
 * `up`/`left` count a swipe as the list's own offset *increasing* — the
 * same direction `dragScrollHandle` moves the offset for those hints.
 * `down`/`right` are the mirror image. Kept separate from `NEXT_SIGN`
 * above: that one reads a raw touch delta (dx/dy), this one reads a
 * *scroll offset* delta, and the two point opposite ways for the same
 * hinted direction (swiping up scrolls content up, i.e. offset increases,
 * while the finger itself moves with negative dy).
 */
const OFFSET_NEXT_SIGN: Record<SwipeDirection, number> = {
  up: 1,
  left: 1,
  down: -1,
  right: -1,
};

/**
 * The scroll-offset counterpart to `resolveSwipeGesture`: instead of a
 * captured touch's dx/dy, this reads the net *scroll offset* delta over a
 * completed drag(+momentum) gesture session. Used when the swipe-hint's
 * target is already natively scrollable, so counting swipes never needs to
 * capture a single touch — the list is left to scroll exactly as if no
 * tour were running, and the tour just counts how far one gesture actually
 * carried it, the same threshold-gated way `resolveSwipeGesture` does for
 * a captured touch.
 */
export function resolveScrollGesture(
  direction: SwipeDirection,
  dx: number,
  dy: number,
  threshold = SWIPE_THRESHOLD,
): "next" | "prev" | null {
  const vertical = direction === "up" || direction === "down";
  const primary = vertical ? dy : dx;
  const cross = vertical ? dx : dy;
  if (Math.abs(primary) < threshold) return null;
  if (Math.abs(cross) > Math.abs(primary)) return null;
  return Math.sign(primary) === OFFSET_NEXT_SIGN[direction] ? "next" : "prev";
}

/**
 * The fallback for a swipe attempted where the list has no room left to
 * produce a measurable delta at all — a short list can run out of
 * scrollable content before a `swipeCount` step's target number of swipes,
 * and without this, every further attempt reads as "nothing happened" via
 * `resolveScrollGesture` forever, since the offset genuinely can't move.
 * Counts it as a completed "next" swipe if the list is already pinned at
 * whichever end this hint's "next" direction scrolls toward — the user
 * tried to advance and the list has nothing left to give, which reads the
 * same as having succeeded, not as nothing happening.
 */
export function resolveBoundaryGesture(
  direction: SwipeDirection,
  bounds: { atStart: boolean; atEnd: boolean },
): "next" | null {
  const nextIsIncreasing = OFFSET_NEXT_SIGN[direction] === 1;
  if (nextIsIncreasing ? bounds.atEnd : bounds.atStart) return "next";
  return null;
}
