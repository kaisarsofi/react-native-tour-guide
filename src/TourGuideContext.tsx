import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import type { RefObject } from "react";
import { StyleSheet, View } from "react-native";

import {
  DEFAULT_CONFIG,
  DEFAULT_SPOTLIGHT_STYLES,
  DEFAULT_TOOLTIP_STYLES,
} from "./themes";
import type {
  BackdropBehavior,
  Rect,
  ResolvedTourGuideConfig,
  TourEventEmitter,
  TourGuideConfig,
  TourStep,
} from "./types";
import { createTourEventEmitter } from "./utils/eventEmitter";
import { measureView, nextPaint, rectsEqual } from "./utils/geometry";
import { scrollStepIntoView } from "./utils/scroll";
import { isSameTourTarget } from "./utils/swipe";

interface TourGuideState {
  steps: TourStep[];
  config: ResolvedTourGuideConfig;
  currentIndex: number;
  isActive: boolean;
  isPaused: boolean;
  targetRect: Rect | null;
}

type TourGuideAction =
  | { type: "START"; steps: TourStep[]; config: ResolvedTourGuideConfig }
  | { type: "GOTO"; index: number; keepTarget?: boolean }
  | { type: "END" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "SET_TARGET_RECT"; rect: Rect | null };

const initialState: TourGuideState = {
  steps: [],
  config: resolveConfig(),
  currentIndex: 0,
  isActive: false,
  isPaused: false,
  targetRect: null,
};

function reducer(state: TourGuideState, action: TourGuideAction): TourGuideState {
  switch (action.type) {
    case "START":
      return {
        ...state,
        steps: action.steps,
        config: action.config,
        currentIndex: 0,
        isActive: true,
        isPaused: false,
        targetRect: null,
      };
    case "GOTO":
      return {
        ...state,
        currentIndex: action.index,
        targetRect: action.keepTarget ? state.targetRect : null,
      };
    case "END":
      return { ...state, isActive: false, isPaused: false, targetRect: null };
    case "PAUSE":
      return { ...state, isPaused: true };
    case "RESUME":
      return { ...state, isPaused: false };
    case "SET_TARGET_RECT":
      if (rectsEqual(state.targetRect, action.rect)) return state;
      return { ...state, targetRect: action.rect };
    default:
      return state;
  }
}

export interface TourGuideContextValue {
  state: TourGuideState;
  startTour: (steps: TourStep[], config?: TourGuideConfig) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  skipTour: () => void;
  endTour: (completed?: boolean) => void;
  pauseTour: () => void;
  resumeTour: () => void;
  handleBackdropPress: (behavior?: BackdropBehavior) => void;
  registerTarget: (id: string, ref: RefObject<View | null>) => () => void;
  registerOverlayHost: (ref: RefObject<View | null>) => () => void;
  events: TourEventEmitter;
}

const TourGuideContext = createContext<TourGuideContextValue | null>(null);

function resolveConfig(config?: TourGuideConfig): ResolvedTourGuideConfig {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    // Merge per-key so a theme (or a caller) can override a single colour
    // without having to restate the whole palette.
    tooltipStyles: { ...DEFAULT_TOOLTIP_STYLES, ...config?.tooltipStyles },
    spotlightStyles: { ...DEFAULT_SPOTLIGHT_STYLES, ...config?.spotlightStyles },
  };
}

export function TourGuideProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const targetRegistry = useRef(new Map<string, RefObject<View | null>>());
  const overlayHostRef = useRef<RefObject<View | null> | null>(null);
  const events = useMemo(() => createTourEventEmitter(), []);
  const measureToken = useRef(0);

  const registerTarget = useCallback((id: string, ref: RefObject<View | null>) => {
    targetRegistry.current.set(id, ref);
    return () => {
      targetRegistry.current.delete(id);
    };
  }, []);

  const registerOverlayHost = useCallback((ref: RefObject<View | null>) => {
    overlayHostRef.current = ref;
    return () => {
      if (overlayHostRef.current === ref) {
        overlayHostRef.current = null;
      }
    };
  }, []);

  const startTour = useCallback(
    (steps: TourStep[], config?: TourGuideConfig) => {
      const activeSteps = steps.filter((step) => step.active !== false);
      const resolved = resolveConfig(config);
      dispatch({ type: "START", steps: activeSteps, config: resolved });
      resolved.onTourStart?.();
      events.emit("start", { steps: activeSteps });
    },
    [events],
  );

  const endTour = useCallback(
    (completed = false) => {
      state.config.onTourEnd?.(completed);
      events.emit("end", { completed });
      dispatch({ type: "END" });
    },
    [events, state.config],
  );

  const goToStep = useCallback(
    (index: number) => {
      if (index < 0 || index >= state.steps.length) {
        endTour(index >= state.steps.length);
        return;
      }
      const from = state.currentIndex;
      const fromStep = state.steps[from];
      const toStep = state.steps[index];
      const keepTarget = Boolean(
        fromStep && toStep && isSameTourTarget(fromStep, toStep) && state.targetRect,
      );
      state.config.onStepChange?.(from, index);
      events.emit("stepChange", { from, to: index });
      dispatch({ type: "GOTO", index, keepTarget });
    },
    [endTour, events, state.config, state.currentIndex, state.steps, state.targetRect],
  );

  const nextStep = useCallback(() => {
    const step = state.steps[state.currentIndex];
    step?.onNext?.();
    goToStep(state.currentIndex + 1);
  }, [goToStep, state.currentIndex, state.steps]);

  const prevStep = useCallback(() => {
    const step = state.steps[state.currentIndex];
    step?.onPrev?.();
    goToStep(state.currentIndex - 1);
  }, [goToStep, state.currentIndex, state.steps]);

  const skipTour = useCallback(() => {
    const step = state.steps[state.currentIndex];
    step?.onSkip?.();
    events.emit("skip", { atStep: state.currentIndex });
    endTour(false);
  }, [endTour, events, state.currentIndex, state.steps]);

  const pauseTour = useCallback(() => {
    events.emit("pause", undefined);
    dispatch({ type: "PAUSE" });
  }, [events]);

  const resumeTour = useCallback(() => {
    events.emit("resume", undefined);
    dispatch({ type: "RESUME" });
  }, [events]);

  const handleBackdropPress = useCallback(
    (behavior?: BackdropBehavior) => {
      const resolved = behavior ?? state.config.defaultBackdropBehavior;
      if (resolved === "next") nextStep();
      if (resolved === "dismiss") skipTour();
    },
    [nextStep, skipTour, state.config.defaultBackdropBehavior],
  );

  useEffect(() => {
    if (!state.isActive || state.isPaused) return;
    const step = state.steps[state.currentIndex];
    if (!step) return;

    const token = ++measureToken.current;

    const resolve = async () => {
      await step.before?.();
      if (step.delayBefore) {
        await new Promise<void>((done) => {
          setTimeout(done, step.delayBefore);
        });
      }
      if (measureToken.current !== token) return;

      if (step.targetRegion) {
        dispatch({ type: "SET_TARGET_RECT", rect: step.targetRegion });
        return;
      }

      const ref = step.targetRef ?? targetRegistry.current.get(step.targetId ?? "");

      if (step.scroll) {
        // A chain runs outermost-first: scroll the page so the list is on
        // screen, then the list so the row is. Scrolling only the inner list
        // leaves the spotlight off-screen when the list itself is scrolled
        // out of the page.
        const chain = Array.isArray(step.scroll) ? step.scroll : [step.scroll];
        for (const options of chain) {
          await scrollStepIntoView(options, ref);
          if (measureToken.current !== token) return;
        }
      }

      await nextPaint();
      if (measureToken.current !== token) return;
      const rect = ref
        ? await measureView(ref, overlayHostRef.current ?? undefined)
        : null;
      if (measureToken.current !== token) return;
      dispatch({ type: "SET_TARGET_RECT", rect });
    };

    resolve();
  }, [state.currentIndex, state.isActive, state.isPaused, state.steps]);

  useEffect(() => {
    if (!state.isActive || state.isPaused) return;
    const step = state.steps[state.currentIndex];
    if (!step?.autoAdvance) return;
    const timer = setTimeout(() => nextStep(), step.autoAdvance);
    return () => clearTimeout(timer);
  }, [nextStep, state.currentIndex, state.isActive, state.isPaused, state.steps]);

  const value = useMemo<TourGuideContextValue>(
    () => ({
      state,
      startTour,
      nextStep,
      prevStep,
      goToStep,
      skipTour,
      endTour,
      pauseTour,
      resumeTour,
      handleBackdropPress,
      registerTarget,
      registerOverlayHost,
      events,
    }),
    [
      state,
      startTour,
      nextStep,
      prevStep,
      goToStep,
      skipTour,
      endTour,
      pauseTour,
      resumeTour,
      handleBackdropPress,
      registerTarget,
      registerOverlayHost,
      events,
    ],
  );

  return (
    <TourGuideContext.Provider value={value}>
      <View style={styles.root} pointerEvents="box-none" collapsable={false}>
        {children}
      </View>
    </TourGuideContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export function useTourGuideContext(): TourGuideContextValue {
  const ctx = useContext(TourGuideContext);
  if (!ctx) {
    throw new Error("useTourGuide must be used within a <TourGuideProvider>.");
  }
  return ctx;
}
