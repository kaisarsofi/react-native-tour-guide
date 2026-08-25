import { useMemo } from "react";

import { useTourGuideContext } from "../TourGuideContext";
import type { TourStep } from "../types";

/**
 * All the action functions below (`startTour`, `nextStep`, ...) are already
 * stable identities from the context — it wraps them in `useCallback` once
 * and never rebuilds them. We return them as-is (never re-wrapped in a new
 * arrow function here) so a consumer can safely put any of them in a
 * `useEffect` dependency array without triggering a restart loop.
 */
export function useTourGuide() {
  const ctx = useTourGuideContext();
  const { state } = ctx;
  const currentStep: TourStep | null = state.steps[state.currentIndex] ?? null;

  return useMemo(
    () => ({
      startTour: ctx.startTour,
      nextStep: ctx.nextStep,
      prevStep: ctx.prevStep,
      goToStep: ctx.goToStep,
      skipTour: ctx.skipTour,
      endTour: ctx.endTour,
      pauseTour: ctx.pauseTour,
      resumeTour: ctx.resumeTour,
      resetTour: ctx.resetTour,
      isActive: state.isActive,
      isPaused: state.isPaused,
      currentStep,
      currentStepIndex: state.currentIndex,
      totalSteps: state.steps.length,
      tourId: state.config.tourId,
      events: ctx.events,
    }),
    [ctx, state, currentStep],
  );
}
