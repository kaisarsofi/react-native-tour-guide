import React, { useEffect, useRef } from "react";
import { View, type GestureResponderEvent, type ViewProps } from "react-native";

import { useTourGuideContext } from "../TourGuideContext";
import type { SpotlightPadding } from "../types";

// A `passThroughTouches` step renders nothing over the spotlight, so the
// real control gets the touch and the overlay has no view there to detect
// the press with. `View`'s plain `onTouchStart`/`onTouchEnd` are passive —
// unlike the responder system (`onStartShouldSetResponder`, `Pressable`),
// they never claim the touch, so attaching them here observes the press
// without taking it away from the real control underneath. These two
// thresholds tell an actual tap apart from a scroll/swipe that merely
// started and ended somewhere inside this target.
const PASSTHROUGH_TAP_SLOP_PX = 10;
const PASSTHROUGH_TAP_MAX_DURATION_MS = 500;

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
  onTouchStart,
  onTouchEnd,
  onTouchCancel,
  ...viewProps
}: TourTargetProps) {
  const { registerTarget, state } = useTourGuideContext();
  const ref = useRef<View>(null);
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

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

  const currentStep =
    state.isActive && !state.isPaused ? state.steps[state.currentIndex] : undefined;
  const isActivePassThroughTarget =
    currentStep?.targetId === id &&
    (currentStep.passThroughTouches ?? state.config.passThroughTouches);

  const handleTouchStart = (event: GestureResponderEvent) => {
    onTouchStart?.(event);
    if (!isActivePassThroughTarget) return;
    touchStart.current = {
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (event: GestureResponderEvent) => {
    onTouchEnd?.(event);
    if (!isActivePassThroughTarget) return;
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || !currentStep) return;
    const dx = Math.abs(event.nativeEvent.pageX - start.x);
    const dy = Math.abs(event.nativeEvent.pageY - start.y);
    const duration = Date.now() - start.time;
    if (
      dx <= PASSTHROUGH_TAP_SLOP_PX &&
      dy <= PASSTHROUGH_TAP_SLOP_PX &&
      duration <= PASSTHROUGH_TAP_MAX_DURATION_MS
    ) {
      currentStep.onSpotlightPress?.();
    }
  };

  const handleTouchCancel = (event: GestureResponderEvent) => {
    onTouchCancel?.(event);
    touchStart.current = null;
  };

  return (
    <View
      ref={ref}
      collapsable={false}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      {...viewProps}
    >
      {children}
    </View>
  );
}
