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
import { computeTooltipLayout, resolveSpotlightPadding } from "../utils/geometry";
import { waitForScrollSettle } from "../utils/scroll";
import {
  createDragFrameScheduler,
  dragScrollHandle,
  isSwipeAdvanceEnabled,
  isTooltipHidden,
  pageIndexFromOffset,
  resolveCountedSwipe,
  resolvePassivePageGesture,
  resolveStepScrollOptions,
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
  const stepScrollOptions = resolveStepScrollOptions(step ?? undefined);

  // A target with a bound, subscribable scroll handle is already natively
  // scrollable — count swipes by watching where the list actually settles
  // instead of capturing touches with a gesture responder. This only holds
  // for a list that genuinely settles onto discrete pages by itself
  // (`pagingEnabled`, or a step that scrolls to an explicit `index`): a
  // free-scrolling list given a `pageSize` alone doesn't snap to
  // `pageSize`-multiples at all, so passively watching for crossings of
  // them would over- or under-count relative to how far one physical swipe
  // actually carried it (a fast fling can cross several at once; a short
  // deliberate swipe can cross none). That documented pattern — "spotlight
  // stays on a plain ScrollView/FlatList, `scroll.pageSize` is a virtual
  // per-swipe distance" — still needs the deterministic one-swipe-per-
  // gesture counting the capture path below provides, so it's deliberately
  // excluded here even though its handle can be subscribed to.
  const passivePageSize = (() => {
    if (!scrollHandle?.subscribe) return null;
    const isPaging = scrollHandle.pagingEnabled || stepScrollOptions?.index != null;
    if (!isPaging) return null;
    // An explicit `pageSize` on an otherwise-paging step overrides the
    // measured target size; otherwise a full-bleed paging list's page *is*
    // its target, so fall back to that.
    if (stepScrollOptions?.pageSize != null) return stepScrollOptions.pageSize;
    const rect = state.targetRect;
    if (!rect) return null;
    return scrollHandle.horizontal ? rect.width : rect.height;
  })();
  const passiveModeActive =
    visible &&
    swipeAdvance &&
    scrollHandle?.subscribe != null &&
    passivePageSize != null;

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

  // Passive counterpart to the PanResponder below: no touch is ever
  // captured here. A page-index change observed from the list's own
  // `onScroll` is counted exactly like a captured swipe would be, but the
  // native list is the only thing driving its own scroll — nothing here
  // ever calls `scrollTo`/`scrollToIndex` on it.
  useEffect(() => {
    if (!passiveModeActive || !scrollHandle?.subscribe || passivePageSize == null)
      return;

    const axis = scrollHandle.horizontal ? "x" : "y";
    let lastIndex = pageIndexFromOffset(
      scrollHandle.offsetRef.current[axis],
      passivePageSize,
    );

    return scrollHandle.subscribe((offset) => {
      const hint = hintRef.current;
      if (!hint) return;
      const currentIndex = pageIndexFromOffset(offset[axis], passivePageSize);
      if (currentIndex === lastIndex) return;
      const gesture = resolvePassivePageGesture(
        hint.direction,
        currentIndex - lastIndex,
      );
      lastIndex = currentIndex;
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
  }, [passiveModeActive, scrollHandle, passivePageSize, state.currentIndex]);

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
        // Nothing is captured here: `pointerEvents="none"` lets every touch
        // fall straight through to the real list beneath. Swipes are being
        // counted from the list's own scroll offset (see the effect above),
        // not from anything this view sees.
        <View
          testID="tour-guide-backdrop"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          {spotlight}
        </View>
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
