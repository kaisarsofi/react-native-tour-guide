import type { RefObject } from "react";
import type { View } from "react-native";

import type { ScrollableNode, TourScrollHandle } from "../types";
import {
  computeScrollOffset,
  measurableScrollNode,
  scrollNodeToIndex,
  scrollNodeToOffset,
  scrollStepIntoView,
} from "../utils/scroll";

const container = { x: 0, y: 100, width: 400, height: 500 };

describe("computeScrollOffset", () => {
  it("returns null when the target is already comfortably visible", () => {
    expect(
      computeScrollOffset({
        container,
        target: { x: 0, y: 250, width: 400, height: 60 },
        currentOffset: 0,
        horizontal: false,
      }),
    ).toBeNull();
  });

  it("scrolls up when the target sits above the viewport", () => {
    // Target starts at y=110, needs to clear container.y + padding = 124.
    expect(
      computeScrollOffset({
        container,
        target: { x: 0, y: 110, width: 400, height: 60 },
        currentOffset: 300,
        horizontal: false,
        padding: 24,
      }),
    ).toBe(286);
  });

  it("scrolls down when the target sits below the viewport", () => {
    // Target ends at y=640, must clear container bottom - padding = 576.
    expect(
      computeScrollOffset({
        container,
        target: { x: 0, y: 580, width: 400, height: 60 },
        currentOffset: 0,
        horizontal: false,
        padding: 24,
      }),
    ).toBe(64);
  });

  it("never returns a negative offset", () => {
    expect(
      computeScrollOffset({
        container,
        target: { x: 0, y: -200, width: 400, height: 60 },
        currentOffset: 0,
        horizontal: false,
      }),
    ).toBe(0);
  });

  it("works on the horizontal axis", () => {
    const row = { x: 0, y: 0, width: 400, height: 200 };
    expect(
      computeScrollOffset({
        container: row,
        target: { x: 500, y: 0, width: 120, height: 200 },
        currentOffset: 0,
        horizontal: true,
        padding: 20,
      }),
    ).toBe(240);
  });

  it("centres a target too large to fit with padding on both sides", () => {
    // A 480px row in a 500px viewport can't satisfy 24px padding either side,
    // so it gets centred instead: 300px down, less the 10px of slack.
    expect(
      computeScrollOffset({
        container,
        target: { x: 0, y: 400, width: 400, height: 480 },
        currentOffset: 0,
        horizontal: false,
        padding: 24,
      }),
    ).toBe(290);
  });

  it("clamps the centring fallback at the top of the list", () => {
    expect(
      computeScrollOffset({
        container,
        target: { x: 0, y: 100, width: 400, height: 480 },
        currentOffset: 0,
        horizontal: false,
        padding: 24,
      }),
    ).toBe(0);
  });
});

describe("measurableScrollNode", () => {
  it("returns null for a null node", () => {
    expect(measurableScrollNode(null)).toBeNull();
  });

  it("unwraps a FlatList-style node via getNativeScrollRef", () => {
    const inner = { measureInWindow: jest.fn() };
    const node = { getNativeScrollRef: () => inner } as unknown as ScrollableNode;

    expect(measurableScrollNode(node)).toBe(inner);
  });

  it("uses a ScrollView-style node directly", () => {
    const node = { measureInWindow: jest.fn() } as unknown as ScrollableNode;

    expect(measurableScrollNode(node)).toBe(node);
  });

  it("returns null when nothing on the node is measurable", () => {
    expect(measurableScrollNode({} as ScrollableNode)).toBeNull();
  });
});

describe("scrollNodeToOffset", () => {
  it("prefers scrollToOffset (FlatList)", () => {
    const scrollToOffset = jest.fn();
    const node = { scrollToOffset } as unknown as ScrollableNode;

    expect(scrollNodeToOffset(node, 120, false)).toBe(true);
    expect(scrollToOffset).toHaveBeenCalledWith({ offset: 120, animated: true });
  });

  it("falls back to scrollTo with the right axis (ScrollView)", () => {
    const scrollTo = jest.fn();
    const node = { scrollTo } as unknown as ScrollableNode;

    scrollNodeToOffset(node, 120, false);
    expect(scrollTo).toHaveBeenCalledWith({ y: 120, animated: true });

    scrollNodeToOffset(node, 80, true);
    expect(scrollTo).toHaveBeenCalledWith({ x: 80, animated: true });

    scrollNodeToOffset(node, 40, false, false);
    expect(scrollTo).toHaveBeenCalledWith({ y: 40, animated: false });
  });

  it("reports failure when the node can't scroll", () => {
    expect(scrollNodeToOffset({} as ScrollableNode, 10, false)).toBe(false);
  });
});

describe("scrollNodeToIndex", () => {
  it("forwards index and viewPosition", () => {
    const scrollToIndex = jest.fn();
    const node = { scrollToIndex } as unknown as ScrollableNode;

    expect(scrollNodeToIndex(node, 7, 0.5)).toBe(true);
    expect(scrollToIndex).toHaveBeenCalledWith({
      index: 7,
      animated: true,
      viewPosition: 0.5,
    });
  });

  it("reports failure when the node has no scrollToIndex", () => {
    expect(scrollNodeToIndex({} as ScrollableNode, 1, 0)).toBe(false);
  });
});

function measurableRef(rect: { x: number; y: number; width: number; height: number }) {
  return {
    current: {
      measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) =>
        cb(rect.x, rect.y, rect.width, rect.height),
    },
  } as unknown as RefObject<View | null>;
}

function makeHandle(
  node: ScrollableNode,
  offset = { x: 0, y: 0 },
  horizontal = false,
): TourScrollHandle {
  return {
    ref: { current: node },
    offsetRef: { current: offset },
    horizontal,
  } as TourScrollHandle;
}

describe("scrollStepIntoView", () => {
  it("uses scrollToIndex when an index is given", async () => {
    const scrollToIndex = jest.fn();
    const handle = makeHandle({ scrollToIndex } as unknown as ScrollableNode);

    await scrollStepIntoView(
      { handle, index: 4, viewPosition: 0, settleDelay: 0 },
      undefined,
    );

    expect(scrollToIndex).toHaveBeenCalledWith({
      index: 4,
      animated: true,
      viewPosition: 0,
    });
  });

  it("computes and dispatches an offset for an off-screen target", async () => {
    const scrollToOffset = jest.fn();
    const node = {
      scrollToOffset,
      measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) =>
        cb(0, 100, 400, 500),
    } as unknown as ScrollableNode;

    await scrollStepIntoView(
      { handle: makeHandle(node), settleDelay: 0, padding: 24 },
      measurableRef({ x: 0, y: 580, width: 400, height: 60 }),
    );

    expect(scrollToOffset).toHaveBeenCalledWith({ offset: 64, animated: true });
  });

  it("does not scroll when the target is already visible", async () => {
    const scrollToOffset = jest.fn();
    const node = {
      scrollToOffset,
      measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) =>
        cb(0, 100, 400, 500),
    } as unknown as ScrollableNode;

    await scrollStepIntoView(
      { handle: makeHandle(node), settleDelay: 0 },
      measurableRef({ x: 0, y: 250, width: 400, height: 60 }),
    );

    expect(scrollToOffset).not.toHaveBeenCalled();
  });

  it("no-ops when the list ref is empty", async () => {
    const handle = { ...makeHandle({} as ScrollableNode) };
    handle.ref = { current: null } as TourScrollHandle["ref"];

    await expect(
      scrollStepIntoView({ handle, settleDelay: 0 }, undefined),
    ).resolves.toBeUndefined();
  });

  it("no-ops when the target ref is empty", async () => {
    const scrollToOffset = jest.fn();
    const node = {
      scrollToOffset,
      measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) =>
        cb(0, 100, 400, 500),
    } as unknown as ScrollableNode;

    await scrollStepIntoView({ handle: makeHandle(node), settleDelay: 0 }, {
      current: null,
    } as RefObject<View | null>);

    expect(scrollToOffset).not.toHaveBeenCalled();
  });
});
