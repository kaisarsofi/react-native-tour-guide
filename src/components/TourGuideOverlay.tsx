import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  BackHandler,
  PanResponder,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from "react-native";

import { useTourGuideContext } from "../TourGuideContext";
import { resolveSwipeHint } from "../themes";
import type { TooltipProps } from "../types";
import { computeTooltipLayout } from "../utils/geometry";
import {
  createDragFrameScheduler,
  dragScrollHandle,
  isSwipeAdvanceEnabled,
  isTooltipHidden,
  resolveCountedSwipe,
  resolveSwipeCount,
  resolveSwipeGesture,
  resolveTourScrollHandle,
  snapScrollToProgress,
} from "../utils/swipe";
import { Spotlight } from "./Spotlight";
import { SwipeHint } from "./SwipeHint";
import { Tooltip } from "./Tooltip";

const DEFAULT_SPOTLIGHT_PADDING = 8;
const DEFAULT_SPOTLIGHT_RADIUS = 12;
const SCREEN_MARGIN = 16;

function statusBarInset(): number {
  if (Platform.OS === "android") {
    return StatusBar.currentHeight ?? 24;
  }
  // iOS doesn't expose currentHeight; this clears the notch / Dynamic Island.
  return 54;
}

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
  const swipeHint = resolveSwipeHint(step?.swipeHint);
  const hideTooltip = step ? isTooltipHidden(step) : false;
  const swipeAdvance = step ? isSwipeAdvanceEnabled(step) : false;
  const scrollHandle = resolveTourScrollHandle(state.steps, state.currentIndex);

  const nextRef = useRef(nextStep);
  const prevRef = useRef(prevStep);
  const backdropRef = useRef(handleBackdropPress);
  const hintRef = useRef(swipeHint);
  const handleRef = useRef(scrollHandle);
  const originRef = useRef({ x: 0, y: 0 });
  const stepOriginRef = useRef({ x: 0, y: 0 });
  const progressRef = useRef(0);
  const stepRef = useRef(step);
  const countRef = useRef(step ? resolveSwipeCount(step, state.config.swipeCount) : 3);
  const indexRef = useRef(state.currentIndex);
  const swipeAdvanceRef = useRef(swipeAdvance);

  useLayoutEffect(() => {
    nextRef.current = nextStep;
    prevRef.current = prevStep;
    backdropRef.current = handleBackdropPress;
    hintRef.current = swipeHint;
    handleRef.current = scrollHandle;
    stepRef.current = step;
    indexRef.current = state.currentIndex;
    swipeAdvanceRef.current = swipeAdvance;
    countRef.current = step ? resolveSwipeCount(step, state.config.swipeCount) : 3;
  });

  const dragSchedulerRef = useRef(
    createDragFrameScheduler((dx, dy) => {
      const handle = handleRef.current;
      if (!handle) return;
      dragScrollHandle(handle, originRef.current, dx, dy);
    }),
  );

  useEffect(() => {
    if (!state.isActive) return;
    progressRef.current = 0;
    if (scrollHandle) {
      stepOriginRef.current = { ...scrollHandle.offsetRef.current };
    }
  }, [scrollHandle, state.isActive, state.currentIndex]);

  useEffect(() => () => dragSchedulerRef.current.cancel(), []);

  const spotlightStyles = useMemo(
    () =>
      swipeHint
        ? { ...state.config.spotlightStyles, enablePulse: false }
        : state.config.spotlightStyles,
    [state.config.spotlightStyles, swipeHint],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => swipeAdvanceRef.current,
        onMoveShouldSetPanResponder: (_, gesture) =>
          swipeAdvanceRef.current &&
          (Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2),
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          swipeAdvanceRef.current &&
          (Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2),
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          const handle = handleRef.current;
          if (handle) {
            originRef.current = { ...handle.offsetRef.current };
          }
        },
        onPanResponderMove: (_, gesture) => {
          dragSchedulerRef.current.move(gesture.dx, gesture.dy);
        },
        onPanResponderRelease: (_, gesture) => {
          dragSchedulerRef.current.flush();
          const hint = hintRef.current;
          if (!hint) return;
          const result = resolveSwipeGesture(hint.direction, gesture.dx, gesture.dy);
          const current = stepRef.current ?? undefined;
          const resolved = resolveCountedSwipe(
            progressRef.current,
            countRef.current,
            result,
            indexRef.current > 0,
          );
          progressRef.current = resolved.progress;
          if (resolved.action === "complete") {
            nextRef.current();
            return;
          }
          if (resolved.action === "rewind") {
            prevRef.current();
            return;
          }
          snapScrollToProgress(current, resolved.progress, stepOriginRef.current);
          if (
            result == null &&
            Math.abs(gesture.dx) < 10 &&
            Math.abs(gesture.dy) < 10
          ) {
            backdropRef.current(stepRef.current?.backdropBehavior);
          }
        },
        onPanResponderTerminate: () => {
          dragSchedulerRef.current.cancel();
        },
      }),
    [],
  );

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
  const showSkip = hideTooltip && !step.hideControls && !step.hideSkipButton;

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

  const spotlight = (
    <Spotlight
      rect={state.targetRect}
      radius={radius}
      padding={padding}
      duration={state.config.animationDuration}
      motion={step.motion ?? state.config.motion}
      styles={spotlightStyles}
    />
  );

  return (
    <View
      ref={hostRef}
      collapsable={false}
      pointerEvents="box-none"
      style={styles.host}
      accessibilityViewIsModal
      accessibilityLabel={step.accessibilityLabel ?? step.title}
    >
      {swipeAdvance ? (
        <View
          testID="tour-guide-backdrop"
          style={StyleSheet.absoluteFill}
          {...panResponder.panHandlers}
        >
          {spotlight}
        </View>
      ) : (
        <Pressable
          testID="tour-guide-backdrop"
          style={StyleSheet.absoluteFill}
          onPress={() => handleBackdropPress(step.backdropBehavior)}
        >
          {spotlight}
        </Pressable>
      )}

      {swipeHint && <SwipeHint rect={state.targetRect} hint={swipeHint} />}

      {showSkip && (
        <View pointerEvents="box-none" style={styles.skipBar}>
          <Pressable
            testID="tour-guide-skip"
            onPress={skipTour}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={state.config.skipButtonText}
            style={styles.skip}
          >
            <Text style={styles.skipText}>{state.config.skipButtonText}</Text>
          </Pressable>
        </View>
      )}

      {!hideTooltip && (
        <View
          onLayout={handleMeasureLayout}
          pointerEvents="box-none"
          style={[
            styles.tooltipContainer,
            { width: tooltipWidth },
            layout ? { top: layout.y, left: layout.x } : styles.tooltipPending,
            layout ? styles.tooltipReady : null,
          ]}
        >
          {CustomTooltip ? CustomTooltip(tooltipProps) : <Tooltip {...tooltipProps} />}
        </View>
      )}
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
  tooltipPending: {
    top: 0,
    left: 0,
    opacity: 0,
  },
  tooltipReady: {
    opacity: 1,
  },
  skipBar: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    zIndex: 2,
    alignItems: "flex-end",
    paddingRight: 20,
    paddingTop: statusBarInset() + 8,
  },
  skip: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  skipText: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
