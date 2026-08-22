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
  createTheme,
  darkTheme,
  lightTheme,
  minimalTheme,
  vibrantTheme,
} from "./themes";

export { cn } from "./utils/cn";

export type {
  BackdropBehavior,
  Rect,
  ResolvedTourGuideConfig,
  SpotlightStyles,
  TooltipClassNames,
  TooltipPosition,
  TooltipProps,
  TourEventEmitter,
  TourEventName,
  TourEventPayload,
  TourGuideConfig,
  TourGuideTheme,
  TourMotion,
  TourStep,
} from "./types";
