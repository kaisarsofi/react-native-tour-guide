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
  /** Color of the hand's outline (stroke). Default `#0F172A`. */
  color?: string;
  /**
   * Color of the hand's palm (fill), separate from the outline. Default
   * `#FFFFFF` — a white fill reads clearly against most content regardless
   * of the outline color, but set this if white clashes with what's
   * spotlit.
   */
  fillColor?: string;
  /** Draw a fading track behind the hand showing the path. Default true. */
  showTrail?: boolean;
  trailColor?: string;
  /**
   * Length of the fading trail, in px. Defaults to `distance * 1.15` — the
   * trail slightly overruns the hand's own travel on both ends. Set this to
   * make the trail longer or shorter without changing how far the hand
   * itself travels (that's `distance`); trail *thickness* still scales with
   * `size` and isn't independently configurable.
   */
  trailLength?: number;
}

export type ResolvedSwipeHint = Required<SwipeHintConfig>;

/**
 * Space (px) between the target's own bounds and the spotlight cutout. A
 * plain number pads (or, negative, insets) both axes equally — the common
 * case. Pass `{ horizontal, vertical }` when a target already fits tightly
 * on one axis (a full-width card, say) but needs different breathing room
 * on the other (a tab bar right above it, bottom navigation right below) —
 * either axis left unset falls back to the same default as a plain number.
 */
export type SpotlightPadding = number | { horizontal?: number; vertical?: number };

/**
 * Anything with the scroll methods we need. Covers `ScrollView`, `FlatList`,
 * `SectionList`, `@shopify/flash-list`'s `FlashList`, `@legendapp/list`'s
 * `LegendList`, and `Animated` variants of each without importing them.
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
  /**
   * Set when the bound list is paging (`pagingEnabled` / carousel-style).
   * When true, a step's `scroll` uses `scrollToIndex` stepping (defaulting
   * to index 0) even if the step doesn't set `index` itself, since a paging
   * list can't be measured and scrolled by pixel offset the way a plain one
   * can.
   */
  pagingEnabled: boolean;
  /**
   * Subscribe to completed scroll gestures — fires once per drag (plus any
   * following momentum) that settles, with the net offset delta over that
   * whole session and whether the list was already pinned at either end of
   * its scrollable range (on whichever axis `horizontal` selects) by the
   * time the gesture ended. Lets a `swipeHint` step on an already-
   * scrollable target count swipes by watching how far the list's own
   * native scroll actually moved per gesture, instead of capturing touches
   * with a gesture responder and driving the scroll itself — and lets it
   * still count a swipe attempted at the end of a short list, where the
   * list has no room left to produce a measurable delta at all. Optional
   * so a handle built by hand (without `useTourScroll`) still type-checks
   * — such a handle just falls back to the touch-capturing path.
   */
  subscribeGesture?: (
    listener: (
      delta: { x: number; y: number },
      bounds: { atStart: boolean; atEnd: boolean },
    ) => void,
  ) => () => void;
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
   * How far one counted swipe scrolls a non-paging list, in px, when the
   * bound `handle` can't be watched passively (a hand-built
   * `TourScrollHandle` with no `subscribeGesture`, unlike one from
   * `useTourScroll()`) and the tour has to capture the touch and drive the
   * scroll itself. Ignored when `index` is set (those steps page by index
   * instead) or when the handle supports `subscribeGesture` — there, the
   * list scrolls itself and one physical swipe always counts as one,
   * however far it actually travels.
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
  spotlightPadding?: SpotlightPadding;
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
  /**
   * Fires instead of the default backdrop-tap behavior when the user taps
   * inside the spotlight itself (as opposed to the dimmed area around it) —
   * lets a step require pressing the real, live control to advance rather
   * than the tooltip's own Next button. Pair with `hideNextButton` so
   * that's the only way forward.
   */
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
  /**
   * Tints the cutout itself — the highlighted area is transparent (shows
   * the real content underneath) by default; this paints a color wash over
   * it instead, e.g. to match a brand color. Off (fully see-through) unless
   * `spotlightOpacity` is set above 0.
   */
  spotlightColor?: string;
  spotlightOpacity?: number;
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
   * Unset by default — the actual default then depends on whether the
   * step's target is a paging list (3) or not (2), decided per step since
   * a single tour's config can't know that in advance.
   */
  swipeCount?: number;
  /**
   * Show this tour once, then remember it via the provider's `storage`
   * (an in-memory adapter for the session by default; pass a real one to
   * `TourGuideProvider` — AsyncStorage, MMKV, ... — to persist across
   * restarts). Requires `tourId`; ignored without one.
   */
  persist?: boolean;
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
  /** Unset unless the caller set it — see `TourGuideConfig.swipeCount`. */
  swipeCount?: number;
  onTourStart?: () => void;
  onTourEnd?: (completed: boolean) => void;
  onStepChange?: (from: number, to: number) => void;
}

export interface TourGuideTheme {
  tooltipStyles: TooltipStyles;
  spotlightStyles: SpotlightStyles;
}
