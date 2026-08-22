import { createTourEventEmitter } from "../utils/eventEmitter";

describe("createTourEventEmitter", () => {
  it("delivers payloads to subscribers", () => {
    const events = createTourEventEmitter();
    const onStart = jest.fn();

    events.on("start", onStart);
    events.emit("start", { steps: [] });

    expect(onStart).toHaveBeenCalledWith({ steps: [] });
  });

  it("stops notifying a handler after unsubscribe", () => {
    const events = createTourEventEmitter();
    const onSkip = jest.fn();
    const unsubscribe = events.on("skip", onSkip);

    unsubscribe();
    events.emit("skip", { atStep: 1 });

    expect(onSkip).not.toHaveBeenCalled();
  });

  it("notifies every listener of the same event", () => {
    const events = createTourEventEmitter();
    const first = jest.fn();
    const second = jest.fn();

    events.on("pause", first);
    events.on("pause", second);
    events.emit("pause", undefined);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });
});
