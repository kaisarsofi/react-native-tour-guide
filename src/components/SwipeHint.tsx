import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { G, Path, Rect } from "react-native-svg";

import type { Rect as TargetRect, ResolvedSwipeHint, SwipeDirection } from "../types";

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Outlined swipe hand: a filled palm with three separate finger creases,
 * drawn in its own ~390x290 space around the origin so it can be scaled
 * and rotated per direction. Stroked rather than solid so it stays legible
 * over both light content and a dimmed backdrop.
 */
const HAND_PALM_PATH =
  "M-94.136,-3.264C-94.136,-3.264,-43.736,93.064,-43.736,93.064C-43.736,93.064," +
  "-33.779,111.447,-11.566,116.043C10.647,120.638,48.219,115.107,48.219,115.107C" +
  "48.219,115.107,88.009,114.511,94.136,70.852C94.136,70.852,93.457,-17.854," +
  "93.457,-17.854C93.457,-17.854,83.498,-50.18,60.093,-26.813C60.093,-26.813," +
  "54.818,-60.043,26.903,-35.872C26.903,-35.872,20.775,-61.745,-7.139,-44.723C" +
  "-7.139,-44.723,-8.161,-102.936,-8.161,-102.936C-8.161,-102.936,-9.182,-118.595," +
  "-25.523,-120.638C-25.523,-120.638,-39.48,-118.254,-41.863,-103.956C-41.863," +
  "-103.956,-41.863,8.383,-41.863,8.383C-41.863,8.383,-67.771,-32.273,-94.136,-3.264Z";

const HAND_FINGER_PATHS = [
  "M122.383,142.85C122.383,142.85,122.383,99.489,122.383,99.489",
  "M155.745,138.978C155.745,138.978,155.745,108.68,155.745,108.68",
  "M188.085,137.276C188.085,137.276,188.085,116.851,188.085,116.851",
];

/**
 * The finger creases are authored in the source artboard's absolute
 * coordinates while the palm is authored around the origin; this shifts
 * them onto the palm, exactly as the source file's parent group does.
 */
const HAND_FINGER_OFFSET = { x: -129.5, y: -151 };

/** Native span of the hand artwork, used to scale it to `hint.size`. */
const HAND_ART_SPAN = 300;

const AXIS: Record<SwipeDirection, "x" | "y"> = {
  up: "y",
  down: "y",
  left: "x",
  right: "x",
};

// The hand artwork stays upright even for a horizontal swipe — a hand
// rotated on its side reads less clearly than the horizontal glide itself
// already communicates the direction.
const HAND_ROTATION: Record<SwipeDirection, number> = {
  up: 0,
  down: 180,
  left: 0,
  right: 0,
};

export interface SwipeHintProps {
  rect: TargetRect | null;
  hint: ResolvedSwipeHint;
}

const LOOP_DURATION = 2000;

export function SwipeHint({ rect, hint }: SwipeHintProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: LOOP_DURATION, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(progress);
  }, [progress]);

  const isVertical = AXIS[hint.direction] === "y";
  const pad = 10;
  const width = isVertical ? hint.size + pad * 2 : hint.distance + hint.size;
  const height = isVertical ? hint.distance + hint.size : hint.size + pad * 2;
  const midX = width / 2;
  const midY = height / 2;
  const travel = hint.distance * 0.72;

  // The hand starts at the "from" end of the travel and slides to the "to"
  // end, so its resting spot depends on which way the swipe goes.
  const startX =
    hint.direction === "left"
      ? midX + travel / 2
      : hint.direction === "right"
        ? midX - travel / 2
        : midX;
  const startY =
    hint.direction === "up"
      ? midY + travel / 2
      : hint.direction === "down"
        ? midY - travel / 2
        : midY;

  const direction = hint.direction;
  const handScale = hint.size / HAND_ART_SPAN;
  const rotation = HAND_ROTATION[direction];

  const handAnimatedProps = useAnimatedProps(() => {
    // Matches the reference timing: a beat of stillness, an eased glide,
    // then a hold before fading out and restarting.
    const slide = interpolate(
      progress.value,
      [0, 0.22, 0.82, 1],
      [0, 0, 1, 1],
      "clamp",
    );
    const offset = slide * travel;
    const dx = direction === "left" ? -offset : direction === "right" ? offset : 0;
    const dy = direction === "up" ? -offset : direction === "down" ? offset : 0;
    const opacity = interpolate(
      progress.value,
      [0, 0.11, 0.18, 0.83, 0.9, 1],
      [0, 0, 1, 1, 0, 0],
      "clamp",
    );
    // react-native-svg only re-applies animated `transform` through
    // reanimated in the RN array form — a raw SVG transform string renders
    // once and then never updates.
    return {
      transform: [{ translateX: startX + dx }, { translateY: startY + dy }],
      opacity,
    };
  });

  const trailThickness = hint.size * 0.3;
  // Longer than the hand's own travel so the line reads clearly as a track
  // the hand rides along, not just the span it slides across.
  const trailLength = hint.distance * 1.15;

  if (!rect) return null;

  const left = rect.x + rect.width / 2 - width / 2;
  const top = rect.y + rect.height / 2 - height / 2;

  return (
    // `pointerEvents="none"` on <Svg> itself isn't reliably forwarded by
    // react-native-svg's native view, which left this hint's (now sizeable)
    // bounding box swallowing swipes meant for the tour's fullscreen
    // PanResponder underneath. A plain RN View's pointerEvents is reliable.
    <View pointerEvents="none" style={[styles.cue, { left, top, width, height }]}>
      <Svg width={width} height={height}>
        {hint.showTrail && (
          <Rect
            x={isVertical ? midX - trailThickness / 2 : midX - trailLength / 2}
            y={isVertical ? midY - trailLength / 2 : midY - trailThickness / 2}
            width={isVertical ? trailThickness : trailLength}
            height={isVertical ? trailLength : trailThickness}
            rx={trailThickness / 2}
            fill={hint.trailColor}
            opacity={0.28}
          />
        )}

        <AnimatedG animatedProps={handAnimatedProps}>
          <G transform={`rotate(${rotation}) scale(${handScale})`}>
            <Path
              d={HAND_PALM_PATH}
              fill="#FFFFFF"
              stroke={hint.color}
              strokeWidth={11}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <G transform={`translate(${HAND_FINGER_OFFSET.x},${HAND_FINGER_OFFSET.y})`}>
              {HAND_FINGER_PATHS.map((d) => (
                <Path
                  key={d}
                  d={d}
                  fill="none"
                  stroke={hint.color}
                  strokeWidth={11}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </G>
          </G>
        </AnimatedG>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  cue: {
    position: "absolute",
  },
});
