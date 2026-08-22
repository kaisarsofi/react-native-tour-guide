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
});
