import React, { useEffect, useRef } from "react";
import type { ComponentType, ForwardedRef, ReactElement } from "react";
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle,
} from "react-native";
import { StyleSheet } from "react-native";

import { useTourGuide } from "../hooks/useTourGuide";
import { useTourScroll } from "../hooks/useTourScroll";
import type {
  ScrollableNode,
  SwipeDirection,
  SwipeHintConfig,
  TourGuideConfig,
  TourStep,
} from "../types";
import { TourTarget } from "./TourTarget";

/**
 * The subset of list props `TourScrollList` cares about. `P` (the props of
 * whatever `as` resolves to) only needs to satisfy this — everything else on
 * `P` is forwarded through untouched.
 */
interface BaseListProps {
  data?: readonly unknown[] | null;
  horizontal?: boolean | null;
  pagingEnabled?: boolean | null;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  style?: StyleProp<ViewStyle>;
}

export type TourScrollListProps<P extends BaseListProps> = Omit<P, "ref"> & {
  /**
   * The list component to render — a top-level import like `FlatList` or
   * `FlashList`, kept as the *same reference* across your own re-renders.
   * `TourScrollList` renders it via `React.createElement(as, ...)`, so as
   * long as this identity stays stable, React never unmounts/remounts the
   * underlying list — which matters for `FlashList`'s recycling pool.
   * Do not pass an inline/anonymous component here.
   */
  as: ComponentType<P>;
  /** Id used both as the `TourTarget` id and this step's `targetId`. */
  id: string;
  tourId?: string;
  persist?: boolean;
  title: string;
  description: string;
  swipeHint?: SwipeDirection | SwipeHintConfig;
  /** Style for the `TourTarget` wrapper (defaults to `{ flex: 1 }`). */
  wrapperStyle?: StyleProp<ViewStyle>;
  /** Merged over the generated step — use to override any field, including `scroll`. */
  tourStep?: Partial<Omit<TourStep, "id" | "targetId">>;
  /** Merged over `{ tourId, persist }` for the `startTour` call. */
  tourConfig?: Omit<TourGuideConfig, "tourId" | "persist">;
  /**
   * Whether this list is actually the thing on screen right now. Default
   * `true`. Wire this to `useIsFocused()` (React Navigation / Expo Router)
   * for a list that lives behind a tab/drawer navigator — those keep
   * background screens mounted, so `data` can go non-empty long before the
   * user ever sees this screen. The tour starts once both `data` is
   * non-empty *and* `active` is true, re-evaluated whenever either one
   * flips — so it fires whichever arrives second: data landing while
   * already focused, or the screen gaining focus while data is already
   * there. It never starts while `active` is `false`.
   */
  active?: boolean;
};

function TourScrollListInner<P extends BaseListProps>(
  props: TourScrollListProps<P>,
  forwardedRef: ForwardedRef<ScrollableNode>,
) {
  const {
    as: Component,
    id,
    tourId,
    persist,
    title,
    description,
    swipeHint,
    wrapperStyle,
    tourStep,
    tourConfig,
    active = true,
    ...listProps
  } = props;

  const { startTour } = useTourGuide();

  const horizontal = Boolean(listProps.horizontal);
  const pagingEnabled = Boolean(listProps.pagingEnabled);
  const userOnScroll = listProps.onScroll;

  const {
    ref: scrollRef,
    scrollProps,
    handle,
    reset,
  } = useTourScroll({
    horizontal,
    pagingEnabled,
    onScroll: userOnScroll,
  });

  const setRef = (instance: ScrollableNode | null) => {
    scrollRef(instance);
    if (typeof forwardedRef === "function") {
      forwardedRef(instance);
    } else if (forwardedRef) {
      forwardedRef.current = instance;
    }
  };

  const wasReadyRef = useRef(false);

  useEffect(() => {
    const hasData = Boolean(listProps.data && listProps.data.length > 0);
    const ready = hasData && active;
    // Fires on the transition into "data present and active" from either
    // side — data arriving while already active, or `active` turning true
    // while data is already there (e.g. a background tab screen gaining
    // focus after its list already loaded). Never fires while `active` is
    // false, and never re-fires just because `data` changed identity while
    // already ready.
    const justBecameReady = ready && !wasReadyRef.current;
    wasReadyRef.current = ready;
    if (!justBecameReady) return;

    reset();
    startTour(
      [
        {
          id,
          targetId: id,
          title,
          description,
          swipeHint,
          scroll: { handle },
          ...tourStep,
        },
      ],
      { tourId, persist, ...tourConfig },
    );
    // Only the "became ready" transition should (re)start the tour —
    // re-running for every prop/handler identity change would restart it
    // on unrelated re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listProps.data, active]);

  const element = React.createElement(Component, {
    ...(listProps as unknown as P),
    ref: setRef,
    ...scrollProps,
  });

  return (
    <TourTarget id={id} style={wrapperStyle ?? styles.fill}>
      {element}
    </TourTarget>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});

/**
 * Collapses the "list tour" pattern — `TourTarget` + `useTourScroll` + a
 * `useEffect` that resets and starts the tour once data arrives — into one
 * wrapper. Swap `<FlashList ...>` for `<TourScrollList as={FlashList} ...>`
 * and pass the tour declaratively; everything else (paging detection,
 * `reset()`, filling its parent) is handled for you.
 *
 * Behind a tab/drawer navigator, wire `active` to `useIsFocused()` so the
 * tour doesn't start on a screen the user hasn't actually reached yet —
 * navigators typically keep background screens mounted, so `data` can go
 * non-empty long before the screen is visible.
 *
 * ```tsx
 * <TourScrollList
 *   as={FlashList}
 *   id="item-list"
 *   tourId="item-list-tour"
 *   persist
 *   title="Your items"
 *   description="Swipe up to see more."
 *   swipeHint="up"
 *   active={useIsFocused()}
 *   data={items}
 *   renderItem={...}
 *   pagingEnabled
 * />
 * ```
 */
export const TourScrollList = React.forwardRef(TourScrollListInner) as <
  P extends BaseListProps,
>(
  props: TourScrollListProps<P> & { ref?: ForwardedRef<ScrollableNode> },
) => ReactElement | null;
