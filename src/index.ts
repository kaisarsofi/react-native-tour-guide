import "./rn-classname";

export { TourGuideProvider } from "./TourGuideContext";
export { TourGuideOverlay } from "./components/TourGuideOverlay";
export { TourTarget, type TourTargetProps } from "./components/TourTarget";
export { Tooltip } from "./components/Tooltip";

export { useTourGuide } from "./hooks/useTourGuide";
export {
  useTourPersistence,
  type TourStorageAdapter,
} from "./hooks/useTourPersistence";

export {
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
} from "./themes";

export { cn } from "./utils/cn";

export type {
  BackdropBehavior,
  Placement,
  Rect,
  ResolvedTourGuideConfig,
  SpotlightStyles,
  TooltipPosition,
  TooltipProps,
  TooltipStyles,
  TourEventEmitter,
  TourEventName,
  TourEventPayload,
  TourGuideConfig,
  TourGuideTheme,
  TourMotion,
  TourStep,
} from "./types";
