import { useCallback, useEffect, useMemo, useRef } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import type { ScrollableNode, TourScrollHandle } from "../types";
import { scrollNodeToIndex, scrollNodeToOffset } from "../utils/scroll";

/**
 * `onScrollEndDrag` fires the instant a finger lifts; `onMomentumScrollBegin`
 * only follows it if the release still had velocity. This is how long to
 * wait for that follow-up before deciding the drag ended with no momentum —
 * long enough to never miss a real `onMomentumScrollBegin` (which follows
 * within a frame or two on both platforms), short enough that a genuinely
 * momentum-free release still reads as "done" almost immediately.
 */
const NO_MOMENTUM_GRACE_MS = 50;

/**
 * Tolerance (px) for treating the scroll offset as "at" a boundary. Native
 * scroll reports sub-pixel float offsets and bounce residue even when a
 * list is visually fully scrolled, so an exact `=== 0` / `=== max` check
 * would almost never match.
 */
const BOUNDARY_EPSILON = 2;

export interface ScrollBounds {
  /** True once the tracked axis's offset is at (or past) its minimum. */
  atStart: boolean;
  /** True once the tracked axis's offset is at (or past) its maximum. */
  atEnd: boolean;
}

export interface UseTourScrollOptions {
  /** Set for a horizontal list / carousel. Default false. */
  horizontal?: boolean;
  /**
   * Set when the bound list has `pagingEnabled` (or is otherwise a
   * carousel/paging list). A step's `scroll` then defaults to
   * `scrollToIndex` stepping — starting at index 0 unless the step sets its
   * own `index` — instead of requiring the consumer to pass `scroll: {
   * index }` themselves just to remember paging needs it. Default false.
   */
  pagingEnabled?: boolean;
  /**
   * Forwarded to the list so your own `onScroll` still runs — the hook wraps
   * it rather than replacing it.
   */
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /**
   * These four drive the hook's own gesture-session tracking (see
   * `subscribeGesture` on the returned `handle`) — spreading `scrollProps`
   * onto your list and then setting one of these four yourself, the normal
   * way to override a single prop after a spread, silently replaces the
   * hook's own handler instead of adding to it, and swipe-hint steps on
   * this list stop advancing with no error. Pass your own handler here
   * instead and it still runs, same as `onScroll` above.
   */
  onScrollBeginDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollEndDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onMomentumScrollBegin?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onMomentumScrollEnd?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

/**
 * Callback ref for a list. Must stay a function type — a `RefObject` of
 * `ScrollableNode` is invariant and will not type-check on `FlatList` or
 * `ScrollView`.
 */
export type TourScrollListRef = (instance: ScrollableNode | null) => void;

export interface UseTourScrollResult {
  /** Attach to the list's `ref`. */
  ref: TourScrollListRef;
  /** Spread onto the list so the tour can read the live scroll offset. */
  scrollProps: {
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    onScrollBeginDrag: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    onScrollEndDrag: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    onMomentumScrollBegin: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    onMomentumScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    scrollEventThrottle: number;
  };
  /** Pass to a step's `scroll.handle`. */
  handle: TourScrollHandle;
  /** Jump the list back to the start and zero the tracked offset. */
  reset: () => void;
}

/**
 * Binds a scrollable list to the tour so off-screen targets can be brought
 * into view before they're spotlighted.
 *
 * React Native gives no way to read a list's current scroll offset on demand,
 * so we track it from `onScroll` instead. 16ms throttle keeps that to one
 * ref write per frame — no re-renders, which matters on low-end Android.
 *
 * ```tsx
 * const { ref, scrollProps, handle } = useTourScroll();
 *
 * <ScrollView ref={ref} {...scrollProps} ... />
 *
 * startTour([{ ...step, scroll: { handle } }]);
 * ```
 */
export function useTourScroll(options: UseTourScrollOptions = {}): UseTourScrollResult {
  const {
    horizontal = false,
    pagingEnabled = false,
    onScroll: userOnScroll,
    onScrollBeginDrag: userOnScrollBeginDrag,
    onScrollEndDrag: userOnScrollEndDrag,
    onMomentumScrollBegin: userOnMomentumScrollBegin,
    onMomentumScrollEnd: userOnMomentumScrollEnd,
  } = options;

  const nodeRef = useRef<ScrollableNode | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const gestureListenersRef = useRef(
    new Set<(delta: { x: number; y: number }, bounds: ScrollBounds) => void>(),
  );
  const dragStartOffsetRef = useRef<{ x: number; y: number } | null>(null);
  // Conservative until the first onScroll reports real measurements: a
  // list that's never been scrolled hasn't proven it *can't* move further,
  // so a swipe attempted before then falls back to needing real movement,
  // same as always.
  const boundsRef = useRef<ScrollBounds>({ atStart: false, atEnd: false });
  const noMomentumTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userOnScrollRef = useRef(userOnScroll);
  userOnScrollRef.current = userOnScroll;
  const userOnScrollBeginDragRef = useRef(userOnScrollBeginDrag);
  userOnScrollBeginDragRef.current = userOnScrollBeginDrag;
  const userOnScrollEndDragRef = useRef(userOnScrollEndDrag);
  userOnScrollEndDragRef.current = userOnScrollEndDrag;
  const userOnMomentumScrollBeginRef = useRef(userOnMomentumScrollBegin);
  userOnMomentumScrollBeginRef.current = userOnMomentumScrollBegin;
  const userOnMomentumScrollEndRef = useRef(userOnMomentumScrollEnd);
  userOnMomentumScrollEndRef.current = userOnMomentumScrollEnd;

  const ref = useCallback<TourScrollListRef>((instance) => {
    nodeRef.current = instance;
  }, []);

  const subscribeGesture = useCallback(
    (listener: (delta: { x: number; y: number }, bounds: ScrollBounds) => void) => {
      gestureListenersRef.current.add(listener);
      return () => {
        gestureListenersRef.current.delete(listener);
      };
    },
    [],
  );

  const clearNoMomentumTimer = () => {
    if (noMomentumTimerRef.current) {
      clearTimeout(noMomentumTimerRef.current);
      noMomentumTimerRef.current = null;
    }
  };

  // Redefined each render, but only ever reads/writes through a ref, so
  // whichever render's copy React captures here still clears whatever timer
  // is actually pending at unmount time.
  useEffect(() => clearNoMomentumTimer, []);

  const emitGestureEnd = useCallback(() => {
    const start = dragStartOffsetRef.current;
    dragStartOffsetRef.current = null;
    if (!start) return;
    const end = offsetRef.current;
    const delta = { x: end.x - start.x, y: end.y - start.y };
    const bounds = boundsRef.current;
    gestureListenersRef.current.forEach((listener) => listener(delta, bounds));
  }, []);

  const scrollProps = useMemo(
    () => ({
      onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        offsetRef.current.x = contentOffset.x;
        offsetRef.current.y = contentOffset.y;
        // Tracked on whichever axis `horizontal` selects — a list can only
        // page/scroll along one axis, and that's the one a swipeHint step
        // ever cares about being pinned on. contentSize/layoutMeasurement
        // are optional here (not just in real events, which always report
        // them) so a hand-built event — e.g. calling scrollProps.onScroll
        // directly in a consumer's own test — doesn't throw; bounds just
        // stay unknown until a real event supplies them.
        if (contentSize && layoutMeasurement) {
          const offset = horizontal ? contentOffset.x : contentOffset.y;
          const extent = horizontal ? contentSize.width : contentSize.height;
          const viewport = horizontal
            ? layoutMeasurement.width
            : layoutMeasurement.height;
          const maxOffset = Math.max(0, extent - viewport);
          boundsRef.current = {
            atStart: offset <= BOUNDARY_EPSILON,
            atEnd: offset >= maxOffset - BOUNDARY_EPSILON,
          };
        }
        userOnScrollRef.current?.(event);
      },
      onScrollBeginDrag: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        clearNoMomentumTimer();
        // A re-grab while the previous swipe is still decelerating
        // interrupts its momentum without ever firing onMomentumScrollEnd
        // for it — very easy to hit with real, quick successive swipes,
        // much harder to with an artificially paced one. Close that
        // gesture out now, counting however far it actually got, before
        // starting to track this new one — otherwise a quick swipe #2
        // silently swallows swipe #1 entirely instead of counting either
        // of them right.
        if (dragStartOffsetRef.current) {
          emitGestureEnd();
        }
        dragStartOffsetRef.current = { ...offsetRef.current };
        userOnScrollBeginDragRef.current?.(event);
      },
      onScrollEndDrag: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        // If this drag has momentum, onMomentumScrollBegin preempts this
        // timer and the session isn't over yet — wait for
        // onMomentumScrollEnd instead. If nothing preempts it, this was
        // the end of the gesture.
        clearNoMomentumTimer();
        noMomentumTimerRef.current = setTimeout(() => {
          noMomentumTimerRef.current = null;
          emitGestureEnd();
        }, NO_MOMENTUM_GRACE_MS);
        userOnScrollEndDragRef.current?.(event);
      },
      onMomentumScrollBegin: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        clearNoMomentumTimer();
        userOnMomentumScrollBeginRef.current?.(event);
      },
      onMomentumScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        clearNoMomentumTimer();
        emitGestureEnd();
        userOnMomentumScrollEndRef.current?.(event);
      },
      scrollEventThrottle: 16,
    }),
    [emitGestureEnd, horizontal],
  );

  const handle = useMemo<TourScrollHandle>(
    () => ({ ref: nodeRef, offsetRef, horizontal, pagingEnabled, subscribeGesture }),
    [horizontal, pagingEnabled, subscribeGesture],
  );

  const reset = useCallback(() => {
    offsetRef.current.x = 0;
    offsetRef.current.y = 0;
    const node = nodeRef.current;
    if (!node) return;
    if (scrollNodeToIndex(node, 0, 0, false)) return;
    scrollNodeToOffset(node, 0, horizontal, false);
  }, [horizontal]);

  return {
    ref,
    scrollProps,
    handle,
    reset,
  };
}
