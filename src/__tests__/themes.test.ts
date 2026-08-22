import {
  DEFAULT_SPOTLIGHT_STYLES,
  DEFAULT_TOOLTIP_STYLES,
  createTheme,
  darkTheme,
  lightTheme,
  minimalTheme,
  oceanTheme,
  sunsetTheme,
  themes,
  vibrantTheme,
} from "../themes";
import type { TourGuideTheme } from "../types";

const presets: [string, TourGuideTheme][] = [
  ["lightTheme", lightTheme],
  ["darkTheme", darkTheme],
  ["minimalTheme", minimalTheme],
  ["vibrantTheme", vibrantTheme],
  ["oceanTheme", oceanTheme],
  ["sunsetTheme", sunsetTheme],
];

describe("theme presets", () => {
  it.each(presets)("%s has the expected shape", (_name, theme) => {
    expect(theme).toHaveProperty("tooltipStyles");
    expect(theme).toHaveProperty("spotlightStyles");
    expect(theme.tooltipStyles).toHaveProperty("backgroundColor");
    expect(theme.tooltipStyles).toHaveProperty("titleColor");
    expect(theme.tooltipStyles).toHaveProperty("primaryButtonColor");
    expect(theme.spotlightStyles).toHaveProperty("overlayOpacity");
    expect(theme.spotlightStyles).toHaveProperty("overlayColor");
  });

  it("exposes every preset on the themes map", () => {
    expect(Object.keys(themes)).toEqual([
      "light",
      "dark",
      "minimal",
      "vibrant",
      "ocean",
      "sunset",
    ]);
    expect(themes.light).toBe(lightTheme);
    expect(themes.dark).toBe(darkTheme);
  });

  it("uses the default palette for lightTheme", () => {
    expect(lightTheme.tooltipStyles).toEqual(DEFAULT_TOOLTIP_STYLES);
    expect(lightTheme.spotlightStyles).toEqual(DEFAULT_SPOTLIGHT_STYLES);
  });

  it("uses a dark card and violet accents for darkTheme", () => {
    expect(darkTheme.tooltipStyles.backgroundColor).toBe("#1E293B");
    expect(darkTheme.tooltipStyles.titleColor).toBe("#F8FAFC");
    expect(darkTheme.tooltipStyles.primaryButtonColor).toBe("#8B5CF6");
    expect(darkTheme.spotlightStyles.overlayColor).toBe("#020617");
    expect(darkTheme.spotlightStyles.overlayOpacity).toBe(0.82);
  });

  it("disables pulse and the caret for minimalTheme", () => {
    expect(minimalTheme.tooltipStyles.showArrow).toBe(false);
    expect(minimalTheme.tooltipStyles.shadow).toBe(false);
    expect(minimalTheme.spotlightStyles.enablePulse).toBe(false);
    expect(minimalTheme.spotlightStyles.overlayOpacity).toBe(0.45);
  });

  it("uses a saturated violet card for vibrantTheme", () => {
    expect(vibrantTheme.tooltipStyles.backgroundColor).toBe("#6D28D9");
    expect(vibrantTheme.tooltipStyles.primaryButtonColor).toBe("#FFFFFF");
    expect(vibrantTheme.spotlightStyles.overlayColor).toBe("#2E1065");
  });
});

describe("createTheme", () => {
  it("returns the theme object it was given", () => {
    const theme = createTheme({
      tooltipStyles: { backgroundColor: "#FF0000" },
      spotlightStyles: { overlayOpacity: 0.9 },
    });

    expect(theme.tooltipStyles.backgroundColor).toBe("#FF0000");
    expect(theme.spotlightStyles.overlayOpacity).toBe(0.9);
  });
});
