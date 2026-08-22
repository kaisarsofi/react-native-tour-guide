import type { RefObject } from "react";
import { Dimensions, type View } from "react-native";

import type { Rect, TooltipPosition } from "../types";

export function measureView(ref: RefObject<View | null>): Promise<Rect | null> {
  return new Promise((resolve) => {
    const node = ref.current;
    if (!node) {
      resolve(null);
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      if (width === 0 && height === 0) {
        resolve(null);
        return;
      }
      resolve({ x, y, width, height });
    });
  });
}

export function padRect(rect: Rect, padding: number): Rect {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

export interface TooltipLayout {
  x: number;
  y: number;
  placement: Exclude<TooltipPosition, "auto">;
}

const SCREEN_MARGIN = 16;
const TARGET_GAP = 12;

/**
 * Picks where the tooltip should sit relative to the spotlighted rect,
 * flipping to whichever side actually has room when `preferred` is `auto`
 * or doesn't fit.
 */
export function computeTooltipLayout(
  target: Rect,
  tooltipSize: { width: number; height: number },
  preferred: TooltipPosition,
): TooltipLayout {
  const screen = Dimensions.get("window");
  const space = {
    top: target.y,
    bottom: screen.height - (target.y + target.height),
    left: target.x,
    right: screen.width - (target.x + target.width),
  };

  const fits = (placement: Exclude<TooltipPosition, "auto">) => {
    if (placement === "top" || placement === "bottom") {
      return space[placement] >= tooltipSize.height + TARGET_GAP;
    }
    return space[placement] >= tooltipSize.width + TARGET_GAP;
  };

  let placement: Exclude<TooltipPosition, "auto"> =
    preferred === "auto" ? "bottom" : preferred;

  if (!fits(placement)) {
    const ranked = (
      ["bottom", "top", "right", "left"] as Exclude<TooltipPosition, "auto">[]
    ).sort((a, b) => space[b] - space[a]);
    placement = ranked.find(fits) ?? ranked[0]!;
  }

  let x: number;
  let y: number;

  if (placement === "top" || placement === "bottom") {
    x = target.x + target.width / 2 - tooltipSize.width / 2;
    y =
      placement === "top"
        ? target.y - tooltipSize.height - TARGET_GAP
        : target.y + target.height + TARGET_GAP;
  } else {
    y = target.y + target.height / 2 - tooltipSize.height / 2;
    x =
      placement === "left"
        ? target.x - tooltipSize.width - TARGET_GAP
        : target.x + target.width + TARGET_GAP;
  }

  x = clamp(x, SCREEN_MARGIN, screen.width - tooltipSize.width - SCREEN_MARGIN);
  y = clamp(y, SCREEN_MARGIN, screen.height - tooltipSize.height - SCREEN_MARGIN);

  return { x, y, placement };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}
