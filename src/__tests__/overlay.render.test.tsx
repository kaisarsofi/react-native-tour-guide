import React from "react";
import { StyleSheet, Text } from "react-native";
import { act, fireEvent, screen } from "@testing-library/react-native";

import type { TooltipProps } from "../types";
import { makeStep, makeSubscribableHandle, measurableRef, renderTour } from "./helpers";

describe("TourGuideOverlay rendering", () => {
  it("shows the tooltip for a targetRegion", async () => {
    const tour = renderTour();
    await tour.start([makeStep()]);

    expect(screen.getByText("Hello")).toBeTruthy();
    expect(screen.getByText("World")).toBeTruthy();
    expect(screen.getByText("1 of 1")).toBeTruthy();
  });

  it("shows the tooltip after measuring a targetRef", async () => {
    const tour = renderTour();
    await tour.start([
      makeStep({
        targetRegion: undefined,
        targetRef: measurableRef(),
      }),
    ]);

    expect(await screen.findByText("Hello")).toBeTruthy();
  });

  it("shows a step counter and advances to the next title", async () => {
    const tour = renderTour();
    await tour.start([
      makeStep({ id: "a", title: "First" }),
      makeStep({ id: "b", title: "Second" }),
    ]);

    expect(screen.getByText("1 of 2")).toBeTruthy();
    fireEvent.press(screen.getByText("Next"));

    expect(await screen.findByText("Second")).toBeTruthy();
    expect(screen.getByText("2 of 2")).toBeTruthy();
  });

  it("uses a custom renderTooltip when provided on the config", async () => {
    const tour = renderTour();
    await tour.start([makeStep()], {
      renderTooltip: ({ step }: TooltipProps) => <Text>{`custom:${step.title}`}</Text>,
    });

    expect(screen.getByText("custom:Hello")).toBeTruthy();
  });

  it("uses a per-step renderTooltip over the config tooltip", async () => {
    const tour = renderTour();
    await tour.start(
      [
        makeStep({
          renderTooltip: ({ step }: TooltipProps) => (
            <Text>{`step:${step.title}`}</Text>
          ),
        }),
      ],
      {
        renderTooltip: ({ step }: TooltipProps) => (
          <Text>{`config:${step.title}`}</Text>
        ),
      },
    );

    expect(screen.getByText("step:Hello")).toBeTruthy();
  });

  it("renders nothing when no tour is active", () => {
    renderTour();
    expect(screen.queryByText("Hello")).toBeNull();
  });

  it("does nothing on backdrop tap by default", async () => {
    const tour = renderTour();
    await tour.start([makeStep(), makeStep({ id: "b", title: "Second" })]);

    fireEvent.press(screen.getByTestId("tour-guide-backdrop"));

    // Still on step one, tooltip still showing — the backdrop tap was a no-op.
    expect(screen.getByText("Hello")).toBeTruthy();
    expect(screen.getByText("1 of 2")).toBeTruthy();
  });

  it("advances on backdrop tap when defaultBackdropBehavior is next", async () => {
    const tour = renderTour();
    await tour.start(
      [makeStep({ id: "a", title: "First" }), makeStep({ id: "b", title: "Second" })],
      { defaultBackdropBehavior: "next" },
    );

    fireEvent.press(screen.getByTestId("tour-guide-backdrop"));

    expect(await screen.findByText("Second")).toBeTruthy();
  });

  it("ends the tour on backdrop tap when defaultBackdropBehavior is dismiss", async () => {
    const tour = renderTour();
    await tour.start([makeStep()], { defaultBackdropBehavior: "dismiss" });

    fireEvent.press(screen.getByTestId("tour-guide-backdrop"));

    expect(tour.api.isActive).toBe(false);
  });

  it("ends the tour when Skip is pressed", async () => {
    const tour = renderTour();
    await tour.start([makeStep(), makeStep({ id: "b", title: "Second" })]);

    fireEvent.press(screen.getByText("Skip"));

    expect(tour.api.isActive).toBe(false);
  });

  it("hides the tooltip on a swipe-hint step and keeps a Skip control", async () => {
    await renderTour().start([
      makeStep({
        swipeHint: "left",
        title: "Browse categories",
        description: "Swipe sideways.",
      }),
    ]);

    expect(screen.queryByText("Browse categories")).toBeNull();
    expect(screen.queryByText("Next")).toBeNull();
    expect(screen.getByTestId("tour-guide-skip")).toBeTruthy();
  });

  it("keeps the tooltip when hideTooltip is false on a swipe-hint step", async () => {
    await renderTour().start([
      makeStep({
        swipeHint: "up",
        hideTooltip: false,
        title: "Keep me",
      }),
    ]);

    expect(screen.getByText("Keep me")).toBeTruthy();
    expect(screen.getByText("Done")).toBeTruthy();
  });

  it("ends a gesture tour from the overlay Skip control", async () => {
    const tour = renderTour();
    await tour.start([makeStep({ swipeHint: "up" })]);

    fireEvent.press(screen.getByTestId("tour-guide-skip"));

    expect(tour.api.isActive).toBe(false);
  });

  it("counts swipes from a bound scroll handle's own completed gestures instead of capturing touches", async () => {
    const handle = makeSubscribableHandle();
    await renderTour().start([makeStep({ swipeHint: "up", scroll: { handle } })]);

    const backdrop = screen.getByTestId("tour-guide-backdrop");
    // Nothing here should be able to receive a touch: no PanResponder
    // handlers were attached, so nothing but pointerEvents="none" is doing
    // the work of leaving the real list untouched.
    expect(backdrop.props.pointerEvents).toBe("none");
    expect(backdrop.props.onStartShouldSetResponder).toBeUndefined();
    expect(backdrop.props.onMoveShouldSetResponder).toBeUndefined();

    act(() => handle.emitGesture({ x: 0, y: 96 }));
    act(() => handle.emitGesture({ x: 0, y: 96 }));
    // Still on the (only) step — two swipes counted, one to go.
    expect(screen.queryByTestId("tour-guide-backdrop")).toBeTruthy();

    act(() => handle.emitGesture({ x: 0, y: 96 }));
    // Third swipe on a single-step tour ends it — exactly like a captured
    // gesture would, just derived from the list's own real movement.
    expect(screen.queryByTestId("tour-guide-backdrop")).toBeNull();
  });

  it("counts one swipe no matter how far a single gesture actually scrolled the list", async () => {
    // This is what over-counted under the old offset-crossing design: a
    // single long native scroll (a fast fling, or a non-paging list with a
    // small virtual `scroll.pageSize`) must still land as exactly one
    // swipe, since it came from exactly one physical gesture.
    const handle = makeSubscribableHandle({ pagingEnabled: false });
    await renderTour().start([
      makeStep({ swipeHint: "up", scroll: { handle, pageSize: 50 } }),
    ]);

    act(() => handle.emitGesture({ x: 0, y: 650 }));
    // One swipe counted (of three), not thirteen (650 / 50) — still on the
    // (only) step.
    expect(screen.queryByTestId("tour-guide-backdrop")).toBeTruthy();

    act(() => handle.emitGesture({ x: 0, y: 96 }));
    expect(screen.queryByTestId("tour-guide-backdrop")).toBeTruthy();

    act(() => handle.emitGesture({ x: 0, y: 96 }));
    expect(screen.queryByTestId("tour-guide-backdrop")).toBeNull();
  });

  it("still counts a swipe attempted at the end of a short list, instead of stalling the tour forever", async () => {
    // A short list can run out of scrollable content before swipeCount is
    // reached — every further swipe attempt there produces ~0 measurable
    // offset delta (there's nowhere left to go), so without the boundary
    // fallback this would never advance no matter how many times the user
    // tried.
    const handle = makeSubscribableHandle();
    await renderTour().start([makeStep({ swipeHint: "up", scroll: { handle } })]);

    act(() => handle.emitGesture({ x: 0, y: 96 }, { atStart: false, atEnd: false }));
    act(() => handle.emitGesture({ x: 0, y: 96 }, { atStart: false, atEnd: false }));
    // Two real swipes counted; still on the (only) step.
    expect(screen.queryByTestId("tour-guide-backdrop")).toBeTruthy();

    // Third attempt: the list has hit bottom, so the drag produced no real
    // movement at all — but it's pinned at the end an "up" hint scrolls
    // toward, so it still counts as the third swipe.
    act(() => handle.emitGesture({ x: 0, y: 0 }, { atStart: false, atEnd: true }));
    expect(screen.queryByTestId("tour-guide-backdrop")).toBeNull();
  });

  it("falls back to capturing touches when the handle can't be subscribed to", async () => {
    // A hand-built TourScrollHandle (no `subscribeGesture`, as
    // `useTourScroll` always provides) can't be watched passively, so the
    // gesture tour still needs to capture touches the old way.
    const handle = {
      ref: { current: { scrollToIndex: jest.fn() } },
      offsetRef: { current: { x: 0, y: 0 } },
      horizontal: false,
      pagingEnabled: true,
    };
    await renderTour().start([makeStep({ swipeHint: "up", scroll: { handle } })]);

    // The dimmed scrim stays purely visual even in the capturing path —
    // only the target-scoped capture view (see the next assertion) claims
    // touches, per the "shrink the capture surface" fix.
    const backdrop = screen.getByTestId("tour-guide-backdrop");
    expect(backdrop.props.pointerEvents).toBe("none");

    const capture = screen.getByTestId("tour-guide-gesture-capture");
    expect(typeof capture.props.onStartShouldSetResponder).toBe("function");
  });

  it("blocks touches outside the spotlight during a passive (native-scroll) gesture tour", async () => {
    // Regression: the passive backdrop used to be one pointerEvents="none"
    // view spanning the whole screen, which let every touch fall through
    // to the real app everywhere — not just inside the spotlight (e.g. a
    // tab bar or back button underneath the overlay was still tappable).
    const handle = makeSubscribableHandle();
    await renderTour().start([makeStep({ swipeHint: "up", scroll: { handle } })], {
      defaultBackdropBehavior: "next",
    });

    const blockers = screen.getAllByTestId("tour-guide-outside-blocker");
    // makeStep()'s targetRegion sits away from every screen edge, so all
    // four bands (top/bottom/left/right) exist to seal it off.
    expect(blockers).toHaveLength(4);

    fireEvent.press(blockers[0]!);
    // The tap outside the spotlight was handled here (backdrop behavior
    // fired, ending the single-step tour) — not left to fall through to
    // whatever's behind the overlay.
    expect(screen.queryByTestId("tour-guide-backdrop")).toBeNull();
  });

  it("blocks touches outside the spotlight during a capturing (fallback) gesture tour", async () => {
    const handle = {
      ref: { current: { scrollToIndex: jest.fn() } },
      offsetRef: { current: { x: 0, y: 0 } },
      horizontal: false,
      pagingEnabled: true,
    };
    await renderTour().start([makeStep({ swipeHint: "up", scroll: { handle } })], {
      defaultBackdropBehavior: "next",
    });

    const blockers = screen.getAllByTestId("tour-guide-outside-blocker");
    expect(blockers).toHaveLength(4);

    fireEvent.press(blockers[0]!);
    expect(screen.queryByTestId("tour-guide-backdrop")).toBeNull();
  });

  it("swallows a tap outside the spotlight without advancing when backdropBehavior is the default 'none'", async () => {
    const handle = makeSubscribableHandle();
    const onStepChange = jest.fn();
    await renderTour().start([makeStep({ swipeHint: "up", scroll: { handle } })], {
      onStepChange,
    });

    const blockers = screen.getAllByTestId("tour-guide-outside-blocker");
    fireEvent.press(blockers[0]!);

    // Still on the same step — the tap was absorbed rather than reaching
    // whatever's behind the overlay, and didn't accidentally advance the
    // tour either.
    expect(screen.getByTestId("tour-guide-backdrop")).toBeTruthy();
    expect(onStepChange).not.toHaveBeenCalled();
  });

  it("fires onSpotlightPress instead of the backdrop behavior when the tap lands inside the spotlight", async () => {
    const onSpotlightPress = jest.fn();
    const tour = renderTour();
    // makeStep()'s targetRegion is { x: 10, y: 20, width: 100, height: 50 }.
    await tour.start([makeStep({ onSpotlightPress })], {
      defaultBackdropBehavior: "next",
    });

    fireEvent.press(screen.getByTestId("tour-guide-backdrop"), {
      nativeEvent: { pageX: 50, pageY: 40 },
    });

    expect(onSpotlightPress).toHaveBeenCalledTimes(1);
    // defaultBackdropBehavior would have advanced past a single-step tour —
    // still here confirms the normal backdrop path didn't also run.
    expect(screen.getByText("Hello")).toBeTruthy();
  });

  it("falls back to the normal backdrop behavior when the tap lands outside the spotlight", async () => {
    const onSpotlightPress = jest.fn();
    const tour = renderTour();
    await tour.start([makeStep({ onSpotlightPress })], {
      defaultBackdropBehavior: "dismiss",
    });

    fireEvent.press(screen.getByTestId("tour-guide-backdrop"), {
      nativeEvent: { pageX: 300, pageY: 300 },
    });

    expect(onSpotlightPress).not.toHaveBeenCalled();
    expect(tour.api.isActive).toBe(false);
  });

  it("re-measures a new tour's tooltip even when it also starts at index 0 (regression: stale size reused, could position off-screen)", async () => {
    const tour = renderTour();
    await tour.start([makeStep({ id: "a", title: "First tour" })]);

    fireEvent(screen.getByTestId("tour-guide-tooltip-container"), "layout", {
      nativeEvent: { layout: { width: 240, height: 96 } },
    });

    // First tour's tooltip is measured and positioned.
    expect(
      StyleSheet.flatten(screen.getByTestId("tour-guide-tooltip-container").props.style)
        .opacity,
    ).toBe(1);

    act(() => {
      tour.api.endTour(true);
    });

    // A second, unrelated single-step tour also starts at index 0 — the
    // same currentIndex the first tour ended on.
    await tour.start([makeStep({ id: "b", title: "Second tour" })]);

    // Without a fresh layout event, it must not reuse the first tour's
    // stale measured size: TourGuideOverlay is a single app-lifetime
    // instance, so leaking that size here would silently mis-position
    // every tour that happens to also start at index 0.
    expect(
      StyleSheet.flatten(screen.getByTestId("tour-guide-tooltip-container").props.style)
        .opacity,
    ).toBe(0);
  });

  it("falls back to the normal backdrop behavior when a step has no onSpotlightPress", async () => {
    const tour = renderTour();
    await tour.start([makeStep()], { defaultBackdropBehavior: "dismiss" });

    fireEvent.press(screen.getByTestId("tour-guide-backdrop"), {
      nativeEvent: { pageX: 50, pageY: 40 },
    });

    expect(tour.api.isActive).toBe(false);
  });
});
