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
import type { TooltipProps, TourStep } from "../types";
import {
  computeOutsideSpotlightBands,
  computeTooltipLayout,
  resolveSpotlightPadding,
} from "../utils/geometry";
import { waitForScrollSettle } from "../utils/scroll";
import {
  createDragFrameScheduler,
  dragScrollHandle,
  isSwipeAdvanceEnabled,
  isTooltipHidden,
  resolveBoundaryGesture,
  resolveCountedSwipe,
  resolveScrollGesture,
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
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [tooltipSize, setTooltipSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  // Reset tooltipSize synchronously during render (not in an effect) when a
  // new step or tour starts. TourGuideOverlay lives for the whole app, so a
  // *separate* effect resetting this raced with the tooltip's own first
  // onLayout measurement for the new step — both are ordinary state updates
  // batched from the same commit, and whichever queued last won, sometimes
  // wiping out the fresh measurement and leaving the tooltip stuck invisible
  // (styles.tooltipPending) until something else forced a re-measure.
  // Adjusting state during render happens before that commit, so there's
  // nothing left to race by the time onLayout fires afterward.
  const measurementKeyRef = useRef<{ steps: TourStep[]; index: number } | null>(null);
  if (
    tooltipSize !== null &&
    (measurementKeyRef.current?.steps !== state.steps ||
      measurementKeyRef.current?.index !== state.currentIndex)
  ) {
    setTooltipSize(null);
  }
  measurementKeyRef.current = { steps: state.steps, index: state.currentIndex };

  const step = state.steps[state.currentIndex] ?? null;
  const visible = state.isActive && !state.isPaused;
  const swipeHint = resolveSwipeHint(step?.swipeHint);
  const hideTooltip = step ? isTooltipHidden(step) : false;
  const swipeAdvance = step ? isSwipeAdvanceEnabled(step) : false;
  const scrollHandle = resolveTourScrollHandle(state.steps, state.currentIndex);

  // A target with a bound, subscribable scroll handle is already natively
  // scrollable — count swipes by watching how far one completed gesture
  // (drag, plus any momentum) actually carried the list, instead of
  // capturing touches with a gesture responder and driving the scroll
  // ourselves. This works the same way regardless of whether the list is
  // paging: it's not watching for offset thresholds mid-scroll, just how
  // far the list moved between "the finger went down" and "the list came
  // to rest" — the same thing a captured touch's dx/dy measured, just read
  // off the list's own real movement instead of a synthetic one.
  const passiveModeActive =
    visible && swipeAdvance && scrollHandle?.subscribeGesture != null;

  const nextRef = useRef(nextStep);
  const prevRef = useRef(prevStep);
  const backdropRef = useRef(handleBackdropPress);
  const hintRef = useRef(swipeHint);
  const handleRef = useRef(scrollHandle);
  const originRef = useRef({ x: 0, y: 0 });
  const stepOriginRef = useRef({ x: 0, y: 0 });
  const progressRef = useRef(0);
  const stepRef = useRef(step);
  const countRef = useRef(
    step
      ? resolveSwipeCount(
          step,
          state.config.swipeCount,
          scrollHandle ? scrollHandle.pagingEnabled : true,
        )
      : 3,
  );
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
    countRef.current = step
      ? resolveSwipeCount(
          step,
          state.config.swipeCount,
          scrollHandle ? scrollHandle.pagingEnabled : true,
        )
      : 3;
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

  // Passive counterpart to the PanResponder below: no touch is ever
  // captured here. Each completed native gesture (drag, plus any momentum)
  // is counted exactly like a captured touch's dx/dy would be — just read
  // off the list's own real scroll delta instead of a synthetic one.
  // Nothing here ever calls `scrollTo`/`scrollToIndex` on the list.
  useEffect(() => {
    if (!passiveModeActive || !scrollHandle?.subscribeGesture) return;

    return scrollHandle.subscribeGesture((delta, bounds) => {
      const hint = hintRef.current;
      if (!hint) return;
      // A swipe attempted where the list has already run out of room to
      // scroll further produces no measurable delta at all — without this
      // fallback, a short list stalls the tour forever once it hits the
      // end, since every further attempt would otherwise read as nothing
      // happening.
      const gesture =
        resolveScrollGesture(hint.direction, delta.x, delta.y) ??
        resolveBoundaryGesture(hint.direction, bounds);
      if (!gesture) return;

      const resolved = resolveCountedSwipe(
        progressRef.current,
        countRef.current,
        gesture,
        indexRef.current > 0,
      );
      progressRef.current = resolved.progress;
      if (resolved.action === "complete") {
        nextRef.current();
      } else if (resolved.action === "rewind") {
        prevRef.current();
      }
      // "scroll"/"idle" need no action here — the list already moved
      // itself; there is nothing left for the tour to snap or drive.
    });
    // Re-subscribe whenever the step (and so the hint/count/handle) changes;
    // everything else this reads comes off refs kept current above.
  }, [passiveModeActive, scrollHandle, state.currentIndex]);

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
          if (resolved.action === "complete" || resolved.action === "rewind") {
            const isComplete = resolved.action === "complete";
            // `resolved.progress` is deliberately left unchanged on
            // "complete" (the count is done, not advancing further) — but
            // snapping back to it would undo this last drag's forward
            // motion right as the tour hides, reading as a rejected swipe.
            // Let the transition the user's finger was already mid-way
            // through finish forward instead, then hide once it settles.
            const settleProgress = isComplete
              ? resolved.progress + 1
              : resolved.progress;
            snapScrollToProgress(current, settleProgress, stepOriginRef.current);
            const advance = isComplete ? nextRef.current : prevRef.current;
            const handle = handleRef.current;
            if (handle) {
              waitForScrollSettle(handle).then(advance);
            } else {
              advance();
            }
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

  const padding = resolveSpotlightPadding(
    step.spotlightPadding,
    DEFAULT_SPOTLIGHT_PADDING,
  );
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

  // A gesture tour needs touches inside the spotlight to reach the real
  // list underneath (or its own gesture-capture view, just below) — but
  // everything *outside* it still has to be blocked from reaching the real
  // app (a tab bar, a back button, ...), the same as a normal step's
  // full-screen backdrop already does. One `pointerEvents="none"` view
  // can't do that: it only skips itself during hit-testing, not whatever
  // else is behind it, so a single full-screen "none" view leaks every
  // touch, everywhere, straight through to the app. Rendering one blocking
  // band per side of the hole (and nothing at all over the hole itself)
  // is what actually leaves a touch there with nothing left to catch it.
  // Falls back to one full-screen band before the target has a measured
  // rect, so nothing leaks in that one gap frame either.
  const outsideSpotlightBands = state.targetRect
    ? computeOutsideSpotlightBands(state.targetRect, screenWidth, screenHeight)
    : [{ x: 0, y: 0, width: screenWidth, height: screenHeight }];

  const outsideSpotlightBlockers = outsideSpotlightBands.map((band, index) => (
    <Pressable
      key={index}
      testID="tour-guide-outside-blocker"
      onPress={() => handleBackdropPress(step.backdropBehavior)}
      style={[
        styles.gestureCapture,
        { left: band.x, top: band.y, width: band.width, height: band.height },
      ]}
    />
  ));

  return (
    <View
      ref={hostRef}
      collapsable={false}
      pointerEvents="box-none"
      style={styles.host}
      accessibilityViewIsModal
      accessibilityLabel={step.accessibilityLabel ?? step.title}
    >
      {passiveModeActive ? (
        <>
          {/* Purely visual — the dimmed scrim and cutout never receive a
              touch. Nothing is rendered over the spotlight itself, so a
              touch there falls straight through to the real list beneath;
              swipes are counted from the list's own scroll offset (see the
              effect above), not from anything here. Everything *outside*
              the spotlight is still blocked, same as a normal step. */}
          <View
            testID="tour-guide-backdrop"
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            {spotlight}
          </View>
          {outsideSpotlightBlockers}
        </>
      ) : swipeAdvance ? (
        <>
          {/* The dimmed scrim is purely visual and spans the screen the way
              `Spotlight` needs to draw its cutout — but it never receives a
              touch, so it can't widen the gesture's capture area. */}
          <View
            testID="tour-guide-backdrop"
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            {spotlight}
          </View>
          {outsideSpotlightBlockers}
          {/* Touches are captured only over the spotlighted target itself,
              not the whole screen — a gesture tour should only ever touch
              what it's teaching. Falls back to the full screen only for the
              one frame before the target has a measured rect. */}
          <View
            testID="tour-guide-gesture-capture"
            style={[
              styles.gestureCapture,
              state.targetRect
                ? {
                    left: state.targetRect.x,
                    top: state.targetRect.y,
                    width: state.targetRect.width,
                    height: state.targetRect.height,
                  }
                : StyleSheet.absoluteFill,
            ]}
            {...panResponder.panHandlers}
          />
        </>
      ) : (
        <Pressable
          testID="tour-guide-backdrop"
          style={StyleSheet.absoluteFill}
          onPress={(event) => {
            const rect = state.targetRect;
            const pageX = event?.nativeEvent?.pageX;
            const pageY = event?.nativeEvent?.pageY;
            const withinSpotlight =
              rect != null &&
              pageX != null &&
              pageY != null &&
              pageX >= rect.x &&
              pageX <= rect.x + rect.width &&
              pageY >= rect.y &&
              pageY <= rect.y + rect.height;
            if (withinSpotlight && step.onSpotlightPress) {
              step.onSpotlightPress();
              return;
            }
            handleBackdropPress(step.backdropBehavior);
          }}
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
          testID="tour-guide-tooltip-container"
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
  gestureCapture: {
    position: "absolute",
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
