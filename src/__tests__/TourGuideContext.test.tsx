import React from "react";
import { act, renderHook } from "@testing-library/react-native";

import { useTourGuide } from "../hooks/useTourGuide";
import { TourGuideProvider } from "../TourGuideContext";
import type { TourStep } from "../types";
import { makeStep } from "./helpers";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TourGuideProvider>{children}</TourGuideProvider>
);

const steps = (count: number): TourStep[] =>
  Array.from({ length: count }, (_, index) =>
    makeStep({
      id: `s${index + 1}`,
      title: `Title ${index + 1}`,
      description: `Description ${index + 1}`,
    }),
  );

async function start(
  result: { current: ReturnType<typeof useTourGuide> },
  tourSteps: TourStep[],
  config?: Parameters<ReturnType<typeof useTourGuide>["startTour"]>[1],
) {
  await act(async () => {
    result.current.startTour(tourSteps, config);
  });
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("TourGuideProvider and useTourGuide", () => {
  it("throws when the hook is used outside a provider", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useTourGuide())).toThrow(
      "useTourGuide must be used within a <TourGuideProvider>.",
    );

    errorSpy.mockRestore();
  });

  it("starts a tour on the first active step", async () => {
    const { result } = renderHook(() => useTourGuide(), { wrapper });

    await start(result, steps(2));

    expect(result.current.isActive).toBe(true);
    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.totalSteps).toBe(2);
    expect(result.current.currentStep?.id).toBe("s1");
    expect(result.current.tourId).toBeUndefined();
  });

  it("exposes the active tourId from startTour config", async () => {
    const { result } = renderHook(() => useTourGuide(), { wrapper });

    await start(result, steps(1), { tourId: "events" });

    expect(result.current.isActive).toBe(true);
    expect(result.current.tourId).toBe("events");
  });

  it("filters out inactive steps", async () => {
    const { result } = renderHook(() => useTourGuide(), { wrapper });

    await start(result, [
      makeStep({ id: "a", title: "A", active: false }),
      makeStep({ id: "b", title: "B" }),
      makeStep({ id: "c", title: "C", active: false }),
    ]);

    expect(result.current.totalSteps).toBe(1);
    expect(result.current.currentStep?.id).toBe("b");
  });

  it("advances, goes back, and ends after the last step", async () => {
    const onTourEnd = jest.fn();
    const { result } = renderHook(() => useTourGuide(), { wrapper });

    await start(result, steps(2), { onTourEnd });

    act(() => {
      result.current.nextStep();
    });
    expect(result.current.currentStepIndex).toBe(1);

    act(() => {
      result.current.prevStep();
    });
    expect(result.current.currentStepIndex).toBe(0);

    act(() => {
      result.current.goToStep(1);
    });
    act(() => {
      result.current.nextStep();
    });

    expect(result.current.isActive).toBe(false);
    expect(onTourEnd).toHaveBeenCalledWith(true);
  });

  it("emits skip and ends as incomplete", async () => {
    const onSkip = jest.fn();
    const onEnd = jest.fn();
    const { result } = renderHook(() => useTourGuide(), { wrapper });

    await start(result, [makeStep({ onSkip })]);

    const unsubscribe = result.current.events.on("skip", onEnd);
    act(() => {
      result.current.skipTour();
    });

    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledWith({ atStep: 0 });
    expect(result.current.isActive).toBe(false);
    unsubscribe();
  });

  it("pauses and resumes the tour", async () => {
    const { result } = renderHook(() => useTourGuide(), { wrapper });

    await start(result, steps(1));
    act(() => {
      result.current.pauseTour();
    });
    expect(result.current.isPaused).toBe(true);

    act(() => {
      result.current.resumeTour();
    });
    expect(result.current.isPaused).toBe(false);
  });

  it("keeps nextStep/prevStep/goToStep/skipTour/endTour referentially stable across steps", async () => {
    const { result } = renderHook(() => useTourGuide(), { wrapper });

    const before = {
      nextStep: result.current.nextStep,
      prevStep: result.current.prevStep,
      goToStep: result.current.goToStep,
      skipTour: result.current.skipTour,
      endTour: result.current.endTour,
    };

    await start(result, steps(3));
    act(() => {
      result.current.nextStep();
    });

    expect(result.current.nextStep).toBe(before.nextStep);
    expect(result.current.prevStep).toBe(before.prevStep);
    expect(result.current.goToStep).toBe(before.goToStep);
    expect(result.current.skipTour).toBe(before.skipTour);
    expect(result.current.endTour).toBe(before.endTour);
  });

  it("advances through every step when a single stale nextStep reference is reused, as a step's own onSpotlightPress-style callback would", async () => {
    // Regression test: a step callback captured once (e.g. from useTourGuide()
    // in the calling component, embedded into a TourStep and invoked later
    // from the overlay) used to close over that render's `currentIndex`.
    // Reusing the same captured `nextStep` for a second transition redid the
    // first transition instead of advancing, leaving the tour stuck.
    const { result } = renderHook(() => useTourGuide(), { wrapper });

    await start(result, steps(3));
    const staleNextStep = result.current.nextStep;

    act(() => {
      staleNextStep();
    });
    expect(result.current.currentStepIndex).toBe(1);
    expect(result.current.currentStep?.id).toBe("s2");

    act(() => {
      staleNextStep();
    });
    expect(result.current.currentStepIndex).toBe(2);
    expect(result.current.currentStep?.id).toBe("s3");

    act(() => {
      staleNextStep();
    });
    expect(result.current.isActive).toBe(false);
  });

  it("emits start and stepChange events", async () => {
    const onStart = jest.fn();
    const onStepChange = jest.fn();
    const { result } = renderHook(() => useTourGuide(), { wrapper });

    result.current.events.on("start", onStart);
    result.current.events.on("stepChange", onStepChange);

    await start(result, steps(2));
    act(() => {
      result.current.nextStep();
    });

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStepChange).toHaveBeenCalledWith({ from: 0, to: 1 });
  });
});
