import React, { useEffect } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, Mask, Rect } from "react-native-svg";

import type { Rect as RectType, SpotlightStyles, TourMotion } from "../types";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const PULSE_SPREAD = 14;

export interface SpotlightProps {
  rect: RectType | null;
  radius: number;
  padding: number;
  styles: Required<SpotlightStyles>;
  motion: TourMotion;
  duration: number;
}

export function Spotlight({
  rect,
  radius,
  padding,
  styles: s,
  motion,
  duration,
}: SpotlightProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const holeX = useSharedValue(rect ? rect.x - padding : screenWidth / 2);
  const holeY = useSharedValue(rect ? rect.y - padding : screenHeight / 2);
  const holeW = useSharedValue(rect ? rect.width + padding * 2 : 0);
  const holeH = useSharedValue(rect ? rect.height + padding * 2 : 0);
  const holeR = useSharedValue(radius);
  const opacity = useSharedValue(rect ? 1 : 0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!rect) {
      opacity.value = withTiming(0, { duration });
      return;
    }
    const timing = { duration: motion === "none" ? 0 : duration };
    holeX.value = withTiming(rect.x - padding, timing);
    holeY.value = withTiming(rect.y - padding, timing);
    holeW.value = withTiming(rect.width + padding * 2, timing);
    holeH.value = withTiming(rect.height + padding * 2, timing);
    holeR.value = withTiming(radius, timing);
    opacity.value = withTiming(1, { duration });
  }, [
    duration,
    holeH,
    holeR,
    holeW,
    holeX,
    holeY,
    motion,
    opacity,
    padding,
    radius,
    rect,
  ]);

  useEffect(() => {
    if (!s.enablePulse || !rect) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }
    pulse.value = 0;
    pulse.value = withRepeat(
      withTiming(1, { duration: s.pulseDuration, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [pulse, rect, s.enablePulse, s.pulseDuration]);

  const maskProps = useAnimatedProps(() => ({
    x: holeX.value,
    y: holeY.value,
    width: holeW.value,
    height: holeH.value,
    rx: holeR.value,
  }));

  // Same geometry as the cutout, drawn as a stroked outline on top.
  const ringProps = useAnimatedProps(() => ({
    x: holeX.value,
    y: holeY.value,
    width: holeW.value,
    height: holeH.value,
    rx: holeR.value,
  }));

  const pulseProps = useAnimatedProps(() => {
    const spread = pulse.value * PULSE_SPREAD;
    return {
      x: holeX.value - spread,
      y: holeY.value - spread,
      width: Math.max(holeW.value + spread * 2, 0),
      height: Math.max(holeH.value + spread * 2, 0),
      rx: holeR.value + spread,
      strokeOpacity: 1 - pulse.value,
    };
  });

  const containerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, containerStyle]}
    >
      <Svg width={screenWidth} height={screenHeight}>
        <Defs>
          <Mask id="tour-guide-spotlight-mask">
            <Rect x={0} y={0} width={screenWidth} height={screenHeight} fill="white" />
            <AnimatedRect animatedProps={maskProps} fill="black" />
          </Mask>
        </Defs>

        <Rect
          x={0}
          y={0}
          width={screenWidth}
          height={screenHeight}
          fill={s.overlayColor}
          fillOpacity={s.overlayOpacity}
          mask="url(#tour-guide-spotlight-mask)"
        />

        {s.enablePulse && (
          <AnimatedRect
            animatedProps={pulseProps}
            fill="none"
            stroke={s.pulseColor}
            strokeWidth={s.pulseWidth}
          />
        )}

        {s.borderWidth > 0 && (
          <AnimatedRect
            animatedProps={ringProps}
            fill="none"
            stroke={s.borderColor}
            strokeWidth={s.borderWidth}
          />
        )}
      </Svg>
    </Animated.View>
  );
}
