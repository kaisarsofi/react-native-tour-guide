import type { RefObject } from "react";
import { Dimensions, type View } from "react-native";

import {
  computeTooltipLayout,
  measureView,
  padRect,
  rectsEqual,
} from "../utils/geometry";

function viewRef(
  measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void,
): RefObject<View | null> {
  return { current: { measureInWindow } } as RefObject<View | null>;
}

function pageRef(
  x: number,
  y: number,
  width: number,
  height: number,
): RefObject<View | null> {
  return {
    current: {
      measure: (
        cb: (
          mx: number,
          my: number,
          w: number,
          h: number,
          px: number,
          py: number,
        ) => void,
      ) => cb(0, 0, width, height, x, y),
      measureInWindow: (cb: (mx: number, my: number, w: number, h: number) => void) =>
        cb(x, y, width, height),
    },
  } as RefObject<View | null>;
}

describe("padRect", () => {
  it("expands a rect equally on every side", () => {
    expect(padRect({ x: 10, y: 20, width: 100, height: 40 }, 8)).toEqual({
      x: 2,
      y: 12,
      width: 116,
      height: 56,
    });
  });

  it("returns the original geometry when padding is 0", () => {
    const rect = { x: 4, y: 8, width: 16, height: 24 };
    expect(padRect(rect, 0)).toEqual(rect);
  });
});

describe("rectsEqual", () => {
  it("treats identical geometry as equal even across objects", () => {
    expect(
      rectsEqual(
        { x: 1, y: 2, width: 3, height: 4 },
        { x: 1, y: 2, width: 3, height: 4 },
      ),
    ).toBe(true);
  });

  it("returns false when any edge differs", () => {
    expect(
      rectsEqual(
        { x: 1, y: 2, width: 3, height: 4 },
        { x: 1, y: 2, width: 3, height: 5 },
      ),
    ).toBe(false);
  });
});

describe("measureView", () => {
  it("resolves null when the ref is empty", async () => {
    await expect(measureView({ current: null })).resolves.toBeNull();
  });

  it("resolves the window rect for a measurable node", async () => {
    const ref = viewRef((cb) => cb(12, 24, 80, 40));

    await expect(measureView(ref)).resolves.toEqual({
      x: 12,
      y: 24,
      width: 80,
      height: 40,
    });
  });

  it("resolves null when the node measures 0x0", async () => {
    const ref = viewRef((cb) => cb(0, 0, 0, 0));

    await expect(measureView(ref)).resolves.toBeNull();
  });

  it("resolves null when a host-relative node measures 0x0", async () => {
    const target = pageRef(0, 0, 0, 0);
    const host = pageRef(0, 59, 400, 800);

    await expect(measureView(target, host)).resolves.toBeNull();
  });

  it("subtracts the overlay host origin so the hole is in overlay space", async () => {
    const target = pageRef(40, 180, 80, 40);
    const host = pageRef(0, 59, 400, 800);

    await expect(measureView(target, host)).resolves.toEqual({
      x: 40,
      y: 121,
      width: 80,
      height: 40,
    });
  });
});

describe("computeTooltipLayout", () => {
  const tooltipSize = { width: 200, height: 80 };

  beforeEach(() => {
    jest.spyOn(Dimensions, "get").mockReturnValue({
      width: 400,
      height: 800,
      scale: 2,
      fontScale: 1,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("places the tooltip below the target when auto and there is room", () => {
    const layout = computeTooltipLayout(
      { x: 100, y: 100, width: 80, height: 40 },
      tooltipSize,
      "auto",
    );

    expect(layout.placement).toBe("bottom");
    expect(layout.y).toBe(152);
    expect(layout.x).toBe(40);
    expect(layout.arrowOffset).toBe(100);
  });

  it("honours an explicit placement that fits", () => {
    const layout = computeTooltipLayout(
      { x: 100, y: 200, width: 80, height: 40 },
      tooltipSize,
      "top",
    );

    expect(layout.placement).toBe("top");
    expect(layout.y).toBe(108);
  });

  it("flips to the side with room when the preferred side does not fit", () => {
    const layout = computeTooltipLayout(
      { x: 20, y: 10, width: 60, height: 40 },
      tooltipSize,
      "top",
    );

    expect(layout.placement).toBe("bottom");
  });

  it("uses the right side when the target is a tall left-edge strip", () => {
    const layout = computeTooltipLayout(
      { x: 0, y: 80, width: 40, height: 640 },
      tooltipSize,
      "auto",
    );

    expect(layout.placement).toBe("right");
  });

  it("uses the left side when the target is a tall right-edge strip", () => {
    const layout = computeTooltipLayout(
      { x: 360, y: 80, width: 40, height: 640 },
      tooltipSize,
      "auto",
    );

    expect(layout.placement).toBe("left");
  });

  it("clamps the tooltip to the screen margin", () => {
    const layout = computeTooltipLayout(
      { x: 0, y: 100, width: 20, height: 20 },
      tooltipSize,
      "bottom",
    );

    expect(layout.x).toBe(16);
    expect(layout.arrowOffset).toBe(-6);
  });
});
