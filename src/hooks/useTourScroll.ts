import { useCallback, useMemo, useRef } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import type { ScrollableNode, TourScrollHandle } from "../types";
import { scrollNodeToIndex, scrollNodeToOffset } from "../utils/scroll";

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
  const { horizontal = false, pagingEnabled = false, onScroll: userOnScroll } = options;

  const nodeRef = useRef<ScrollableNode | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const listenersRef = useRef(new Set<(offset: { x: number; y: number }) => void>());

  const userOnScrollRef = useRef(userOnScroll);
  userOnScrollRef.current = userOnScroll;

  const ref = useCallback<TourScrollListRef>((instance) => {
    nodeRef.current = instance;
  }, []);

  const subscribe = useCallback(
    (listener: (offset: { x: number; y: number }) => void) => {
      listenersRef.current.add(listener);
      return () => {
        listenersRef.current.delete(listener);
      };
    },
    [],
  );

  const scrollProps = useMemo(
    () => ({
      onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { x, y } = event.nativeEvent.contentOffset;
        offsetRef.current.x = x;
        offsetRef.current.y = y;
        // Snapshot the values (not the mutable ref) so a listener that
        // reads them later can't observe a subsequent tick's numbers.
        const snapshot = { x, y };
        listenersRef.current.forEach((listener) => listener(snapshot));
        userOnScrollRef.current?.(event);
      },
      scrollEventThrottle: 16,
    }),
    [],
  );

  const handle = useMemo<TourScrollHandle>(
    () => ({ ref: nodeRef, offsetRef, horizontal, pagingEnabled, subscribe }),
    [horizontal, pagingEnabled, subscribe],
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
