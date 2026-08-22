import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from "react-native";

import { useTourGuideContext } from "../TourGuideContext";
import type { TooltipProps } from "../types";
import { computeTooltipLayout } from "../utils/geometry";
import { Spotlight } from "./Spotlight";
import { Tooltip } from "./Tooltip";

const DEFAULT_SPOTLIGHT_PADDING = 8;
const DEFAULT_SPOTLIGHT_RADIUS = 12;
const SCREEN_MARGIN = 16;

export function TourGuideOverlay() {
  const {
    state,
    nextStep,
    prevStep,
    skipTour,
    handleBackdropPress,
    registerOverlayHost,
  } = useTourGuideContext();
  const hostRef = useRef<View>(null);
  const { width: screenWidth } = useWindowDimensions();
  const [tooltipSize, setTooltipSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const step = state.steps[state.currentIndex] ?? null;
  const visible = state.isActive && !state.isPaused;

  useEffect(() => registerOverlayHost(hostRef), [registerOverlayHost]);

  useEffect(() => {
    setTooltipSize(null);
  }, [state.currentIndex]);

  useEffect(() => {
    if (Platform.OS !== "android" || !visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (state.currentIndex > 0) {
        prevStep();
      } else {
        skipTour();
      }
      return true;
    });
    return () => sub.remove();
  }, [prevStep, skipTour, state.currentIndex, visible]);

  const tooltipWidth = Math.min(
    screenWidth - SCREEN_MARGIN * 2,
    state.config.tooltipStyles.maxWidth,
  );

  const layout = useMemo(() => {
    if (!state.targetRect || !tooltipSize) return null;
    return computeTooltipLayout(
      state.targetRect,
      tooltipSize,
      step?.tooltipPosition ?? "auto",
    );
  }, [state.targetRect, step?.tooltipPosition, tooltipSize]);

  const handleMeasureLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setTooltipSize((prev) =>
      prev && prev.width === width && prev.height === height ? prev : { width, height },
    );
  };

  if (!step || !visible) {
    return (
      <View
        ref={hostRef}
        collapsable={false}
        pointerEvents="none"
        style={styles.host}
      />
    );
  }

  const padding = step.spotlightPadding ?? DEFAULT_SPOTLIGHT_PADDING;
  const radius = step.spotlightBorderRadius ?? DEFAULT_SPOTLIGHT_RADIUS;

  const tooltipProps: TooltipProps = {
    step,
    stepIndex: state.currentIndex,
    totalSteps: state.steps.length,
    isFirst: state.currentIndex === 0,
    isLast: state.currentIndex === state.steps.length - 1,
    placement: layout?.placement ?? "bottom",
    arrowOffset: layout?.arrowOffset ?? tooltipWidth / 2,
    config: state.config,
    onNext: nextStep,
    onPrev: prevStep,
    onSkip: skipTour,
  };

  const CustomTooltip = step.renderTooltip ?? state.config.renderTooltip;

  return (
    <View
      ref={hostRef}
      collapsable={false}
      pointerEvents="box-none"
      style={styles.host}
      accessibilityViewIsModal
    >
      <Pressable
        testID="tour-guide-backdrop"
        style={StyleSheet.absoluteFill}
        onPress={() => handleBackdropPress(step.backdropBehavior)}
      >
        <Spotlight
          rect={state.targetRect}
          radius={radius}
          padding={padding}
          duration={state.config.animationDuration}
          motion={step.motion ?? state.config.motion}
          styles={state.config.spotlightStyles}
        />
      </Pressable>

      <View
        onLayout={handleMeasureLayout}
        pointerEvents="box-none"
        style={[
          styles.tooltipContainer,
          { width: tooltipWidth },
          layout
            ? { top: layout.y, left: layout.x, opacity: 1 }
            : { top: 0, left: 0, opacity: 0 },
        ]}
      >
        {CustomTooltip ? CustomTooltip(tooltipProps) : <Tooltip {...tooltipProps} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  tooltipContainer: {
    position: "absolute",
  },
});
