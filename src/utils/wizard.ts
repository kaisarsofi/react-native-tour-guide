import type { TourStep } from "../types";

/** How many Next presses a wizard tour takes before Prev. */
export const DEFAULT_WIZARD_NEXT_COUNT = 2;

/** How many Prev presses follow Next. Clamped so it cannot exceed Next. */
export const DEFAULT_WIZARD_PREV_COUNT = 1;

export interface WizardTourCounts {
  next: number;
  prev: number;
}

export interface CreateWizardTourStepsOptions {
  nextTargetId: string;
  prevTargetId: string;
  /**
   * How many times the Next control is pressed. Default 2. Invalid values
   * fall back to the default.
   */
  nextCount?: number;
  /**
   * How many times Prev is pressed after Next. Default 1. Clamped to
   * `nextCount` so you cannot rewind further than you advanced (Next 2 and
   * Prev 3 becomes Next 2, Prev 2).
   */
  prevCount?: number;
  onNext: () => void;
  onPrev: () => void;
  nextStep: () => void;
  spotlightBorderRadius?: number;
}

function normalizeCount(value: number | undefined, fallback: number): number {
  if (value == null || !Number.isFinite(value) || value < 0) return fallback;
  return Math.floor(value);
}

/**
 * Resolve Next/Prev press counts for a wizard tour. Prev is never larger
 * than Next — going back 3 after only 2 forwards is clamped to 2.
 */
export function resolveWizardTourCounts(
  nextCount?: number,
  prevCount?: number,
): WizardTourCounts {
  const next = normalizeCount(nextCount, DEFAULT_WIZARD_NEXT_COUNT);
  const prev = Math.min(normalizeCount(prevCount, DEFAULT_WIZARD_PREV_COUNT), next);
  return { next, prev };
}

/**
 * Build spotlight steps for a Prev/Next carousel: press Next `nextCount`
 * times, then Prev `prevCount` times, then the last press closes the tour.
 */
export function createWizardTourSteps(
  options: CreateWizardTourStepsOptions,
): TourStep[] {
  const { next, prev } = resolveWizardTourCounts(options.nextCount, options.prevCount);
  const total = next + prev;
  const radius = options.spotlightBorderRadius ?? 16;
  const steps: TourStep[] = [];

  for (let index = 0; index < next; index += 1) {
    const isLast = steps.length === total - 1;
    steps.push({
      id: `wizard-next-${index}`,
      targetId: options.nextTargetId,
      title: "Press Next to continue",
      description: isLast
        ? "Tap Next — this advances the slide and closes the tour."
        : "Tap the real Next button — it advances the slide and the tour together.",
      hideNextButton: true,
      spotlightBorderRadius: radius,
      onSpotlightPress: () => {
        options.onNext();
        options.nextStep();
      },
    });
  }

  for (let index = 0; index < prev; index += 1) {
    const isLast = steps.length === total - 1;
    steps.push({
      id: `wizard-prev-${index}`,
      targetId: options.prevTargetId,
      title: "And back again",
      description: isLast
        ? "Tap Prev — this rewinds the slide and closes the tour."
        : "Tap Prev — the slide and the tour rewind together.",
      hideNextButton: true,
      spotlightBorderRadius: radius,
      onSpotlightPress: () => {
        options.onPrev();
        options.nextStep();
      },
    });
  }

  return steps;
}
