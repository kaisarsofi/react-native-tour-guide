import React from "react";
import { Text } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";

import type { TooltipProps } from "../types";
import { makeStep, measurableRef, renderTour } from "./helpers";

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

  it("falls back to the normal backdrop behavior when a step has no onSpotlightPress", async () => {
    const tour = renderTour();
    await tour.start([makeStep()], { defaultBackdropBehavior: "dismiss" });

    fireEvent.press(screen.getByTestId("tour-guide-backdrop"), {
      nativeEvent: { pageX: 50, pageY: 40 },
    });

    expect(tour.api.isActive).toBe(false);
  });
});
