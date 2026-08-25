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

  const hadDataRef = useRef(false);

  useEffect(() => {
    const hasData = Boolean(listProps.data && listProps.data.length > 0);
    const justArrived = hasData && !hadDataRef.current;
    hadDataRef.current = hasData;
    if (!justArrived) return;

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
    // Only the data-empty-to-non-empty transition should (re)start the
    // tour — re-running for every prop/handler identity change would
    // restart it on unrelated re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listProps.data]);

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
 * ```tsx
 * <TourScrollList
 *   as={FlashList}
 *   id="matches-list"
 *   tourId="matches-list-tour"
 *   persist
 *   title="Your matches"
 *   description="Swipe up to see more profiles."
 *   swipeHint="up"
 *   data={categoryMatches}
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
