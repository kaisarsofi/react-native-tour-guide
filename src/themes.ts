import type { BackdropBehavior, TourGuideTheme, TourMotion } from "./types";

interface DefaultTourGuideConfig {
  showProgressDots: boolean;
  showStepCounter: boolean;
  nextButtonText: string;
  prevButtonText: string;
  skipButtonText: string;
  doneButtonText: string;
  animationDuration: number;
  motion: TourMotion;
  defaultBackdropBehavior: BackdropBehavior;
}

export const DEFAULT_CONFIG: DefaultTourGuideConfig = {
  showProgressDots: false,
  showStepCounter: true,
  nextButtonText: "Next",
  prevButtonText: "Back",
  skipButtonText: "Skip",
  doneButtonText: "Done",
  animationDuration: 300,
  motion: "morph",
  defaultBackdropBehavior: "none",
};

export function createTheme(theme: TourGuideTheme): TourGuideTheme {
  return theme;
}

export const lightTheme: TourGuideTheme = createTheme({
  tooltipClassNames: {
    container: "bg-white",
    title: "text-neutral-900",
    description: "text-neutral-600",
    stepCounter: "text-neutral-400",
    nextButton: "bg-neutral-900",
    nextButtonText: "text-white",
    prevButton: "bg-neutral-100",
    prevButtonText: "text-neutral-900",
    skipButton: "",
    skipButtonText: "text-neutral-400",
    progressDot: "bg-neutral-200",
    progressDotActive: "bg-neutral-900",
  },
  spotlightStyles: {
    overlayColor: "#000000",
    overlayOpacity: 0.55,
  },
});

export const darkTheme: TourGuideTheme = createTheme({
  tooltipClassNames: {
    container: "bg-neutral-900",
    title: "text-white",
    description: "text-neutral-300",
    stepCounter: "text-neutral-500",
    nextButton: "bg-white",
    nextButtonText: "text-neutral-900",
    prevButton: "bg-neutral-800",
    prevButtonText: "text-white",
    skipButton: "",
    skipButtonText: "text-neutral-500",
    progressDot: "bg-neutral-700",
    progressDotActive: "bg-white",
  },
  spotlightStyles: {
    overlayColor: "#000000",
    overlayOpacity: 0.7,
  },
});

export const minimalTheme: TourGuideTheme = createTheme({
  tooltipClassNames: {
    container: "bg-white border border-neutral-200",
    title: "text-neutral-900",
    description: "text-neutral-500",
    stepCounter: "text-neutral-400",
    nextButton: "bg-transparent",
    nextButtonText: "text-neutral-900 underline",
    prevButton: "bg-transparent",
    prevButtonText: "text-neutral-500",
    skipButton: "",
    skipButtonText: "text-neutral-400",
    progressDot: "bg-neutral-200",
    progressDotActive: "bg-neutral-900",
  },
  spotlightStyles: {
    overlayColor: "#000000",
    overlayOpacity: 0.4,
  },
});

export const vibrantTheme: TourGuideTheme = createTheme({
  tooltipClassNames: {
    container: "bg-violet-600",
    title: "text-white",
    description: "text-violet-100",
    stepCounter: "text-violet-200",
    nextButton: "bg-white",
    nextButtonText: "text-violet-600",
    prevButton: "bg-violet-500",
    prevButtonText: "text-white",
    skipButton: "",
    skipButtonText: "text-violet-200",
    progressDot: "bg-violet-400",
    progressDotActive: "bg-white",
  },
  spotlightStyles: {
    overlayColor: "#4c1d95",
    overlayOpacity: 0.6,
  },
});
