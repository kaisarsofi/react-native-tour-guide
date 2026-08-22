import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

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

  const w = t.borderWidth;
  const shift = -ARROW_SIZE / 2;
  const borders: Record<Placement, ViewStyle> = {
    bottom: { borderTopWidth: w, borderLeftWidth: w },
    top: { borderBottomWidth: w, borderRightWidth: w },
    right: { borderBottomWidth: w, borderLeftWidth: w },
    left: { borderTopWidth: w, borderRightWidth: w },
  };

  if (placement === "bottom" || placement === "top") {
    const left = clamp(offset - ARROW_SIZE / 2, inset, t.maxWidth - inset);
    const edge = placement === "bottom" ? { top: shift } : { bottom: shift };
    return (
      <View pointerEvents="none" style={[base, edge, { left }, borders[placement]]} />
    );
  }

  const top = clamp(offset - ARROW_SIZE / 2, inset, 400);
  const edge = placement === "right" ? { left: shift } : { right: shift };
  return (
    <View pointerEvents="none" style={[base, edge, { top }, borders[placement]]} />
  );
}

/**
 * NativeWind remaps `Pressable` `style` (including function styles) through
 * CSS, which drops `backgroundColor`. Keep the pill chrome on a `View`.
 */
function FooterButton({
  label,
  onPress,
  backgroundColor,
  textColor,
  buttonStyle,
  textStyle,
}: {
  label: string;
  onPress: () => void;
  backgroundColor: string;
  textColor: string;
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {({ pressed }) => (
        <View
          style={[
            styles.button,
            { backgroundColor },
            buttonStyle,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.buttonText, { color: textColor }, textStyle]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
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
  const slot = config.styles ?? {};
  const showSkip = !step.hideControls && !step.hideSkipButton && !isLast;
  const showPrev = !step.hideControls && !step.hidePrevButton && !isFirst;
  const showNext = !step.hideControls && !step.hideNextButton;
  // Drop the whole row rather than leaving an empty band of padding.
  const showFooter = showSkip || showPrev || showNext;

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
        slot.container,
      ]}
    >
      {t.showArrow && <Arrow placement={placement} offset={arrowOffset} styles={t} />}

      {(config.showStepCounter || config.showProgressDots) && (
        <View style={styles.meta}>
          {config.showStepCounter && (
            <Text
              style={[styles.counter, { color: t.stepCounterColor }, slot.stepCounter]}
            >
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
                    slot.progressDot,
                    i === stepIndex && slot.progressDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      <Text style={[styles.title, { color: t.titleColor }, slot.title]}>
        {step.title}
      </Text>
      <Text
        style={[styles.description, { color: t.descriptionColor }, slot.description]}
      >
        {step.description}
      </Text>

      {showFooter && (
        <View style={[styles.footer, slot.footer]}>
          <View style={styles.footerLeft}>
            {showSkip && (
              <Pressable onPress={onSkip} hitSlop={10} accessibilityRole="button">
                {({ pressed }) => (
                  <Text
                    style={[
                      styles.skipText,
                      { color: t.skipButtonTextColor },
                      slot.skipButtonText,
                      pressed && styles.pressed,
                    ]}
                  >
                    {config.skipButtonText}
                  </Text>
                )}
              </Pressable>
            )}
          </View>

          <View style={styles.footerRight}>
            {showPrev && (
              <FooterButton
                label={config.prevButtonText}
                onPress={onPrev}
                backgroundColor={t.secondaryButtonColor}
                textColor={t.secondaryButtonTextColor}
                buttonStyle={slot.secondaryButton}
                textStyle={slot.secondaryButtonText}
              />
            )}
            {showNext && (
              <FooterButton
                label={isLast ? config.doneButtonText : config.nextButtonText}
                onPress={onNext}
                backgroundColor={t.primaryButtonColor}
                textColor={t.primaryButtonTextColor}
                buttonStyle={[styles.buttonPrimary, slot.primaryButton]}
                textStyle={slot.primaryButtonText}
              />
            )}
          </View>
        </View>
      )}
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
