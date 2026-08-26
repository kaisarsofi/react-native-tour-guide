import type {
  ResolvedSwipeHint,
  SpotlightStyles,
  SwipeDirection,
  SwipeHintConfig,
  TooltipStyles,
  TourGuideConfig,
  TourGuideTheme,
} from "./types";

export const DEFAULT_TOOLTIP_STYLES: Required<TooltipStyles> = {
  backgroundColor: "#FFFFFF",
  borderRadius: 18,
  borderColor: "transparent",
  borderWidth: 0,
  titleColor: "#0F172A",
  descriptionColor: "#64748B",
  stepCounterColor: "#94A3B8",
  primaryButtonColor: "#6D28D9",
  primaryButtonTextColor: "#FFFFFF",
  secondaryButtonColor: "#F1F5F9",
  secondaryButtonTextColor: "#334155",
  skipButtonTextColor: "#94A3B8",
  progressDotColor: "#E2E8F0",
  progressDotActiveColor: "#6D28D9",
  showArrow: true,
  shadow: true,
  maxWidth: 340,
};

export const DEFAULT_SPOTLIGHT_STYLES: Required<SpotlightStyles> = {
  overlayColor: "#0F172A",
  overlayOpacity: 0.72,
  spotlightColor: "#FFFFFF",
  spotlightOpacity: 0,
  borderColor: "#FFFFFF",
  borderWidth: 2,
  enablePulse: true,
  pulseColor: "#FFFFFF",
  pulseWidth: 2,
  pulseDuration: 1800,
};

/**
 * The hand rides over the *spotlit* target — the one part of the screen the
 * scrim doesn't dim — so it has to read against ordinary app content, not
 * against the dark backdrop. Hence a dark default rather than a white one.
 * Override `color` / `trailColor` when spotlighting a dark element.
 *
 * `trailLength` isn't listed here — it defaults to `distance * 1.15`, a
 * value that depends on the *resolved* `distance` (which may itself have
 * come from the caller), not a fixed constant. `resolveSwipeHint` computes
 * it after merging everything else.
 */
export const DEFAULT_SWIPE_HINT: Omit<ResolvedSwipeHint, "direction" | "trailLength"> =
  {
    distance: 64,
    duration: 1400,
    repeatDelay: 400,
    size: 60,
    color: "#0F172A",
    fillColor: "#FFFFFF",
    showTrail: true,
    trailColor: "#0F172A",
  };

/** How much longer the trail is than the hand's own travel, when `trailLength` isn't set explicitly. */
const DEFAULT_TRAIL_LENGTH_RATIO = 1.15;

/** Accepts the `"left"` shorthand as well as the full config object. */
export function resolveSwipeHint(
  hint: SwipeDirection | SwipeHintConfig | undefined,
): ResolvedSwipeHint | null {
  if (!hint) return null;
  const config = typeof hint === "string" ? { direction: hint } : hint;
  const distance = config.distance ?? DEFAULT_SWIPE_HINT.distance;
  return {
    ...DEFAULT_SWIPE_HINT,
    trailLength: distance * DEFAULT_TRAIL_LENGTH_RATIO,
    ...config,
  };
}

export const DEFAULT_CONFIG: Omit<
  Required<
    Pick<
      TourGuideConfig,
      | "showProgressDots"
      | "showStepCounter"
      | "nextButtonText"
      | "prevButtonText"
      | "skipButtonText"
      | "doneButtonText"
      | "animationDuration"
      | "motion"
      | "defaultBackdropBehavior"
    >
  >,
  never
> = {
  showProgressDots: true,
  showStepCounter: true,
  nextButtonText: "Next",
  prevButtonText: "Back",
  skipButtonText: "Skip",
  doneButtonText: "Done",
  animationDuration: 320,
  motion: "morph",
  defaultBackdropBehavior: "none",
  // swipeCount is deliberately left unset here — its real default (3 for
  // a paging list, 2 otherwise) is decided per step in resolveSwipeCount,
  // since a single tour-wide default can't know that in advance. Baking a
  // number in here would always shadow that per-step default.
};

export function createTheme(theme: TourGuideTheme): TourGuideTheme {
  return theme;
}

/** Clean white card on a deep navy scrim. The default. */
export const lightTheme: TourGuideTheme = createTheme({
  tooltipStyles: { ...DEFAULT_TOOLTIP_STYLES },
  spotlightStyles: { ...DEFAULT_SPOTLIGHT_STYLES },
});

/** Slate card for dark UIs. */
export const darkTheme: TourGuideTheme = createTheme({
  tooltipStyles: {
    backgroundColor: "#1E293B",
    borderRadius: 18,
    borderColor: "#334155",
    borderWidth: 1,
    titleColor: "#F8FAFC",
    descriptionColor: "#94A3B8",
    stepCounterColor: "#64748B",
    primaryButtonColor: "#8B5CF6",
    primaryButtonTextColor: "#FFFFFF",
    secondaryButtonColor: "#334155",
    secondaryButtonTextColor: "#E2E8F0",
    skipButtonTextColor: "#64748B",
    progressDotColor: "#334155",
    progressDotActiveColor: "#8B5CF6",
    showArrow: true,
    shadow: true,
    maxWidth: 340,
  },
  spotlightStyles: {
    overlayColor: "#020617",
    overlayOpacity: 0.82,
    borderColor: "#8B5CF6",
    borderWidth: 2,
    enablePulse: true,
    pulseColor: "#8B5CF6",
    pulseWidth: 2,
    pulseDuration: 1800,
  },
});

/** Understated: hairline border, no pulse, muted scrim. */
export const minimalTheme: TourGuideTheme = createTheme({
  tooltipStyles: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderColor: "#E2E8F0",
    borderWidth: 1,
    titleColor: "#0F172A",
    descriptionColor: "#64748B",
    stepCounterColor: "#94A3B8",
    primaryButtonColor: "#0F172A",
    primaryButtonTextColor: "#FFFFFF",
    secondaryButtonColor: "#FFFFFF",
    secondaryButtonTextColor: "#475569",
    skipButtonTextColor: "#94A3B8",
    progressDotColor: "#E2E8F0",
    progressDotActiveColor: "#0F172A",
    showArrow: false,
    shadow: false,
    maxWidth: 320,
  },
  spotlightStyles: {
    overlayColor: "#0F172A",
    overlayOpacity: 0.45,
    borderColor: "transparent",
    borderWidth: 0,
    enablePulse: false,
    pulseColor: "#FFFFFF",
    pulseWidth: 2,
    pulseDuration: 1800,
  },
});

/** Saturated violet card — high contrast, playful. */
export const vibrantTheme: TourGuideTheme = createTheme({
  tooltipStyles: {
    backgroundColor: "#6D28D9",
    borderRadius: 22,
    borderColor: "transparent",
    borderWidth: 0,
    titleColor: "#FFFFFF",
    descriptionColor: "#DDD6FE",
    stepCounterColor: "#C4B5FD",
    primaryButtonColor: "#FFFFFF",
    primaryButtonTextColor: "#6D28D9",
    secondaryButtonColor: "#7C3AED",
    secondaryButtonTextColor: "#FFFFFF",
    skipButtonTextColor: "#C4B5FD",
    progressDotColor: "#8B5CF6",
    progressDotActiveColor: "#FFFFFF",
    showArrow: true,
    shadow: true,
    maxWidth: 340,
  },
  spotlightStyles: {
    overlayColor: "#2E1065",
    overlayOpacity: 0.78,
    borderColor: "#C4B5FD",
    borderWidth: 2,
    enablePulse: true,
    pulseColor: "#C4B5FD",
    pulseWidth: 3,
    pulseDuration: 1500,
  },
});

/** Teal / deep-sea. */
export const oceanTheme: TourGuideTheme = createTheme({
  tooltipStyles: {
    backgroundColor: "#0F766E",
    borderRadius: 18,
    borderColor: "transparent",
    borderWidth: 0,
    titleColor: "#FFFFFF",
    descriptionColor: "#CCFBF1",
    stepCounterColor: "#5EEAD4",
    primaryButtonColor: "#FFFFFF",
    primaryButtonTextColor: "#0F766E",
    secondaryButtonColor: "#115E59",
    secondaryButtonTextColor: "#CCFBF1",
    skipButtonTextColor: "#5EEAD4",
    progressDotColor: "#115E59",
    progressDotActiveColor: "#FFFFFF",
    showArrow: true,
    shadow: true,
    maxWidth: 340,
  },
  spotlightStyles: {
    overlayColor: "#042F2E",
    overlayOpacity: 0.8,
    borderColor: "#5EEAD4",
    borderWidth: 2,
    enablePulse: true,
    pulseColor: "#5EEAD4",
    pulseWidth: 2,
    pulseDuration: 1600,
  },
});

/** Warm amber / sunset. */
export const sunsetTheme: TourGuideTheme = createTheme({
  tooltipStyles: {
    backgroundColor: "#FFF7ED",
    borderRadius: 20,
    borderColor: "#FED7AA",
    borderWidth: 1,
    titleColor: "#7C2D12",
    descriptionColor: "#9A3412",
    stepCounterColor: "#C2410C",
    primaryButtonColor: "#EA580C",
    primaryButtonTextColor: "#FFFFFF",
    secondaryButtonColor: "#FFEDD5",
    secondaryButtonTextColor: "#9A3412",
    skipButtonTextColor: "#C2410C",
    progressDotColor: "#FED7AA",
    progressDotActiveColor: "#EA580C",
    showArrow: true,
    shadow: true,
    maxWidth: 340,
  },
  spotlightStyles: {
    overlayColor: "#431407",
    overlayOpacity: 0.75,
    borderColor: "#FB923C",
    borderWidth: 2,
    enablePulse: true,
    pulseColor: "#FB923C",
    pulseWidth: 3,
    pulseDuration: 1500,
  },
});

export const themes = {
  light: lightTheme,
  dark: darkTheme,
  minimal: minimalTheme,
  vibrant: vibrantTheme,
  ocean: oceanTheme,
  sunset: sunsetTheme,
};
