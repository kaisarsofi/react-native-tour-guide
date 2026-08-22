import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { Tooltip } from "../components/Tooltip";
import {
  DEFAULT_CONFIG,
  DEFAULT_SPOTLIGHT_STYLES,
  DEFAULT_TOOLTIP_STYLES,
} from "../themes";
import type { TooltipProps } from "../types";
import { makeStep } from "./helpers";

function renderTooltip(over: Partial<TooltipProps> = {}) {
  const props: TooltipProps = {
    step: makeStep(),
    stepIndex: 0,
    totalSteps: 3,
    isFirst: true,
    isLast: false,
    placement: "bottom",
    arrowOffset: 40,
    config: {
      ...DEFAULT_CONFIG,
      tooltipStyles: DEFAULT_TOOLTIP_STYLES,
      spotlightStyles: DEFAULT_SPOTLIGHT_STYLES,
    },
    onNext: jest.fn(),
    onPrev: jest.fn(),
    onSkip: jest.fn(),
    ...over,
  };

  return { ...render(<Tooltip {...props} />), props };
}

describe("Tooltip", () => {
  it("renders title, description, and the step counter", () => {
    renderTooltip();

    expect(screen.getByText("Hello")).toBeTruthy();
    expect(screen.getByText("World")).toBeTruthy();
    expect(screen.getByText("1 of 3")).toBeTruthy();
  });

  it("hides Back on the first step and calls Skip / Next", () => {
    const { props } = renderTooltip();

    expect(screen.queryByText("Back")).toBeNull();
    fireEvent.press(screen.getByText("Skip"));
    fireEvent.press(screen.getByText("Next"));

    expect(props.onSkip).toHaveBeenCalledTimes(1);
    expect(props.onNext).toHaveBeenCalledTimes(1);
  });

  it("shows Back on a middle step", () => {
    const { props } = renderTooltip({
      stepIndex: 1,
      isFirst: false,
      isLast: false,
    });

    fireEvent.press(screen.getByText("Back"));
    expect(props.onPrev).toHaveBeenCalledTimes(1);
  });

  it("shows Done and hides Skip on the last step", () => {
    renderTooltip({
      stepIndex: 2,
      totalSteps: 3,
      isFirst: false,
      isLast: true,
    });

    expect(screen.getByText("Done")).toBeTruthy();
    expect(screen.queryByText("Skip")).toBeNull();
  });

  it("honours hide* button flags", () => {
    renderTooltip({
      step: makeStep({
        hideNextButton: true,
        hidePrevButton: true,
        hideSkipButton: true,
      }),
      isFirst: false,
    });

    expect(screen.queryByText("Next")).toBeNull();
    expect(screen.queryByText("Back")).toBeNull();
    expect(screen.queryByText("Skip")).toBeNull();
  });

  it("uses custom button labels from the config", () => {
    renderTooltip({
      isFirst: false,
      config: {
        ...DEFAULT_CONFIG,
        tooltipStyles: DEFAULT_TOOLTIP_STYLES,
        spotlightStyles: DEFAULT_SPOTLIGHT_STYLES,
        nextButtonText: "Continue",
        prevButtonText: "Previous",
        skipButtonText: "Close",
      },
    });

    expect(screen.getByText("Continue")).toBeTruthy();
    expect(screen.getByText("Previous")).toBeTruthy();
    expect(screen.getByText("Close")).toBeTruthy();
  });
});
