import type { RefObject } from "react";
import { Dimensions, type View } from "react-native";

import {
  computeOutsideSpotlightBands,
  computeTooltipLayout,
  measureView,
  rectsEqual,
  resolveSpotlightPadding,
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

describe("resolveSpotlightPadding", () => {
  it("falls back to the same value on both axes when unset", () => {
    expect(resolveSpotlightPadding(undefined, 8)).toEqual({
      horizontal: 8,
      vertical: 8,
    });
  });

  it("applies a plain number to both axes equally", () => {
    expect(resolveSpotlightPadding(12, 8)).toEqual({ horizontal: 12, vertical: 12 });
  });

  it("honours independent horizontal/vertical overrides", () => {
    expect(resolveSpotlightPadding({ horizontal: 0, vertical: 20 }, 8)).toEqual({
      horizontal: 0,
      vertical: 20,
    });
  });

  it("falls back per-axis when only one side of the object is set", () => {
    expect(resolveSpotlightPadding({ vertical: 20 }, 8)).toEqual({
      horizontal: 8,
      vertical: 20,
    });
    expect(resolveSpotlightPadding({ horizontal: 0 }, 8)).toEqual({
      horizontal: 0,
      vertical: 8,
    });
  });

  it("allows a negative value to inset the spotlight instead of padding it", () => {
    expect(resolveSpotlightPadding(-8, 8)).toEqual({ horizontal: -8, vertical: -8 });
  });
});

describe("computeOutsideSpotlightBands", () => {
  const screenWidth = 400;
  const screenHeight = 800;

  it("produces four bands for a hole with room on every side", () => {
    const hole = { x: 100, y: 200, width: 100, height: 100 };
    const bands = computeOutsideSpotlightBands(hole, screenWidth, screenHeight);

    expect(bands).toEqual([
      { x: 0, y: 0, width: 400, height: 200 }, // top
      { x: 0, y: 300, width: 400, height: 500 }, // bottom
      { x: 0, y: 200, width: 100, height: 100 }, // left
      { x: 200, y: 200, width: 200, height: 100 }, // right
    ]);
  });

  it("together with the hole, the bands exactly tile the screen with no gap or overlap", () => {
    const hole = { x: 137, y: 264, width: 91, height: 58 };
    const bands = computeOutsideSpotlightBands(hole, screenWidth, screenHeight);
    const totalArea = bands.reduce((sum, b) => sum + b.width * b.height, 0);
    const holeArea = hole.width * hole.height;

    expect(totalArea + holeArea).toBe(screenWidth * screenHeight);
  });

  it("omits the top band when the hole is flush against the top edge", () => {
    const hole = { x: 50, y: 0, width: 100, height: 100 };
    const bands = computeOutsideSpotlightBands(hole, screenWidth, screenHeight);

    expect(bands).toEqual([
      { x: 0, y: 100, width: 400, height: 700 }, // bottom
      { x: 0, y: 0, width: 50, height: 100 }, // left
      { x: 150, y: 0, width: 250, height: 100 }, // right
    ]);
  });

  it("omits the left/right bands when the hole spans the full width", () => {
    const hole = { x: 0, y: 300, width: screenWidth, height: 100 };
    const bands = computeOutsideSpotlightBands(hole, screenWidth, screenHeight);

    expect(bands).toEqual([
      { x: 0, y: 0, width: 400, height: 300 },
      { x: 0, y: 400, width: 400, height: 400 },
    ]);
  });

  it("produces no bands when the hole covers the whole screen", () => {
    const hole = { x: 0, y: 0, width: screenWidth, height: screenHeight };
    expect(computeOutsideSpotlightBands(hole, screenWidth, screenHeight)).toEqual([]);
  });

  it("clamps a hole that extends past the screen edges", () => {
    const hole = { x: -20, y: -20, width: 100, height: 100 };
    const bands = computeOutsideSpotlightBands(hole, screenWidth, screenHeight);

    // No top or left band — the hole's clamped edges are already at 0.
    expect(bands).toEqual([
      { x: 0, y: 80, width: 400, height: 720 }, // bottom
      { x: 80, y: 0, width: 320, height: 80 }, // right
    ]);
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
