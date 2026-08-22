import { render, screen } from "@testing-library/react-native";

import { Tooltip } from "../components/Tooltip";
import {
  DEFAULT_CONFIG,
  DEFAULT_SPOTLIGHT_STYLES,
  DEFAULT_TOOLTIP_STYLES,
} from "../themes";
import { makeStep } from "./helpers";

describe("tooltip accessibility", () => {
  const base = {
    stepIndex: 0,
    totalSteps: 2,
    isFirst: true,
    isLast: false,
    placement: "bottom" as const,
    arrowOffset: 24,
    config: {
      ...DEFAULT_CONFIG,
      tooltipStyles: DEFAULT_TOOLTIP_STYLES,
      spotlightStyles: DEFAULT_SPOTLIGHT_STYLES,
    },
    onNext: jest.fn(),
    onPrev: jest.fn(),
    onSkip: jest.fn(),
  };

  it("exposes the step title as the alert label by default", () => {
    render(<Tooltip {...base} step={makeStep()} />);

    expect(screen.getByLabelText("Hello")).toBeTruthy();
  });

  it("uses an explicit accessibilityLabel when provided", () => {
    render(
      <Tooltip
        {...base}
        step={makeStep({ accessibilityLabel: "Compose button intro" })}
      />,
    );

    expect(screen.getByLabelText("Compose button intro")).toBeTruthy();
  });

  it("marks action controls as buttons", () => {
    render(<Tooltip {...base} step={makeStep()} />);

    expect(screen.getByRole("button", { name: "Skip" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next" })).toBeTruthy();
  });
});
