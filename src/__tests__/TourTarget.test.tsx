import React from "react";
import { Text } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { TourGuideOverlay } from "../components/TourGuideOverlay";
import { TourTarget } from "../components/TourTarget";
import { useTourGuide } from "../hooks/useTourGuide";
import { TourGuideProvider } from "../TourGuideContext";
import type { TourStep } from "../types";
import { makeStep } from "./helpers";

type UseTourGuideResult = ReturnType<typeof useTourGuide>;

describe("TourTarget", () => {
  it("renders children inside the registered wrapper", () => {
    render(
      <TourGuideProvider>
        <TourTarget id="compose">
          <Text>Compose</Text>
        </TourTarget>
      </TourGuideProvider>,
    );

    expect(screen.getByText("Compose")).toBeTruthy();
  });
});

/**
 * Mounts a `<TourTarget>` and the overlay inside the *same* provider as the
 * `useTourGuide()` call driving the tour — a separate `render`/`renderHook`
 * pair would each get their own `TourGuideProvider` instance and never
 * share state. `start` drains the async measure chain the same way
 * `renderTour().start` does in the overlay tests, rather than pinning an
 * exact tick count.
 */
function renderWithTarget(targetId: string, onTouchEnd?: (event: unknown) => void) {
  let api: UseTourGuideResult | undefined;

  function Harness() {
    api = useTourGuide();
    return (
      <>
        <TourTarget id={targetId} testID={targetId} onTouchEnd={onTouchEnd}>
          <Text>{targetId}</Text>
        </TourTarget>
        <TourGuideOverlay />
      </>
    );
  }

  render(
    <TourGuideProvider>
      <Harness />
    </TourGuideProvider>,
  );

  return {
    async start(steps: TourStep[]) {
      await act(async () => {
        api!.startTour(steps);
      });
      // Drains the measure chain under fake timers (the ref's `measure()`
      // never calls back in this environment, so it otherwise falls through
      // to the real settle-polling and give-up timeouts and leaves them
      // pending past the end of the test) — same approach as
      // `crossScreen.test.tsx`'s `drain()`.
      await act(async () => {
        for (let tick = 0; tick < 20; tick += 1) {
          jest.advanceTimersByTime(50);
          await Promise.resolve();
        }
      });
    },
  };
}

// The overlay marks its host `accessibilityViewIsModal`, which hides every
// sibling — including the real `<TourTarget>` the tour points at — from the
// accessibility tree RNTL queries by default. That's the same thing a real
// screen reader does; it has no bearing on plain touch delivery, so tests
// reach past it with `includeHiddenElements`.
function getTarget(testId: string) {
  return screen.getByTestId(testId, { includeHiddenElements: true });
}

function tap(element: ReturnType<typeof getTarget>, x = 10, y = 10) {
  fireEvent(element, "touchStart", { nativeEvent: { pageX: x, pageY: y } });
  fireEvent(element, "touchEnd", { nativeEvent: { pageX: x, pageY: y } });
}

describe("TourTarget passThroughTouches self-advance", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("fires onSpotlightPress for a tap on the current pass-through target", async () => {
    const onSpotlightPress = jest.fn();
    const tour = renderWithTarget("settings-button");

    await tour.start([
      makeStep({
        targetRegion: undefined,
        targetId: "settings-button",
        passThroughTouches: true,
        onSpotlightPress,
      }),
    ]);

    tap(getTarget("settings-button"));

    expect(onSpotlightPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire for a drag that moves past the tap slop", async () => {
    const onSpotlightPress = jest.fn();
    const tour = renderWithTarget("settings-button");

    await tour.start([
      makeStep({
        targetRegion: undefined,
        targetId: "settings-button",
        passThroughTouches: true,
        onSpotlightPress,
      }),
    ]);

    const target = getTarget("settings-button");
    fireEvent(target, "touchStart", { nativeEvent: { pageX: 0, pageY: 0 } });
    fireEvent(target, "touchEnd", { nativeEvent: { pageX: 60, pageY: 0 } });

    expect(onSpotlightPress).not.toHaveBeenCalled();
  });

  it("does not fire when the target isn't the current step's target", async () => {
    const onSpotlightPress = jest.fn();
    const tour = renderWithTarget("other-button");

    await tour.start([
      makeStep({
        targetRegion: undefined,
        targetId: "settings-button",
        passThroughTouches: true,
        onSpotlightPress,
      }),
    ]);

    tap(getTarget("other-button"));

    expect(onSpotlightPress).not.toHaveBeenCalled();
  });

  it("does not fire when passThroughTouches is off", async () => {
    const onSpotlightPress = jest.fn();
    const tour = renderWithTarget("settings-button");

    await tour.start([
      makeStep({
        targetRegion: undefined,
        targetId: "settings-button",
        onSpotlightPress,
      }),
    ]);

    tap(getTarget("settings-button"));

    expect(onSpotlightPress).not.toHaveBeenCalled();
  });

  it("still calls a caller's own onTouchEnd on the target", async () => {
    const onSpotlightPress = jest.fn();
    const onTouchEnd = jest.fn();
    const tour = renderWithTarget("settings-button", onTouchEnd);

    await tour.start([
      makeStep({
        targetRegion: undefined,
        targetId: "settings-button",
        passThroughTouches: true,
        onSpotlightPress,
      }),
    ]);

    tap(getTarget("settings-button"));

    expect(onSpotlightPress).toHaveBeenCalledTimes(1);
    expect(onTouchEnd).toHaveBeenCalledTimes(1);
  });
});
