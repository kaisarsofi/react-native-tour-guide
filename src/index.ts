import "./rn-classname";

export { TourGuideProvider } from "./TourGuideContext";
export { TourGuideOverlay } from "./components/TourGuideOverlay";
export { TourTarget, type TourTargetProps } from "./components/TourTarget";
export { Tooltip } from "./components/Tooltip";
export { SwipeHint, type SwipeHintProps } from "./components/SwipeHint";

export { useTourGuide } from "./hooks/useTourGuide";
export {
  useTourPersistence,
  type TourStorageAdapter,
} from "./hooks/useTourPersistence";
export {
  useTourScroll,
  type TourScrollListRef,
  type UseTourScrollOptions,
  type UseTourScrollResult,
} from "./hooks/useTourScroll";

export {
  DEFAULT_SPOTLIGHT_STYLES,
  DEFAULT_SWIPE_HINT,
  DEFAULT_TOOLTIP_STYLES,
  createTheme,
  darkTheme,
  lightTheme,
  minimalTheme,
  oceanTheme,
  sunsetTheme,
  resolveSwipeHint,
  themes,
  vibrantTheme,
} from "./themes";

export { cn } from "./utils/cn";
export { DEFAULT_SWIPE_COUNT } from "./utils/swipe";

export type {
  BackdropBehavior,
  Placement,
  Rect,
  ResolvedSwipeHint,
  ResolvedTourGuideConfig,
  ScrollableNode,
  SpotlightStyles,
  SwipeDirection,
  SwipeHintConfig,
  TooltipPosition,
  TooltipProps,
  TooltipSlotStyles,
  TooltipStyles,
  TourEventEmitter,
  TourEventName,
  TourEventPayload,
  TourGuideConfig,
  TourGuideTheme,
  TourMotion,
  TourScrollHandle,
  TourScrollOptions,
  TourStep,
} from "./types";
