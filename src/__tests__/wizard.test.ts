import {
  DEFAULT_WIZARD_NEXT_COUNT,
  DEFAULT_WIZARD_PREV_COUNT,
  createWizardTourSteps,
  resolveWizardTourCounts,
} from "../utils/wizard";

describe("resolveWizardTourCounts", () => {
  it("defaults to next 2, then prev 1", () => {
    expect(resolveWizardTourCounts()).toEqual({
      next: DEFAULT_WIZARD_NEXT_COUNT,
      prev: DEFAULT_WIZARD_PREV_COUNT,
    });
  });

  it("keeps an explicit next/prev pair when prev does not exceed next", () => {
    expect(resolveWizardTourCounts(3, 2)).toEqual({ next: 3, prev: 2 });
  });

  it("clamps prev so it cannot rewind further than next advanced", () => {
    expect(resolveWizardTourCounts(2, 3)).toEqual({ next: 2, prev: 2 });
    expect(resolveWizardTourCounts(0, 4)).toEqual({ next: 0, prev: 0 });
  });

  it("falls back to defaults for invalid counts", () => {
    expect(resolveWizardTourCounts(Number.NaN, -1)).toEqual({
      next: DEFAULT_WIZARD_NEXT_COUNT,
      prev: DEFAULT_WIZARD_PREV_COUNT,
    });
  });

  it("allows prev 0 so the tour can close after Next only", () => {
    expect(resolveWizardTourCounts(2, 0)).toEqual({ next: 2, prev: 0 });
  });
});

describe("createWizardTourSteps", () => {
  const nextStep = jest.fn();
  const onNext = jest.fn();
  const onPrev = jest.fn();

  beforeEach(() => {
    nextStep.mockClear();
    onNext.mockClear();
    onPrev.mockClear();
  });

  function options(over: Partial<Parameters<typeof createWizardTourSteps>[0]> = {}) {
    return {
      nextTargetId: "wizard-next",
      prevTargetId: "wizard-prev",
      onNext,
      onPrev,
      nextStep,
      ...over,
    };
  }

  it("builds next steps then prev steps, last press closes via nextStep", () => {
    const steps = createWizardTourSteps(options());

    expect(steps.map((step) => step.targetId)).toEqual([
      "wizard-next",
      "wizard-next",
      "wizard-prev",
    ]);

    steps[0]?.onSpotlightPress?.();
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(nextStep).toHaveBeenCalledTimes(1);

    steps[2]?.onSpotlightPress?.();
    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(nextStep).toHaveBeenCalledTimes(2);
  });

  it("clamps an overlapping prev count when building steps", () => {
    const steps = createWizardTourSteps(options({ nextCount: 2, prevCount: 5 }));

    expect(steps).toHaveLength(4);
    expect(steps.filter((step) => step.targetId === "wizard-prev")).toHaveLength(2);
  });
});
