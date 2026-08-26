import React, { useEffect, useRef } from "react";
import { View, type ViewProps } from "react-native";

import { useTourGuideContext } from "../TourGuideContext";
import type { SpotlightPadding } from "../types";

export interface TourTargetProps extends ViewProps {
  /** Referenced from a `TourStep` via `targetId`. */
  id: string;
  /**
   * Corner radius of the spotlight cutout for this target. Set it once here
   * and every step that points at this target is shaped to match — a round
   * icon button stays round, a pill stays a pill — instead of each step
   * restating it. `999` reads as a circle or pill. A step's own
   * `spotlightBorderRadius` still wins if it sets one.
   */
  spotlightBorderRadius?: number;
  /**
   * Space between this target's bounds and the cutout, same precedence as
   * `spotlightBorderRadius`.
   */
  spotlightPadding?: SpotlightPadding;
}

/**
 * Ref-free way to mark a component as a tour target: wrap it once, then
 * reference it from a step with `targetId` instead of managing a ref.
 *
 * `TourTarget` sizes to its content by default like any plain `View` — pass
 * `style={{ flex: 1 }}` (or the `TourScrollList` wrapper, which does this
 * for you) when wrapping a flex-filling child such as a full-height list, or
 * the spotlight collapses to zero height. In development, a target that
 * measures to zero size logs a warning naming the culprit.
 */
export function TourTarget({
  id,
  children,
  spotlightBorderRadius,
  spotlightPadding,
  ...viewProps
}: TourTargetProps) {
  const { registerTarget } = useTourGuideContext();
  const ref = useRef<View>(null);

  // `spotlightPadding` is commonly written inline (`{ horizontal: 4 }`), so
  // its identity changes every render. Keying the effect on the value keeps
  // registration from churning on every parent re-render.
  const shapeKey = JSON.stringify({ spotlightBorderRadius, spotlightPadding });
  const shapeRef = useRef({ spotlightBorderRadius, spotlightPadding });
  shapeRef.current = { spotlightBorderRadius, spotlightPadding };

  useEffect(
    () => registerTarget(id, ref, shapeRef.current),
    [id, registerTarget, shapeKey],
  );

  return (
    <View ref={ref} collapsable={false} {...viewProps}>
      {children}
    </View>
  );
}
