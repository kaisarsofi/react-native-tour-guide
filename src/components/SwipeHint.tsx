import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

import type { Rect as TargetRect, ResolvedSwipeHint, SwipeDirection } from "../types";

/**
 * The hand from Google's Material Symbols "swipe" glyph (Apache-2.0) — a
 * proper articulated hand rather than an approximation, inlined so the
 * package pulls in no icon-font dependency and can't render as a tofu box.
 */
const HAND_PATH =
  "M473-80q-24 0-46-9t-39-26L184-320l30-31q16-16 37.5-21.5t42.5.5l66 19v-327q0-17 " +
  "11.5-28.5T400-720q17 0 28.5 11.5T440-680v280h40v-120q0-17 11.5-28.5T520-560q17 0 " +
  "28.5 11.5T560-520v120h40v-80q0-17 11.5-28.5T640-520q17 0 28.5 11.5T680-480v80h40q0-17 " +
  "11.5-28.5T760-440q17 0 28.5 11.5T800-400v160q0 66-47 113T640-80H473Z";

const AXIS: Record<SwipeDirection, "x" | "y"> = {
  up: "y",
  down: "y",
  left: "x",
  right: "x",
};

function chevronPath(
  x: number,
  y: number,
  direction: SwipeDirection,
  size: number,
): string {
  switch (direction) {
    case "left":
      return `M${x + size} ${y - size} L${x} ${y} L${x + size} ${y + size}`;
    case "right":
      return `M${x - size} ${y - size} L${x} ${y} L${x - size} ${y + size}`;
    case "up":
      return `M${x - size} ${y + size} L${x} ${y} L${x + size} ${y + size}`;
    case "down":
      return `M${x - size} ${y - size} L${x} ${y} L${x + size} ${y - size}`;
  }
}

function chevronCenters(
  direction: SwipeDirection,
  midX: number,
  midY: number,
  travel: number,
): Array<{ x: number; y: number }> {
  const start = 0.28;
  const step = 0.22;
  return [0, 1, 2].map((i) => {
    const t = start + i * step;
    if (direction === "left") return { x: midX + travel / 2 - t * travel, y: midY };
    if (direction === "right") return { x: midX - travel / 2 + t * travel, y: midY };
    if (direction === "up") return { x: midX, y: midY + travel / 2 - t * travel };
    return { x: midX, y: midY - travel / 2 + t * travel };
  });
}

export interface SwipeHintProps {
  rect: TargetRect | null;
  hint: ResolvedSwipeHint;
}

/**
 * Static SVG swipe cue. A Reanimated loop here competed with list drag on
 * low-end Android; one SVG (hand + chevrons) reads as "swipe this way"
 * without a frame budget.
 */
export function SwipeHint({ rect, hint }: SwipeHintProps) {
  if (!rect) return null;

  const isVertical = AXIS[hint.direction] === "y";
  const pad = 10;
  const width = isVertical ? hint.size + pad * 2 : hint.distance + hint.size;
  const height = isVertical ? hint.distance + hint.size : hint.size + pad * 2;
  const midX = width / 2;
  const midY = height / 2;
  const trail = hint.distance * 0.72;
  const chevron = Math.max(7, Math.round(hint.size * 0.16));

  const handX =
    hint.direction === "left"
      ? width - hint.size - 2
      : hint.direction === "right"
        ? 2
        : midX - hint.size / 2;
  const handY =
    hint.direction === "up"
      ? height - hint.size - 2
      : hint.direction === "down"
        ? 2
        : midY - hint.size / 2;

  const left = rect.x + rect.width / 2 - width / 2;
  const top = rect.y + rect.height / 2 - height / 2;

  return (
    <Svg
      pointerEvents="none"
      width={width}
      height={height}
      style={[styles.cue, { left, top }]}
    >
      {hint.showTrail && (
        <>
          <Rect
            x={isVertical ? midX - 2 : midX - trail / 2}
            y={isVertical ? midY - trail / 2 : midY - 2}
            width={isVertical ? 4 : trail}
            height={isVertical ? trail : 4}
            rx={2}
            fill={hint.trailColor}
            opacity={0.28}
          />
          {chevronCenters(hint.direction, midX, midY, trail).map((point, index) => (
            <Path
              key={index}
              d={chevronPath(point.x, point.y, hint.direction, chevron)}
              fill="none"
              stroke={hint.trailColor}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.35 + index * 0.2}
            />
          ))}
        </>
      )}
      <Svg
        x={handX}
        y={handY}
        width={hint.size}
        height={hint.size}
        viewBox="0 -960 960 960"
      >
        <Path d={HAND_PATH} fill={hint.color} />
      </Svg>
    </Svg>
  );
}

const styles = StyleSheet.create({
  cue: {
    position: "absolute",
  },
});
