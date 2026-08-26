import type { RefObject } from "react";
import { Dimensions, type View } from "react-native";

import type {
  Rect,
  SpotlightPadding,
  TooltipPosition,
  TourTargetShape,
} from "../types";

export interface ResolvedSpotlightPadding {
  horizontal: number;
  vertical: number;
}

/**
 * Expand a `SpotlightPadding` (a plain number, or per-axis overrides) into
 * concrete `horizontal`/`vertical` values, falling back to `fallback` for
 * whichever axis wasn't set.
 */
export function resolveSpotlightPadding(
  padding: SpotlightPadding | undefined,
  fallback: number,
): ResolvedSpotlightPadding {
  if (padding == null) return { horizontal: fallback, vertical: fallback };
  if (typeof padding === "number") return { horizontal: padding, vertical: padding };
  return {
    horizontal: padding.horizontal ?? fallback,
    vertical: padding.vertical ?? fallback,
  };
}

export interface ResolvedSpotlightShape {
  radius: number;
  padding: ResolvedSpotlightPadding;
}

/**
 * Decide the cutout's shape for a step.
 *
 * Precedence is step, then the `<TourTarget>`'s own declaration, then the
 * defaults — so a round icon button stays round for every tour that points
 * at it without any step restating the shape, while a step that does care
 * can still override. Each field falls back independently: a target may set
 * only a radius and still inherit the default padding.
 */
export function resolveSpotlightShape({
  step,
  target,
  defaultRadius,
  defaultPadding,
}: {
  step?: TourTargetShape | null;
  target?: TourTargetShape | null;
  defaultRadius: number;
  defaultPadding: number;
}): ResolvedSpotlightShape {
  return {
    radius:
      step?.spotlightBorderRadius ?? target?.spotlightBorderRadius ?? defaultRadius,
    padding: resolveSpotlightPadding(
      step?.spotlightPadding ?? target?.spotlightPadding,
      defaultPadding,
    ),
  };
}

/**
 * Splits the screen minus `hole` into up to four rectangles — a "picture
 * frame" around the spotlighted target. `pointerEvents="none"` on a single
 * full-screen view only skips *that* view during hit-testing; a sibling
 * behind it still catches the touch, so it can't punch a real hole for
 * touches to reach whatever's underneath the tour (the real app). Rendering
 * one blocking view per band instead, and rendering *nothing* over `hole`
 * itself, is the only way a touch there genuinely reaches the real content
 * — there's no view left at that spot to catch it.
 *
 * Order: top (full width, above the hole), bottom (full width, below),
 * left and right (spanning only the hole's own vertical band). A hole
 * flush against an edge simply produces no band on that side.
 */
export function computeOutsideSpotlightBands(
  hole: Rect,
  screenWidth: number,
  screenHeight: number,
): Rect[] {
  const x = Math.max(0, hole.x);
  const y = Math.max(0, hole.y);
  const right = Math.min(screenWidth, hole.x + hole.width);
  const bottom = Math.min(screenHeight, hole.y + hole.height);
  const bands: Rect[] = [];

  if (y > 0) {
    bands.push({ x: 0, y: 0, width: screenWidth, height: y });
  }
  if (bottom < screenHeight) {
    bands.push({ x: 0, y: bottom, width: screenWidth, height: screenHeight - bottom });
  }
  if (x > 0) {
    bands.push({ x: 0, y, width: x, height: bottom - y });
  }
  if (right < screenWidth) {
    bands.push({ x: right, y, width: screenWidth - right, height: bottom - y });
  }

  return bands;
}

type MeasureCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
  pageX: number,
  pageY: number,
) => void;

type Measurable = Pick<View, "measure" | "measureInWindow">;

/**
 * `measure`/`measureInWindow` take a callback the platform is not obliged to
 * ever call — a detached or not-yet-laid-out view simply never answers. Left
 * unbounded that stalls the whole measure chain, and a step that never
 * resolves is what leaves a tour stuck with no spotlight. Resolve `null`
 * instead and let callers treat it as "couldn't measure".
 */
const MEASURE_TIMEOUT_MS = 500;

function readWindowRect(node: Measurable): Promise<Rect | null> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (rect: Rect | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(rect);
    };
    const timer = setTimeout(() => settle(null), MEASURE_TIMEOUT_MS);

    if (typeof node.measure === "function") {
      node.measure(((_x, _y, width, height, pageX, pageY) => {
        if (width === 0 && height === 0) {
          settle(null);
          return;
        }
        settle({ x: pageX, y: pageY, width, height });
      }) as MeasureCallback);
      return;
    }

    node.measureInWindow((x, y, width, height) => {
      if (width === 0 && height === 0) {
        settle(null);
        return;
      }
      settle({ x, y, width, height });
    });
  });
}

/** Two frames so ScrollView / safe-area insets finish applying before we measure. */
export function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export function measureView(
  ref: RefObject<View | null>,
  hostRef?: RefObject<View | null>,
): Promise<Rect | null> {
  const node = ref.current;
  if (!node) {
    return Promise.resolve(null);
  }

  return readWindowRect(node).then((rect) => {
    if (!rect) return null;
    const host = hostRef?.current;
    if (!host) return rect;
    return readWindowRect(host).then((origin) => {
      if (!origin) return rect;
      return {
        x: rect.x - origin.x,
        y: rect.y - origin.y,
        width: rect.width,
        height: rect.height,
      };
    });
  });
}

/** Window-coordinate rect of a single view, or `null` if it can't be measured. */
export function measureWindowRect(ref: RefObject<View | null>): Promise<Rect | null> {
  const node = ref.current;
  if (!node) return Promise.resolve(null);
  return readWindowRect(node);
}

/**
 * Shift a window/screen-coordinate rect into the overlay host's own space.
 *
 * `measureView` already does this for measured targets, so a `targetRegion`
 * needs the same treatment or the two disagree: whenever the host doesn't
 * start at the screen origin — a status-bar or notch inset above it, an iPad
 * layout centring it in a max-width column — a region given in screen
 * coordinates lands offset by exactly that gap, while a measured target
 * beside it sits correctly.
 */
export function windowRectToHostRect(
  rect: Rect,
  origin: { x: number; y: number },
): Rect {
  return {
    x: rect.x - origin.x,
    y: rect.y - origin.y,
    width: rect.width,
    height: rect.height,
  };
}

export function rectsEqual(a: Rect | null, b: Rect | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

export interface TooltipLayout {
  x: number;
  y: number;
  placement: Exclude<TooltipPosition, "auto">;
  /**
   * Distance from the tooltip's leading edge to the target's centre, along
   * whichever axis the caret slides on. The tooltip gets clamped to the
   * screen, so this is what keeps the arrow pointing at the target.
   */
  arrowOffset: number;
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

  const arrowOffset =
    placement === "top" || placement === "bottom"
      ? target.x + target.width / 2 - x
      : target.y + target.height / 2 - y;

  return { x, y, placement, arrowOffset };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}
