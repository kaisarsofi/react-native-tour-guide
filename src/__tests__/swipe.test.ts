import {
  DEFAULT_SWIPE_COUNT,
  createDragFrameScheduler,
  dragScrollHandle,
  isSameTourTarget,
  isTooltipHidden,
  resolveCountedSwipe,
  resolveSwipeCount,
  resolveSwipeGesture,
  resolveTourScrollHandle,
  snapScrollToProgress,
  snapScrollToStep,
} from "../utils/swipe";
import { makeStep } from "./helpers";
import type { TourScrollHandle } from "../types";

describe("resolveSwipeGesture", () => {
  it("treats a swipe in the hinted direction as next", () => {
    expect(resolveSwipeGesture("up", 0, -80)).toBe("next");
    expect(resolveSwipeGesture("down", 0, 80)).toBe("next");
    expect(resolveSwipeGesture("left", -80, 0)).toBe("next");
    expect(resolveSwipeGesture("right", 80, 0)).toBe("next");
  });

  it("treats the opposite swipe as prev", () => {
    expect(resolveSwipeGesture("up", 0, 80)).toBe("prev");
    expect(resolveSwipeGesture("left", 80, 0)).toBe("prev");
  });

  it("ignores short or mostly-perpendicular pans", () => {
    expect(resolveSwipeGesture("up", 0, -20)).toBeNull();
    expect(resolveSwipeGesture("up", 90, -30)).toBeNull();
  });
});

describe("isTooltipHidden", () => {
  it("hides the tooltip by default on a swipe-hint step", () => {
    expect(isTooltipHidden(makeStep({ swipeHint: "left" }))).toBe(true);
  });

  it("keeps the tooltip when hideTooltip is false", () => {
    expect(isTooltipHidden(makeStep({ swipeHint: "left", hideTooltip: false }))).toBe(
      false,
    );
  });

  it("hides a normal step when hideTooltip is true", () => {
    expect(isTooltipHidden(makeStep({ hideTooltip: true }))).toBe(true);
  });

  it("shows the tooltip on a step with no swipe hint", () => {
    expect(isTooltipHidden(makeStep())).toBe(false);
  });
});

function makeHandle(
  node: {
    scrollTo?: (opts: { x?: number; y?: number; animated?: boolean }) => void;
    scrollToIndex?: (opts: {
      index: number;
      animated?: boolean;
      viewPosition?: number;
    }) => void;
  },
  offset = { x: 0, y: 0 },
  horizontal = false,
  pagingEnabled = false,
): TourScrollHandle {
  return {
    ref: { current: node },
    offsetRef: { current: { ...offset } },
    horizontal,
    pagingEnabled,
  };
}

describe("resolveTourScrollHandle", () => {
  it("uses a later step's handle when the current step has none", () => {
    const handle = makeHandle({});
    const steps = [
      makeStep({ id: "a", swipeHint: "up" }),
      makeStep({ id: "b", scroll: { handle } }),
    ];

    expect(resolveTourScrollHandle(steps, 0)).toBe(handle);
  });
});

describe("dragScrollHandle", () => {
  it("scrolls a vertical list up as the finger moves up", () => {
    const scrollTo = jest.fn();
    const handle = makeHandle({ scrollTo }, { x: 0, y: 40 }, false);

    dragScrollHandle(handle, { x: 0, y: 40 }, 0, -80);

    expect(scrollTo).toHaveBeenCalledWith({ y: 120, animated: false });
    expect(handle.offsetRef.current.y).toBe(120);
  });

  it("scrolls a horizontal list left as the finger moves left", () => {
    const scrollTo = jest.fn();
    const handle = makeHandle({ scrollTo }, { x: 10, y: 0 }, true);

    dragScrollHandle(handle, { x: 10, y: 0 }, -50, 0);

    expect(scrollTo).toHaveBeenCalledWith({ x: 60, animated: false });
  });
});

describe("isSameTourTarget", () => {
  it("matches steps that share a targetId", () => {
    expect(
      isSameTourTarget(
        makeStep({ targetId: "pager" }),
        makeStep({ id: "b", targetId: "pager" }),
      ),
    ).toBe(true);
  });

  it("does not match different targets", () => {
    expect(
      isSameTourTarget(
        makeStep({ targetId: "a" }),
        makeStep({ id: "b", targetId: "b" }),
      ),
    ).toBe(false);
  });
});

describe("snapScrollToStep", () => {
  it("scrolls to the step's index", () => {
    const scrollToIndex = jest.fn();
    const handle = makeHandle({ scrollToIndex });
    snapScrollToStep(makeStep({ scroll: { handle, index: 2, viewPosition: 0 } }));
    expect(scrollToIndex).toHaveBeenCalledWith({
      index: 2,
      animated: true,
      viewPosition: 0,
    });
  });

  it("no-ops when the step has no index", () => {
    const scrollToIndex = jest.fn();
    snapScrollToStep(makeStep({ scroll: { handle: makeHandle({ scrollToIndex }) } }));
    expect(scrollToIndex).not.toHaveBeenCalled();
  });
});

describe("resolveSwipeCount", () => {
  it("defaults to 3 on a swipe-hint step", () => {
    expect(resolveSwipeCount(makeStep({ swipeHint: "left" }))).toBe(
      DEFAULT_SWIPE_COUNT,
    );
  });

  it("honours a per-step override", () => {
    expect(resolveSwipeCount(makeStep({ swipeHint: "left", swipeCount: 5 }))).toBe(5);
  });

  it("honours the tour config when the step has no override", () => {
    expect(resolveSwipeCount(makeStep({ swipeHint: "up" }), 2)).toBe(2);
  });

  it("falls back to 3 when swipeCount is not a finite positive number", () => {
    expect(
      resolveSwipeCount(makeStep({ swipeHint: "left", swipeCount: Number.NaN })),
    ).toBe(DEFAULT_SWIPE_COUNT);
    expect(resolveSwipeCount(makeStep({ swipeHint: "left", swipeCount: 0 }))).toBe(
      DEFAULT_SWIPE_COUNT,
    );
    expect(
      resolveSwipeCount(makeStep({ swipeHint: "left" }), Number.POSITIVE_INFINITY),
    ).toBe(DEFAULT_SWIPE_COUNT);
  });
});

describe("resolveCountedSwipe", () => {
  it("keeps the step until the last swipe", () => {
    expect(resolveCountedSwipe(0, 3, "next", false)).toEqual({
      progress: 1,
      action: "scroll",
    });
    expect(resolveCountedSwipe(1, 3, "next", false)).toEqual({
      progress: 2,
      action: "scroll",
    });
    expect(resolveCountedSwipe(2, 3, "next", false)).toEqual({
      progress: 2,
      action: "complete",
    });
  });

  it("does not end the tour when swiping back on the first page", () => {
    expect(resolveCountedSwipe(0, 3, "prev", false)).toEqual({
      progress: 0,
      action: "idle",
    });
  });

  it("rewinds to the previous step only when one exists", () => {
    expect(resolveCountedSwipe(0, 3, "prev", true)).toEqual({
      progress: 0,
      action: "rewind",
    });
    expect(resolveCountedSwipe(1, 3, "prev", true)).toEqual({
      progress: 0,
      action: "scroll",
    });
  });
});

describe("createDragFrameScheduler", () => {
  it("applies only the latest delta when flushed", () => {
    const apply = jest.fn();
    const scheduler = createDragFrameScheduler(apply);

    scheduler.move(4, 0);
    scheduler.move(12, -3);
    scheduler.flush();

    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith(12, -3);
  });

  it("does not apply a cancelled frame", () => {
    const apply = jest.fn();
    const scheduler = createDragFrameScheduler(apply);

    scheduler.move(8, 0);
    scheduler.cancel();
    scheduler.flush();

    expect(apply).not.toHaveBeenCalled();
  });
});

describe("snapScrollToProgress", () => {
  it("pages by start index plus progress", () => {
    const scrollToIndex = jest.fn();
    const handle = makeHandle({ scrollToIndex });
    snapScrollToProgress(
      makeStep({ scroll: { handle, index: 0, viewPosition: 0 } }),
      2,
      { x: 0, y: 0 },
    );
    expect(scrollToIndex).toHaveBeenCalledWith({
      index: 2,
      animated: true,
      viewPosition: 0,
    });
  });

  it("scrolls a non-paging list by pageSize", () => {
    const scrollTo = jest.fn();
    const handle = makeHandle({ scrollTo }, { x: 0, y: 10 });
    snapScrollToProgress(makeStep({ scroll: { handle, pageSize: 192 } }), 1, {
      x: 0,
      y: 10,
    });
    expect(scrollTo).toHaveBeenCalledWith({ y: 202, animated: true });
  });
});
