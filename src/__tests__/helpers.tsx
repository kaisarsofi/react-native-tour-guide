import React, { type RefObject } from "react";
import { act, renderHook } from "@testing-library/react-native";
import type { View } from "react-native";

import { TourGuideOverlay } from "../components/TourGuideOverlay";
import { useTourGuide } from "../hooks/useTourGuide";
import { TourGuideProvider } from "../TourGuideContext";
import type { TourGuideConfig, TourStep } from "../types";

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
