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

export type SwipeDirection = "up" | "down" | "left" | "right";

/**
 * An animated hand that repeatedly mimes a swipe over the highlighted target,
 * for teaching gestures a spotlight alone can't explain ("this list scrolls
 * sideways", "pull down to refresh").
 */
export interface SwipeHintConfig {
  direction: SwipeDirection;
  /** How far the hand travels, in px. Default 64. */
  distance?: number;
  /** Duration of one swipe, in ms. Default 1400. */
  duration?: number;
  /** Pause between repeats, in ms. Default 400. */
  repeatDelay?: number;
  /** Hand size in px. Default 44. */
  size?: number;
  color?: string;
  /** Draw a fading track behind the hand showing the path. Default true. */
  showTrail?: boolean;
  trailColor?: string;
}

export type ResolvedSwipeHint = Required<SwipeHintConfig>;

/**
 * Anything with the scroll methods we need. Covers `ScrollView`, `FlatList`,
 * `SectionList`, and `Animated` variants of each without importing them.
 */
export interface ScrollableNode {
  scrollTo?: (options: { x?: number; y?: number; animated?: boolean }) => void;
  scrollToOffset?: (options: { offset: number; animated?: boolean }) => void;
  scrollToIndex?: (options: {
    index: number;
    animated?: boolean;
    viewPosition?: number;
  }) => void;
  /** FlatList / SectionList expose the underlying ScrollView this way. */
  getNativeScrollRef?: () => unknown;
  getScrollResponder?: () => unknown;
}

/**
 * Returned by `useTourScroll()` and handed to a step's `scroll` option so the
 * tour can bring an off-screen row into view before spotlighting it.
 */
export interface TourScrollHandle {
  ref: RefObject<ScrollableNode | null>;
  /** Live scroll offset, kept current by the hook's `scrollProps.onScroll`. */
  offsetRef: RefObject<{ x: number; y: number }>;
  horizontal: boolean;
}

export interface TourScrollOptions {
  handle: TourScrollHandle;
  /** Space to leave between the target and the edge of the list. Default 24. */
  padding?: number;
  /** Time to let the scroll settle before measuring, in ms. Default 400. */
  settleDelay?: number;
  /**
   * Jump straight to this index instead of computing an offset. Required for
   * virtualized rows that aren't mounted yet, since those can't be measured.
   */
  index?: number;
  /** Where the row lands when using `index`: 0 = start, 0.5 = centre, 1 = end. */
  viewPosition?: number;
  /**
   * How far one counted swipe scrolls a non-paging list, in px. Ignored when
   * `index` is set — those steps page by index instead.
   */
  pageSize?: number;
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
  /**
   * Scroll a list so this step's target is on screen before spotlighting it.
   * Pass an array when the target sits inside more than one scrollable — an
   * outer page and an inner list, say — and each needs its own handle. The
   * chain runs outermost first, since scrolling an inner list is pointless
   * while the list itself is still off-screen.
   */
  scroll?: TourScrollOptions | TourScrollOptions[];
  /** Mime a swipe gesture over the target with an animated hand. */
  swipeHint?: SwipeDirection | SwipeHintConfig;
  /**
   * Hide the tooltip card (title, copy, Next/Back). Defaults to `true` when
   * `swipeHint` is set — a gesture demo shouldn't compete with buttons. Set
   * `false` to keep the tooltip alongside the hand.
   */
  hideTooltip?: boolean;
  /**
   * Swiping in the hinted direction advances, the opposite goes back.
   * Defaults to `true` when `swipeHint` is set. Set `false` for a visual-only
   * hint that still uses the tooltip buttons.
   */
  advanceOnSwipe?: boolean;
  /**
   * How many swipes this step takes before the tour moves on (or ends).
   * Defaults to 3 when `swipeHint` is set. The spotlight stays on this
   * step's target for the whole count — it does not jump to child rows.
   */
  swipeCount?: number;
  /** Replace the tooltip for this step only. */
  renderTooltip?: (props: TooltipProps) => React.ReactNode;
  motion?: TourMotion;
  hideNextButton?: boolean;
  hidePrevButton?: boolean;
  hideSkipButton?: boolean;
  /**
   * Hide the whole button row, leaving an information-only tooltip. Pair with
   * `autoAdvance` or `backdropBehavior` so the tour can still move on — good
   * for a step that's demonstrating a gesture rather than asking for a tap.
   */
  hideControls?: boolean;
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
  "start" | "stepChange" | "end" | "skip" | "pause" | "resume";

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
  /**
   * Default swipe count for `swipeHint` steps. Per-step `swipeCount` wins.
   * Default 3.
   */
  swipeCount?: number;
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
  swipeCount: number;
  onTourStart?: () => void;
  onTourEnd?: (completed: boolean) => void;
  onStepChange?: (from: number, to: number) => void;
}

export interface TourGuideTheme {
  tooltipStyles: TooltipStyles;
  spotlightStyles: SpotlightStyles;
}
