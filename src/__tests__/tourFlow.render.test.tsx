import { fireEvent, screen } from "@testing-library/react-native";

import { makeStep, makeSteps, renderTour } from "./helpers";

describe("tour flow", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("fires onTourStart when the tour begins", async () => {
    const onTourStart = jest.fn();
    await renderTour().start(makeSteps(2), { onTourStart });

    expect(onTourStart).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Title 1")).toBeTruthy();
  });

  it("advances through steps from the tooltip", async () => {
    const onStepChange = jest.fn();
    await renderTour().start(makeSteps(2), { onStepChange });

    fireEvent.press(screen.getByText("Next"));

    expect(onStepChange).toHaveBeenCalledWith(0, 1);
    expect(await screen.findByText("Title 2")).toBeTruthy();
    expect(screen.getByText("Done")).toBeTruthy();
  });

  it("calls onTourEnd(true) after Done on the last step", async () => {
    const onTourEnd = jest.fn();
    await renderTour().start(makeSteps(1), { onTourEnd });

    fireEvent.press(screen.getByText("Done"));

    expect(onTourEnd).toHaveBeenCalledWith(true);
  });

  it("calls onTourEnd(false) and the step onSkip when skipped", async () => {
    const onTourEnd = jest.fn();
    const onSkip = jest.fn();
    await renderTour().start([{ ...makeSteps(2)[0]!, onSkip }, makeSteps(2)[1]!], {
      onTourEnd,
    });

    fireEvent.press(screen.getByText("Skip"));

    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onTourEnd).toHaveBeenCalledWith(false);
  });

  it("skips inactive steps", async () => {
    await renderTour().start(
      makeSteps(3).map((step, index) =>
        index === 1 ? { ...step, active: false } : step,
      ),
    );

    expect(screen.getByText("1 of 2")).toBeTruthy();
    fireEvent.press(screen.getByText("Next"));
    expect(await screen.findByText("Title 3")).toBeTruthy();
    expect(screen.getByText("2 of 2")).toBeTruthy();
  });

  it("auto-advances after the configured delay", async () => {
    const onStepChange = jest.fn();
    const tour = renderTour();
    await tour.start(
      [
        makeStep({ id: "a", title: "First", autoAdvance: 1000 }),
        makeStep({ id: "b", title: "Second" }),
      ],
      { onStepChange },
    );

    await tour.flush(1000);

    expect(onStepChange).toHaveBeenCalledWith(0, 1);
    expect(screen.getByText("Second")).toBeTruthy();
  });

  it("ends the tour when the last step auto-advances", async () => {
    const onTourEnd = jest.fn();
    const tour = renderTour();
    await tour.start(
      [
        makeStep({ id: "a", title: "First", autoAdvance: 1000 }),
        makeStep({ id: "b", title: "Second", autoAdvance: 1000 }),
      ],
      { onTourEnd },
    );

    await tour.flush(1000);
    expect(screen.getByText("Second")).toBeTruthy();

    await tour.flush(1000);
    expect(onTourEnd).toHaveBeenCalledWith(true);
    expect(screen.queryByText("Second")).toBeNull();
  });

  it("awaits before and delayBefore before showing the next measure", async () => {
    const before = jest.fn(async () => undefined);
    const tour = renderTour();
    await tour.start([makeStep({ before, delayBefore: 250 })]);

    expect(before).toHaveBeenCalledTimes(1);
    await tour.flush(250);
    expect(screen.getByText("Hello")).toBeTruthy();
  });

  it("invokes per-step next and prev callbacks", async () => {
    const onNext = jest.fn();
    const onPrev = jest.fn();
    await renderTour().start([
      makeStep({ id: "a", title: "First", onNext }),
      makeStep({ id: "b", title: "Second", onPrev }),
    ]);

    fireEvent.press(screen.getByText("Next"));
    expect(onNext).toHaveBeenCalledTimes(1);

    fireEvent.press(await screen.findByText("Back"));
    expect(onPrev).toHaveBeenCalledTimes(1);
  });
});
