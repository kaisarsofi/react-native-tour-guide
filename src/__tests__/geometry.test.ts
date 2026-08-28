import type { RefObject } from "react";
import { Dimensions, type View } from "react-native";

import {
  computeOutsideSpotlightBands,
  computeTooltipLayout,
  measureSettledView,
  measureView,
  measureWindowRect,
  rectsEqual,
  resolveSpotlightPadding,
  resolveSpotlightShape,
  windowRectToHostRect,
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

describe("measureSettledView", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Drains the poll loop's `nextPaint`s and `setTimeout`s without pinning an
  // exact iteration count to it — see the identical helper in
  // `crossScreen.test.tsx` for why.
  async function drain() {
    for (let tick = 0; tick < 30; tick += 1) {
      jest.advanceTimersByTime(50);
      await Promise.resolve();
    }
  }

  it("waits out a target still mid-animation instead of locking onto its first position", async () => {
    // A view sliding into place: the first couple of measurements land
    // mid-slide, then it holds still. This is the exact shape of a
    // `<TourTarget>` that mounts because of the navigation a tour step just
    // triggered (a stack push, a drawer opening) — measuring once, on the
    // instant it registers, would capture one of the mid-slide positions
    // and never revisit it.
    const positions = [
      { x: 40, y: 200, width: 80, height: 40 },
      { x: 20, y: 200, width: 80, height: 40 },
      { x: 0, y: 200, width: 80, height: 40 },
      { x: 0, y: 200, width: 80, height: 40 },
    ];
    let call = 0;
    const ref = viewRef((cb) => {
      const pos = positions[Math.min(call, positions.length - 1)]!;
      call += 1;
      cb(pos.x, pos.y, pos.width, pos.height);
    });

    const result = measureSettledView(ref);
    await drain();

    await expect(result).resolves.toEqual({ x: 0, y: 200, width: 80, height: 40 });
    // It kept polling past the first (mid-slide) measurement rather than
    // resolving as soon as any single measurement came back.
    expect(call).toBeGreaterThan(1);
  });

  it("treats measurements within half a pixel of each other as settled", async () => {
    const positions = [
      { x: 10.2, y: 5, width: 80, height: 40 },
      { x: 10.6, y: 5, width: 80, height: 40 },
    ];
    let call = 0;
    const ref = viewRef((cb) => {
      const pos = positions[Math.min(call, positions.length - 1)]!;
      call += 1;
      cb(pos.x, pos.y, pos.width, pos.height);
    });

    const result = measureSettledView(ref);
    await drain();

    await expect(result).resolves.toEqual(positions[1]);
  });

  it("gives up and returns the last measurement if the target never stops moving", async () => {
    let call = 0;
    const ref = viewRef((cb) => {
      call += 1;
      cb(call, 0, 10, 10);
    });

    const result = measureSettledView(ref);
    await drain();

    const resolved = await result;
    expect(resolved).not.toBeNull();
    expect(resolved!.width).toBe(10);
  });

  it("resolves null when the ref is empty", async () => {
    const result = measureSettledView({ current: null });
    await drain();

    await expect(result).resolves.toBeNull();
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

describe("resolveSpotlightShape", () => {
  const defaults = { defaultRadius: 12, defaultPadding: 8 };

  it("falls back to the defaults when neither step nor target says", () => {
    expect(resolveSpotlightShape({ ...defaults })).toEqual({
      radius: 12,
      padding: { horizontal: 8, vertical: 8 },
    });
  });

  it("uses the target's shape when the step doesn't set one", () => {
    expect(
      resolveSpotlightShape({
        ...defaults,
        target: { spotlightBorderRadius: 999, spotlightPadding: 4 },
      }),
    ).toEqual({ radius: 999, padding: { horizontal: 4, vertical: 4 } });
  });

  it("lets the step override the target", () => {
    expect(
      resolveSpotlightShape({
        ...defaults,
        step: { spotlightBorderRadius: 2, spotlightPadding: 0 },
        target: { spotlightBorderRadius: 999, spotlightPadding: 4 },
      }),
    ).toEqual({ radius: 2, padding: { horizontal: 0, vertical: 0 } });
  });

  it("falls back per field, so a target can set only one of them", () => {
    expect(
      resolveSpotlightShape({ ...defaults, target: { spotlightBorderRadius: 999 } }),
    ).toEqual({ radius: 999, padding: { horizontal: 8, vertical: 8 } });

    expect(
      resolveSpotlightShape({ ...defaults, target: { spotlightPadding: 2 } }),
    ).toEqual({ radius: 12, padding: { horizontal: 2, vertical: 2 } });
  });

  it("mixes a step radius with a target padding", () => {
    expect(
      resolveSpotlightShape({
        ...defaults,
        step: { spotlightBorderRadius: 20 },
        target: { spotlightPadding: { horizontal: 0, vertical: 6 } },
      }),
    ).toEqual({ radius: 20, padding: { horizontal: 0, vertical: 6 } });
  });

  it("treats an explicit 0 as a real value, not a missing one", () => {
    expect(
      resolveSpotlightShape({
        ...defaults,
        step: { spotlightBorderRadius: 0, spotlightPadding: 0 },
        target: { spotlightBorderRadius: 999, spotlightPadding: 30 },
      }),
    ).toEqual({ radius: 0, padding: { horizontal: 0, vertical: 0 } });
  });
});

describe("windowRectToHostRect", () => {
  const rect = { x: 100, y: 200, width: 50, height: 40 };

  it("is a no-op when the host sits at the screen origin", () => {
    expect(windowRectToHostRect(rect, { x: 0, y: 0 })).toEqual(rect);
  });

  it("shifts a screen-space rect by the host's offset, size untouched", () => {
    // A host pushed down by a status bar / notch, and inset horizontally the
    // way an iPad max-width column centres it.
    expect(windowRectToHostRect(rect, { x: 24, y: 59 })).toEqual({
      x: 76,
      y: 141,
      width: 50,
      height: 40,
    });
  });
});

describe("measureWindowRect", () => {
  it("resolves null for a ref with nothing attached", async () => {
    await expect(measureWindowRect({ current: null })).resolves.toBeNull();
  });

  it("resolves null rather than hanging when measure never answers", async () => {
    jest.useFakeTimers();
    // A detached view: the platform takes the callback and never calls it.
    const ref = { current: { measure: () => {}, measureInWindow: () => {} } };

    const pending = measureWindowRect(ref as never);
    let settled: unknown = "unsettled";
    pending.then((value) => {
      settled = value;
    });

    await Promise.resolve();
    expect(settled).toBe("unsettled");

    jest.advanceTimersByTime(1000);
    await expect(pending).resolves.toBeNull();
    jest.useRealTimers();
  });
});
