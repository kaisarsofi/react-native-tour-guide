import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import type { Placement, TooltipProps, TooltipStyles } from "../types";

const ARROW_SIZE = 12;

/** Rotated square tucked under the card edge so it reads as a caret. */
function Arrow({
  placement,
  offset,
  styles: t,
}: {
  placement: Placement;
  offset: number;
  styles: Required<TooltipStyles>;
}) {
  const base = {
    position: "absolute" as const,
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    backgroundColor: t.backgroundColor,
    borderColor: t.borderColor,
    transform: [{ rotate: "45deg" }],
  };

  // The caret sits on the edge facing the target, nudged to line up with the
  // target's centre but kept clear of the card's rounded corners.
  const clamp = (v: number, min: number, max: number) =>
    Math.min(Math.max(v, min), Math.max(min, max));
  const inset = t.borderRadius + ARROW_SIZE;

  if (placement === "bottom" || placement === "top") {
    const isBottom = placement === "bottom";
    return (
      <View
        pointerEvents="none"
        style={[
          base,
          {
            left: clamp(offset - ARROW_SIZE / 2, inset, t.maxWidth - inset),
            [isBottom ? "top" : "bottom"]: -ARROW_SIZE / 2,
            borderTopWidth: isBottom ? t.borderWidth : 0,
            borderLeftWidth: isBottom ? t.borderWidth : 0,
            borderBottomWidth: isBottom ? 0 : t.borderWidth,
            borderRightWidth: isBottom ? 0 : t.borderWidth,
          },
        ]}
      />
    );
  }

  const isRight = placement === "right";
  return (
    <View
      pointerEvents="none"
      style={[
        base,
        {
          top: clamp(offset - ARROW_SIZE / 2, inset, 400),
          [isRight ? "left" : "right"]: -ARROW_SIZE / 2,
          borderBottomWidth: isRight ? t.borderWidth : 0,
          borderLeftWidth: isRight ? t.borderWidth : 0,
          borderTopWidth: isRight ? 0 : t.borderWidth,
          borderRightWidth: isRight ? 0 : t.borderWidth,
        },
      ]}
    />
  );
}

export function Tooltip({
  step,
  stepIndex,
  totalSteps,
  isFirst,
  isLast,
  placement,
  arrowOffset,
  config,
  onNext,
  onPrev,
  onSkip,
}: TooltipProps) {
  const t = config.tooltipStyles;
  const showSkip = !step.hideSkipButton && !isLast;
  const showPrev = !step.hidePrevButton && !isFirst;
  const showNext = !step.hideNextButton;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel={step.accessibilityLabel ?? step.title}
      style={[
        styles.card,
        t.shadow && styles.shadow,
        {
          backgroundColor: t.backgroundColor,
          borderRadius: t.borderRadius,
          borderColor: t.borderColor,
          borderWidth: t.borderWidth,
        },
      ]}
    >
      {t.showArrow && (
        <Arrow placement={placement} offset={arrowOffset} styles={t} />
      )}

      {(config.showStepCounter || config.showProgressDots) && (
        <View style={styles.meta}>
          {config.showStepCounter && (
            <Text style={[styles.counter, { color: t.stepCounterColor }]}>
              {stepIndex + 1} of {totalSteps}
            </Text>
          )}
          {config.showProgressDots && (
            <View style={styles.dots}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === stepIndex && styles.dotActive,
                    {
                      backgroundColor:
                        i === stepIndex ? t.progressDotActiveColor : t.progressDotColor,
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      <Text style={[styles.title, { color: t.titleColor }]}>{step.title}</Text>
      <Text style={[styles.description, { color: t.descriptionColor }]}>
        {step.description}
      </Text>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          {showSkip && (
            <Pressable
              onPress={onSkip}
              hitSlop={10}
              accessibilityRole="button"
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Text style={[styles.skipText, { color: t.skipButtonTextColor }]}>
                {config.skipButtonText}
              </Text>
            </Pressable>
          )}
        </View>

        <View style={styles.footerRight}>
          {showPrev && (
            <Pressable
              onPress={onPrev}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: t.secondaryButtonColor },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.buttonText, { color: t.secondaryButtonTextColor }]}>
                {config.prevButtonText}
              </Text>
            </Pressable>
          )}
          {showNext && (
            <Pressable
              onPress={onNext}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.button,
                styles.buttonPrimary,
                { backgroundColor: t.primaryButtonColor },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.buttonText, { color: t.primaryButtonTextColor }]}>
                {isLast ? config.doneButtonText : config.nextButtonText}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.22,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  counter: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  description: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: "auto",
  },
  skipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimary: {
    minWidth: 84,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.75,
  },
});
