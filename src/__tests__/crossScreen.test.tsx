import React from "react";
import { act, renderHook } from "@testing-library/react-native";

import { TourGuideOverlay } from "../components/TourGuideOverlay";
import { useTourGuide } from "../hooks/useTourGuide";
import { TourGuideProvider, useTourGuideContext } from "../TourGuideContext";
import { measurableRef, makeStep } from "./helpers";

// Drains the async measure chain (`before`, scroll, `nextPaint`'s two
// animation frames, `measureView`). `measureView` measures the overlay host
// too, and that host is a plain test-rendered `View` with no real native
// layout behind it, so that inner `measure()` call never calls back and
// falls through `measureView`'s own 500ms give-up timeout — advancing fake
// timers in small steps (with a microtask flush between each, so the
// promise chain that timer unblocks actually gets to run) clears both that
// and the two `nextPaint` animation frames well inside the loop below.
async function drain() {
  await act(async () => {
    for (let tick = 0; tick < 20; tick += 1) {
      jest.advanceTimersByTime(50);
      await Promise.resolve();
    }
  });
}

function useHarness() {
  const guide = useTourGuide();
  const { state, registerTarget } = useTourGuideContext();
  return { ...guide, targetRect: state.targetRect, registerTarget };
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TourGuideProvider>
    {children}
    <TourGuideOverlay />
  </TourGuideProvider>
);

describe("cross-screen tours", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("waits for a step's target to register, then measures it once it does", async () => {
    const { result } = renderHook(() => useHarness(), { wrapper });

    const onScreenA = makeStep({
      id: "a",
      targetRegion: undefined,
      targetId: "screen-a-button",
    });
    const onScreenB = makeStep({
      id: "b",
      targetRegion: undefined,
      targetId: "screen-b-button",
    });

    act(() => {
      result.current.registerTarget("screen-a-button", measurableRef(0, 0, 50, 50));
    });
    act(() => {
      result.current.startTour([onScreenA, onScreenB]);
    });
    await drain();

    expect(result.current.targetRect).toEqual({ x: 0, y: 0, width: 50, height: 50 });

    // Advance to the step whose target lives on a screen that hasn't
    // navigated to (and so hasn't mounted its `<TourTarget>`) yet.
    act(() => {
      result.current.nextStep();
    });
    await drain();

    expect(result.current.isActive).toBe(true);
    expect(result.current.currentStep?.id).toBe("b");
    expect(result.current.targetRect).toBeNull();

    // The navigation lands and the destination screen's `<TourTarget>`
    // mounts, registering the id the current step has been waiting on.
    act(() => {
      result.current.registerTarget("screen-b-button", measurableRef(5, 15, 80, 40));
    });
    await drain();

    expect(result.current.targetRect).toEqual({ x: 5, y: 15, width: 80, height: 40 });
  });

  it("ignores a late registration for a target the tour has already moved past", async () => {
    const { result } = renderHook(() => useHarness(), { wrapper });

    const stepA = makeStep({ id: "a", targetRegion: undefined, targetId: "a-target" });
    const stepB = makeStep({ id: "b", targetRegion: undefined, targetId: "b-target" });
    const stepC = makeStep({ id: "c", targetRegion: undefined, targetId: "c-target" });

    act(() => {
      result.current.registerTarget("a-target", measurableRef(0, 0, 10, 10));
    });
    act(() => {
      result.current.startTour([stepA, stepB, stepC]);
    });
    await drain();

    // Step B's target never shows up...
    act(() => {
      result.current.nextStep();
    });
    await drain();
    expect(result.current.targetRect).toBeNull();

    // ...the tour moves on to step C before it does...
    act(() => {
      result.current.registerTarget("c-target", measurableRef(1, 1, 20, 20));
      result.current.nextStep();
    });
    await drain();
    expect(result.current.currentStep?.id).toBe("c");
    expect(result.current.targetRect).toEqual({ x: 1, y: 1, width: 20, height: 20 });

    // ...and only afterwards does something register "b-target". It must
    // not retroactively overwrite step C's already-correct rect.
    act(() => {
      result.current.registerTarget("b-target", measurableRef(9, 9, 90, 90));
    });
    await drain();

    expect(result.current.currentStep?.id).toBe("c");
    expect(result.current.targetRect).toEqual({ x: 1, y: 1, width: 20, height: 20 });
  });

  it("clears the previous target's rect immediately when moving to a waiting step", async () => {
    const { result } = renderHook(() => useHarness(), { wrapper });

    const stepA = makeStep({ id: "a", targetRegion: undefined, targetId: "a-target" });
    const stepB = makeStep({ id: "b", targetRegion: undefined, targetId: "b-target" });

    act(() => {
      result.current.registerTarget("a-target", measurableRef(0, 0, 50, 50));
    });
    act(() => {
      result.current.startTour([stepA, stepB]);
    });
    await drain();
    expect(result.current.targetRect).not.toBeNull();

    act(() => {
      result.current.nextStep();
    });

    // Synchronously reset — the overlay should never draw the old screen's
    // spotlight over the new one while the navigation is still in flight.
    expect(result.current.targetRect).toBeNull();
  });

  it("still resolves a step whose target was already registered before the tour reaches it", async () => {
    // Baseline: registering ahead of time (the common, same-screen case)
    // must keep working unchanged.
    const { result } = renderHook(() => useHarness(), { wrapper });
    const step = makeStep({ id: "a", targetRegion: undefined, targetId: "eager" });

    act(() => {
      result.current.registerTarget("eager", measurableRef(2, 4, 30, 30));
    });
    act(() => {
      result.current.startTour([step]);
    });
    await drain();

    expect(result.current.targetRect).toEqual({ x: 2, y: 4, width: 30, height: 30 });
  });

  it("waits out the step's delayBefore before measuring a target that mounts late", async () => {
    // A target that mounts *because of* the navigation (a screen transition,
    // a drawer opening) is often still mid-animation the instant it
    // registers. `delayBefore` is how a step already tells the normal path
    // to wait for that; a late-registering target must get the same wait
    // before its one shot at measuring, or it can permanently capture a
    // mid-transition rect instead of the settled one.
    const { result } = renderHook(() => useHarness(), { wrapper });
    const step = makeStep({
      id: "a",
      targetRegion: undefined,
      targetId: "drawer-item",
      delayBefore: 300,
    });

    act(() => {
      result.current.startTour([step]);
    });
    await drain();
    expect(result.current.targetRect).toBeNull();

    // Registers mid-"animation" — measuring immediately would capture
    // whatever's true right now, not the settled position.
    act(() => {
      result.current.registerTarget("drawer-item", measurableRef(9, 9, 40, 40));
    });

    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });
    expect(result.current.targetRect).toBeNull();

    await drain();
    expect(result.current.targetRect).toEqual({ x: 9, y: 9, width: 40, height: 40 });
  });
});
