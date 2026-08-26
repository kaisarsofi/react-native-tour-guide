import React, { type RefObject } from "react";
import { act, renderHook } from "@testing-library/react-native";
import type { View } from "react-native";

import { TourGuideOverlay } from "../components/TourGuideOverlay";
import { useTourGuide } from "../hooks/useTourGuide";
import { TourGuideProvider } from "../TourGuideContext";
import type { TourGuideConfig, TourScrollHandle, TourStep } from "../types";

export function measurableRef(
  x = 10,
  y = 20,
  width = 100,
  height = 50,
): RefObject<View | null> {
  return {
    current: {
      measure: (
        cb: (
          mx: number,
          my: number,
          w: number,
          h: number,
          px: number,
          py: number,
        ) => void,
      ) => cb(0, 0, width, height, x, y),
      measureInWindow: (cb: (mx: number, my: number, w: number, h: number) => void) =>
        cb(x, y, width, height),
    },
  } as RefObject<View | null>;
}

export function makeStep(over: Partial<TourStep> = {}): TourStep {
  return {
    id: "step-1",
    title: "Hello",
    description: "World",
    targetRegion: { x: 10, y: 20, width: 100, height: 50 },
    ...over,
  };
}

/**
 * A `TourScrollHandle` whose `subscribeGesture` is a real, test-driven
 * event emitter — `emitGesture` pushes a completed-gesture delta (and
 * optional boundary state, defaulting to "not at either end") to every
 * subscriber exactly like a `useTourScroll`-wrapped drag(+momentum)
 * session settling would, so a passive swipe-hint test can simulate "the
 * user swiped the real list" without a real native list or real touch
 * timing.
 */
export function makeSubscribableHandle(
  over: Partial<TourScrollHandle> = {},
): TourScrollHandle & {
  emitGesture: (
    delta: { x: number; y: number },
    bounds?: { atStart: boolean; atEnd: boolean },
  ) => void;
} {
  const listeners = new Set<
    (
      delta: { x: number; y: number },
      bounds: { atStart: boolean; atEnd: boolean },
    ) => void
  >();
  const offsetRef = { current: { x: 0, y: 0 } };
  return {
    ref: { current: { scrollToIndex: jest.fn(), scrollTo: jest.fn() } },
    offsetRef,
    horizontal: false,
    pagingEnabled: true,
    subscribeGesture: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emitGesture(delta, bounds = { atStart: false, atEnd: false }) {
      listeners.forEach((listener) => listener(delta, bounds));
    },
    ...over,
  };
}

export function makeSteps(count: number): TourStep[] {
  return Array.from({ length: count }, (_, index) =>
    makeStep({
      id: `s${index + 1}`,
      title: `Title ${index + 1}`,
      description: `Description ${index + 1}`,
    }),
  );
}

export function renderTour() {
  const hook = renderHook(() => useTourGuide(), {
    wrapper: ({ children }) => (
      <TourGuideProvider>
        {children}
        <TourGuideOverlay />
      </TourGuideProvider>
    ),
  });

  return {
    ...hook,
    get api() {
      return hook.result.current;
    },
    async start(steps: TourStep[], config?: TourGuideConfig) {
      await act(async () => {
        hook.result.current.startTour(steps, config);
      });
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
    },
    async flush(ms = 0) {
      await act(async () => {
        jest.advanceTimersByTime(ms);
        await Promise.resolve();
      });
    },
  };
}
