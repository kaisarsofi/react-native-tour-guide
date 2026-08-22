import { useTourGuideContext } from "../TourGuideContext";
import type { TourGuideConfig, TourStep } from "../types";

export function useTourGuide() {
  const ctx = useTourGuideContext();
  const { state } = ctx;
  const currentStep: TourStep | null = state.steps[state.currentIndex] ?? null;

  return {
    startTour: (steps: TourStep[], config?: TourGuideConfig) =>
      ctx.startTour(steps, config),
    nextStep: ctx.nextStep,
    prevStep: ctx.prevStep,
    goToStep: ctx.goToStep,
    skipTour: ctx.skipTour,
    endTour: ctx.endTour,
    pauseTour: ctx.pauseTour,
    resumeTour: ctx.resumeTour,
    isActive: state.isActive,
    isPaused: state.isPaused,
    currentStep,
    currentStepIndex: state.currentIndex,
    totalSteps: state.steps.length,
    tourId: state.config.tourId,
    events: ctx.events,
  };
}
