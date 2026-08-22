import type { RefObject } from "react";
import type { StyleProp, TextStyle, View, ViewStyle } from "react-native";

export type TooltipPosition = "top" | "bottom" | "left" | "right" | "auto";

export type Placement = Exclude<TooltipPosition, "auto">;

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
  /** Which side of the target the tooltip ended up on. */
  placement: Placement;
  /** Distance from the tooltip's leading edge to the target's centre, for arrow alignment. */
  arrowOffset: number;
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
  /** Replace the tooltip for this step only. */
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

/**
 * Visual tokens for the built-in tooltip. These are real style values rather
 * than class names: this package ships precompiled, so a `className` on a
 * component *inside* the library would never reach NativeWind's build-time
 * transform. Bring your own `renderTooltip` if you want to style with
 * Tailwind classes — that component is compiled by your app, so `className`
 * works there.
 */
export interface TooltipStyles {
  backgroundColor?: string;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  titleColor?: string;
  descriptionColor?: string;
  stepCounterColor?: string;
  primaryButtonColor?: string;
  primaryButtonTextColor?: string;
  secondaryButtonColor?: string;
  secondaryButtonTextColor?: string;
  skipButtonTextColor?: string;
  progressDotColor?: string;
  progressDotActiveColor?: string;
  /** Draw a caret pointing at the highlighted element. */
  showArrow?: boolean;
  /** Drop shadow / Android elevation under the tooltip card. */
  shadow?: boolean;
  /** Max width (px) of the tooltip card. */
  maxWidth?: number;
}

/**
 * Raw RN style overrides for individual parts of the built-in tooltip, applied
 * last so they win over both the defaults and the theme tokens. Use these for
 * one-off tweaks (a font, some padding) where defining a whole theme would be
 * overkill.
 */
export interface TooltipSlotStyles {
  container?: StyleProp<ViewStyle>;
  stepCounter?: StyleProp<TextStyle>;
  progressDot?: StyleProp<ViewStyle>;
  progressDotActive?: StyleProp<ViewStyle>;
  title?: StyleProp<TextStyle>;
  description?: StyleProp<TextStyle>;
  footer?: StyleProp<ViewStyle>;
  primaryButton?: StyleProp<ViewStyle>;
  primaryButtonText?: StyleProp<TextStyle>;
  secondaryButton?: StyleProp<ViewStyle>;
  secondaryButtonText?: StyleProp<TextStyle>;
  skipButtonText?: StyleProp<TextStyle>;
}

export interface SpotlightStyles {
  overlayColor?: string;
  overlayOpacity?: number;
  /** Ring drawn immediately around the cutout. */
  borderColor?: string;
  borderWidth?: number;
  /** Animated ring that repeatedly expands out of the cutout. */
  enablePulse?: boolean;
  pulseColor?: string;
  pulseWidth?: number;
  pulseDuration?: number;
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
  tooltipStyles?: TooltipStyles;
  spotlightStyles?: SpotlightStyles;
  /** Raw RN style overrides per tooltip slot; applied after the theme tokens. */
  styles?: TooltipSlotStyles;
  /** Replace the tooltip for every step of this tour. */
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

export interface ResolvedTourGuideConfig {
  tooltipStyles: Required<TooltipStyles>;
  spotlightStyles: Required<SpotlightStyles>;
  styles?: TooltipSlotStyles;
  renderTooltip?: (props: TooltipProps) => React.ReactNode;
  showProgressDots: boolean;
  showStepCounter: boolean;
  nextButtonText: string;
  prevButtonText: string;
  skipButtonText: string;
  doneButtonText: string;
  animationDuration: number;
  motion: TourMotion;
  tourId?: string;
  defaultBackdropBehavior: BackdropBehavior;
  onTourStart?: () => void;
  onTourEnd?: (completed: boolean) => void;
  onStepChange?: (from: number, to: number) => void;
}

export interface TourGuideTheme {
  tooltipStyles: TooltipStyles;
  spotlightStyles: SpotlightStyles;
}
