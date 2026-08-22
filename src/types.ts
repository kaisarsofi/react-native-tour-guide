import type { RefObject } from "react";
import type { View } from "react-native";

export type TooltipPosition = "top" | "bottom" | "left" | "right" | "auto";

export type BackdropBehavior = "next" | "dismiss" | "none";

export type TourMotion = "morph" | "fade" | "none";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TooltipProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  isFirst: boolean;
  isLast: boolean;
  config: ResolvedTourGuideConfig;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export interface TourStep {
  /** Unique identifier for this step within a tour. */
  id: string;
  /** Ref to the component to highlight. Mutually exclusive with `targetId`. */
  targetRef?: RefObject<View | null>;
  /** Id of a `<TourTarget id="...">` wrapper to highlight. Mutually exclusive with `targetRef`. */
  targetId?: string;
  /** Fixed screen region to highlight instead of measuring a component. */
  targetRegion?: Rect;
  title: string;
  description: string;
  tooltipPosition?: TooltipPosition;
  /** Extra space (px) between the target bounds and the spotlight cutout. */
  spotlightPadding?: number;
  /** Overrides the auto-detected border radius of the spotlight cutout. */
  spotlightBorderRadius?: number;
  /** Skip this step without renumbering the tour. */
  active?: boolean;
  backdropBehavior?: BackdropBehavior;
  /** Advance to the next step automatically after this many ms. */
  autoAdvance?: number;
  /** Awaited before the step is measured and shown (e.g. navigate, fetch, expand). */
  before?: () => Promise<void> | void;
  /** Static delay (ms) before showing the step, after `before` resolves. */
  delayBefore?: number;
  renderTooltip?: (props: TooltipProps) => React.ReactNode;
  motion?: TourMotion;
  hideNextButton?: boolean;
  hidePrevButton?: boolean;
  hideSkipButton?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  onSpotlightPress?: () => void;
  accessibilityLabel?: string;
}

export interface TooltipClassNames {
  container?: string;
  title?: string;
  description?: string;
  footer?: string;
  stepCounter?: string;
  nextButton?: string;
  nextButtonText?: string;
  prevButton?: string;
  prevButtonText?: string;
  skipButton?: string;
  skipButtonText?: string;
  progressDot?: string;
  progressDotActive?: string;
}

export interface SpotlightStyles {
  overlayColor?: string;
  overlayOpacity?: number;
}

export type TourEventName =
  | "start"
  | "stepChange"
  | "end"
  | "skip"
  | "pause"
  | "resume";

export type TourEventPayload = {
  start: { steps: TourStep[] };
  stepChange: { from: number; to: number };
  end: { completed: boolean };
  skip: { atStep: number };
  pause: undefined;
  resume: undefined;
};

export interface TourEventEmitter {
  on: <E extends TourEventName>(
    event: E,
    handler: (payload: TourEventPayload[E]) => void,
  ) => () => void;
}

export interface TourGuideConfig {
  tooltipClassNames?: TooltipClassNames;
  spotlightStyles?: SpotlightStyles;
  renderTooltip?: (props: TooltipProps) => React.ReactNode;
  showProgressDots?: boolean;
  showStepCounter?: boolean;
  nextButtonText?: string;
  prevButtonText?: string;
  skipButtonText?: string;
  doneButtonText?: string;
  animationDuration?: number;
  motion?: TourMotion;
  tourId?: string;
  defaultBackdropBehavior?: BackdropBehavior;
  onTourStart?: () => void;
  onTourEnd?: (completed: boolean) => void;
  onStepChange?: (from: number, to: number) => void;
}

export type ResolvedTourGuideConfig = Required<
  Omit<
    TourGuideConfig,
    | "renderTooltip"
    | "tourId"
    | "onTourStart"
    | "onTourEnd"
    | "onStepChange"
    | "tooltipClassNames"
    | "spotlightStyles"
  >
> &
  Pick<
    TourGuideConfig,
    | "renderTooltip"
    | "tourId"
    | "onTourStart"
    | "onTourEnd"
    | "onStepChange"
    | "tooltipClassNames"
    | "spotlightStyles"
  >;

export interface TourGuideTheme {
  tooltipClassNames: TooltipClassNames;
  spotlightStyles: SpotlightStyles;
}
