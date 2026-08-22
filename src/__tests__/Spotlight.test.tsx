import React from "react";
import { render } from "@testing-library/react-native";

import { Spotlight } from "../components/Spotlight";
import { DEFAULT_SPOTLIGHT_STYLES } from "../themes";

const rect = { x: 10, y: 20, width: 100, height: 50 };

describe("Spotlight", () => {
  it("renders the cutout, pulse ring, and border ring for a measured target", () => {
    expect(() =>
      render(
        <Spotlight
          rect={rect}
          radius={12}
          padding={8}
          duration={300}
          motion="morph"
          styles={DEFAULT_SPOTLIGHT_STYLES}
        />,
      ),
    ).not.toThrow();
  });

  it("renders without a target rect (fades out instead of crashing)", () => {
    expect(() =>
      render(
        <Spotlight
          rect={null}
          radius={12}
          padding={8}
          duration={300}
          motion="morph"
          styles={DEFAULT_SPOTLIGHT_STYLES}
        />,
      ),
    ).not.toThrow();
  });

  it("skips the pulse ring when enablePulse is false", () => {
    expect(() =>
      render(
        <Spotlight
          rect={rect}
          radius={12}
          padding={8}
          duration={300}
          motion="morph"
          styles={{ ...DEFAULT_SPOTLIGHT_STYLES, enablePulse: false }}
        />,
      ),
    ).not.toThrow();
  });

  it("skips the border ring when borderWidth is 0", () => {
    expect(() =>
      render(
        <Spotlight
          rect={rect}
          radius={12}
          padding={8}
          duration={300}
          motion="none"
          styles={{ ...DEFAULT_SPOTLIGHT_STYLES, borderWidth: 0 }}
        />,
      ),
    ).not.toThrow();
  });

  it("cancels the pulse animation on unmount without throwing", () => {
    const { unmount } = render(
      <Spotlight
        rect={rect}
        radius={12}
        padding={8}
        duration={300}
        motion="morph"
        styles={DEFAULT_SPOTLIGHT_STYLES}
      />,
    );

    expect(() => unmount()).not.toThrow();
  });

  it("re-renders cleanly when the target rect changes (re-triggers the timing effect)", () => {
    const { rerender } = render(
      <Spotlight
        rect={rect}
        radius={12}
        padding={8}
        duration={300}
        motion="morph"
        styles={DEFAULT_SPOTLIGHT_STYLES}
      />,
    );

    expect(() =>
      rerender(
        <Spotlight
          rect={{ x: 40, y: 60, width: 120, height: 60 }}
          radius={16}
          padding={8}
          duration={300}
          motion="morph"
          styles={DEFAULT_SPOTLIGHT_STYLES}
        />,
      ),
    ).not.toThrow();
  });
});
