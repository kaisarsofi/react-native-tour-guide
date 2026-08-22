import React, { useEffect } from "react";
import { useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, Mask, Rect } from "react-native-svg";

import type { Rect as RectType, SpotlightStyles, TourMotion } from "../types";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

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
  styles,
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

  useEffect(() => {
    if (!rect) {
      opacity.value = withTiming(0, { duration });
      return;
    }
    const instant = motion === "none";
    const timingConfig = { duration: instant ? 0 : duration };
    holeX.value = withTiming(rect.x - padding, timingConfig);
    holeY.value = withTiming(rect.y - padding, timingConfig);
    holeW.value = withTiming(rect.width + padding * 2, timingConfig);
    holeH.value = withTiming(rect.height + padding * 2, timingConfig);
    holeR.value = withTiming(radius, timingConfig);
    opacity.value = withTiming(1, { duration });
  }, [duration, holeH, holeR, holeW, holeX, holeY, motion, opacity, padding, radius, rect]);

  const animatedProps = useAnimatedProps(() => ({
    x: holeX.value,
    y: holeY.value,
    width: holeW.value,
    height: holeH.value,
    rx: holeR.value,
  }));

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheetAbsoluteFill, animatedStyle]}
    >
      <Svg width={screenWidth} height={screenHeight}>
        <Defs>
          <Mask id="tour-guide-spotlight-mask">
            <Rect x={0} y={0} width={screenWidth} height={screenHeight} fill="white" />
            <AnimatedRect animatedProps={animatedProps} fill="black" />
          </Mask>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={screenWidth}
          height={screenHeight}
          fill={styles.overlayColor}
          fillOpacity={styles.overlayOpacity}
          mask="url(#tour-guide-spotlight-mask)"
        />
      </Svg>
    </Animated.View>
  );
}

const StyleSheetAbsoluteFill = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};
