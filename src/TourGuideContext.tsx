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
import {
  createMemoryStorage,
  storageKey,
  type TourStorageAdapter,
} from "./utils/storage";
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
  /** Clears a `persist: true` tour's "already seen" record, so it shows again. */
  resetTour: (tourId: string) => void;
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

export interface TourGuideProviderProps {
  children: React.ReactNode;
  /**
   * Backs `persist: true` tours. Defaults to an in-memory adapter (works
   * for the app session, not across restarts) so persistence works with
   * zero setup. Pass a real adapter — AsyncStorage, MMKV, ... — to persist
   * across restarts; its shape (`getItem`/`setItem`/`removeItem`) already
   * matches AsyncStorage, so this is usually just `storage={AsyncStorage}`.
   */
  storage?: TourStorageAdapter;
}

export function TourGuideProvider({ children, storage }: TourGuideProviderProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const resolvedStorage = useMemo(() => storage ?? createMemoryStorage(), [storage]);
  const targetRegistry = useRef(new Map<string, RefObject<View | null>>());
  const overlayHostRef = useRef<RefObject<View | null> | null>(null);
  const events = useMemo(() => createTourEventEmitter(), []);
  const measureToken = useRef(0);
  // A step's own callback (`onSpotlightPress`, `before`, …) is captured once
  // into the steps array a caller hands to `startTour`, then invoked later
  // from inside the overlay — by then, a `nextStep`/`goToStep` closed over
  // that render's `state` would advance from a stale `currentIndex`, redoing
  // the same transition instead of the next one. Reading through a ref kept
  // in sync every render means these actions are always correct no matter
  // how long ago the caller captured them, and can stay referentially stable
  // across renders too.
  const stateRef = useRef(state);
  stateRef.current = state;

  // Set by `endTour` right before it fires `onTourEnd`, so the persistence
  // wiring in `startTour` can tell a skip (still "seen") apart from backing
  // out before the first step (not "seen") without changing the public
  // `completed` value handed to consumers' `onTourEnd`.
  const markSeenRef = useRef(false);

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

      const begin = () => {
        dispatch({ type: "START", steps: activeSteps, config: resolved });
        resolved.onTourStart?.();
        events.emit("start", { steps: activeSteps });
      };

      if (config?.persist && config.tourId) {
        const key = storageKey(config.tourId);
        // Mark it seen on completion or skip, so the check below skips it
        // next time either way — only backing out before the first step
        // (goToStep below index 0) leaves it unseen.
        const onTourEnd = resolved.onTourEnd;
        resolved.onTourEnd = (completed) => {
          onTourEnd?.(completed);
          if (markSeenRef.current) resolvedStorage.setItem(key, "true");
        };
        // `getItem` is typed to allow a plain synchronous return (the
        // in-memory default storage does this) as well as a Promise (a real
        // adapter like AsyncStorage). Only defer to a microtask when the
        // adapter actually returned one — an unconditional `Promise.resolve`
        // wrapper would push every persisted `startTour` call one tick later
        // than a normal one for no reason, even on the common, fully
        // synchronous default path.
        const maybeSeen = resolvedStorage.getItem(key);
        if (maybeSeen instanceof Promise) {
          maybeSeen.then((seen) => {
            if (seen === "true") return;
            begin();
          });
        } else if (maybeSeen !== "true") {
          begin();
        }
        return;
      }

      begin();
    },
    [events, resolvedStorage],
  );

  const resetTour = useCallback(
    (tourId: string) => {
      const key = storageKey(tourId);
      if (resolvedStorage.removeItem) {
        resolvedStorage.removeItem(key);
      } else {
        resolvedStorage.setItem(key, "false");
      }
    },
    [resolvedStorage],
  );

  const endTour = useCallback(
    (completed = false, markSeen = completed) => {
      markSeenRef.current = markSeen;
      stateRef.current.config.onTourEnd?.(completed);
      events.emit("end", { completed });
      dispatch({ type: "END" });
    },
    [events],
  );

  const goToStep = useCallback(
    (index: number) => {
      const current = stateRef.current;
      if (index < 0 || index >= current.steps.length) {
        endTour(index >= current.steps.length);
        return;
      }
      const from = current.currentIndex;
      const fromStep = current.steps[from];
      const toStep = current.steps[index];
      const keepTarget = Boolean(
        fromStep && toStep && isSameTourTarget(fromStep, toStep) && current.targetRect,
      );
      current.config.onStepChange?.(from, index);
      events.emit("stepChange", { from, to: index });
      dispatch({ type: "GOTO", index, keepTarget });
    },
    [endTour, events],
  );

  const nextStep = useCallback(() => {
    const current = stateRef.current;
    const step = current.steps[current.currentIndex];
    step?.onNext?.();
    goToStep(current.currentIndex + 1);
  }, [goToStep]);

  const prevStep = useCallback(() => {
    const current = stateRef.current;
    const step = current.steps[current.currentIndex];
    step?.onPrev?.();
    goToStep(current.currentIndex - 1);
  }, [goToStep]);

  const skipTour = useCallback(() => {
    const current = stateRef.current;
    const step = current.steps[current.currentIndex];
    step?.onSkip?.();
    events.emit("skip", { atStep: current.currentIndex });
    endTour(false, true);
  }, [endTour, events]);

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
      const resolved = behavior ?? stateRef.current.config.defaultBackdropBehavior;
      if (resolved === "next") nextStep();
      if (resolved === "dismiss") skipTour();
    },
    [nextStep, skipTour],
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
      resetTour,
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
      resetTour,
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
