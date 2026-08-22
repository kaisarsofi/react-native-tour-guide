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
    });
  });

  it("merges a partial config over the defaults", () => {
    expect(resolveSwipeHint({ direction: "up", distance: 120, color: "#000" })).toEqual(
      {
        ...DEFAULT_SWIPE_HINT,
        direction: "up",
        distance: 120,
        color: "#000",
      },
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

  it("cleans up its animation on unmount", () => {
    const { unmount } = render(
      <SwipeHint rect={rect} hint={resolveSwipeHint("down")!} />,
    );

    expect(() => unmount()).not.toThrow();
  });
});
