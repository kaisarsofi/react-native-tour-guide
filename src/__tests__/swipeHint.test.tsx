import React from "react";
import { render } from "@testing-library/react-native";

import { SwipeHint } from "../components/SwipeHint";
import { DEFAULT_SWIPE_HINT, resolveSwipeHint } from "../themes";
import type { SwipeDirection } from "../types";

const rect = { x: 20, y: 40, width: 200, height: 80 };

describe("resolveSwipeHint", () => {
  it("returns null when no hint is set", () => {
    expect(resolveSwipeHint(undefined)).toBeNull();
  });

  it("expands the string shorthand into a full config", () => {
    expect(resolveSwipeHint("left")).toEqual({
      ...DEFAULT_SWIPE_HINT,
      direction: "left",
      trailLength: DEFAULT_SWIPE_HINT.distance * 1.15,
    });
  });

  it("merges a partial config over the defaults", () => {
    expect(resolveSwipeHint({ direction: "up", distance: 120, color: "#000" })).toEqual(
      {
        ...DEFAULT_SWIPE_HINT,
        direction: "up",
        distance: 120,
        color: "#000",
        trailLength: 138,
      },
    );
  });

  it("defaults trailLength off the resolved distance, not a fixed constant", () => {
    expect(
      resolveSwipeHint({ direction: "left", distance: 100 })?.trailLength,
    ).toBeCloseTo(115);
  });

  it("honours an explicit trailLength independent of distance", () => {
    expect(
      resolveSwipeHint({ direction: "left", distance: 100, trailLength: 40 })
        ?.trailLength,
    ).toBe(40);
  });

  it("defaults the hand's fill to white, independent of the outline color", () => {
    const resolved = resolveSwipeHint({ direction: "up", color: "#111827" });
    expect(resolved?.fillColor).toBe("#FFFFFF");
    expect(resolved?.color).toBe("#111827");
  });

  it("honours an explicit fillColor", () => {
    expect(resolveSwipeHint({ direction: "up", fillColor: "#F97316" })?.fillColor).toBe(
      "#F97316",
    );
  });
});

describe("SwipeHint", () => {
  it.each(["up", "down", "left", "right"] as SwipeDirection[])(
    "renders a %s hint without crashing",
    (direction) => {
      expect(() =>
        render(<SwipeHint rect={rect} hint={resolveSwipeHint(direction)!} />),
      ).not.toThrow();
    },
  );

  it("renders nothing without a measured target", () => {
    const { toJSON } = render(
      <SwipeHint rect={null} hint={resolveSwipeHint("left")!} />,
    );

    expect(toJSON()).toBeNull();
  });

  it("omits the trail when showTrail is false", () => {
    const withTrail = render(
      <SwipeHint rect={rect} hint={resolveSwipeHint({ direction: "left" })!} />,
    ).toJSON();

    const withoutTrail = render(
      <SwipeHint
        rect={rect}
        hint={resolveSwipeHint({ direction: "left", showTrail: false })!}
      />,
    ).toJSON();

    expect(JSON.stringify(withTrail).length).toBeGreaterThan(
      JSON.stringify(withoutTrail).length,
    );
  });

  it("renders the hand's fill with the configured fillColor", () => {
    const { toJSON } = render(
      <SwipeHint
        rect={rect}
        hint={resolveSwipeHint({ direction: "left", fillColor: "#F97316" })!}
      />,
    );

    expect(JSON.stringify(toJSON())).toContain("#F97316");
  });

  it("cleans up its animation on unmount", () => {
    const { unmount } = render(
      <SwipeHint rect={rect} hint={resolveSwipeHint("down")!} />,
    );

    expect(() => unmount()).not.toThrow();
  });
});
