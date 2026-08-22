import React from "react";
import { Pressable, Text, View } from "react-native";

import type { TooltipProps } from "../types";
import { cn } from "../utils/cn";

export function Tooltip({
  step,
  stepIndex,
  totalSteps,
  isFirst,
  isLast,
  config,
  onNext,
  onPrev,
  onSkip,
}: TooltipProps) {
  const classNames = config.tooltipClassNames ?? {};
  const showSkip = !step.hideSkipButton && !isLast;
  const showPrev = !step.hidePrevButton && !isFirst;
  const showNext = !step.hideNextButton;

  return (
    <View
      className={cn("w-full rounded-2xl p-4 shadow-lg", classNames.container)}
      accessibilityRole="alert"
      accessibilityLabel={step.accessibilityLabel ?? step.title}
    >
      {config.showStepCounter && (
        <Text className={cn("mb-1 text-xs font-medium", classNames.stepCounter)}>
          {stepIndex + 1} / {totalSteps}
        </Text>
      )}

      <Text className={cn("text-base font-semibold", classNames.title)}>
        {step.title}
      </Text>
      <Text className={cn("mt-1 text-sm", classNames.description)}>
        {step.description}
      </Text>

      {config.showProgressDots && (
        <View className="mt-3 flex-row gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                i === stepIndex
                  ? (classNames.progressDotActive ?? "bg-neutral-900")
                  : (classNames.progressDot ?? "bg-neutral-200"),
              )}
            />
          ))}
        </View>
      )}

      <View className={cn("mt-4 flex-row items-center justify-between", classNames.footer)}>
        <View className="flex-row items-center gap-3">
          {showSkip && (
            <Pressable
              onPress={onSkip}
              hitSlop={8}
              className={classNames.skipButton}
            >
              <Text className={cn("text-sm", classNames.skipButtonText)}>
                {config.skipButtonText}
              </Text>
            </Pressable>
          )}
        </View>

        <View className="flex-row items-center gap-2">
          {showPrev && (
            <Pressable
              onPress={onPrev}
              className={cn(
                "rounded-full px-3.5 py-2",
                classNames.prevButton,
              )}
            >
              <Text className={cn("text-sm font-medium", classNames.prevButtonText)}>
                {config.prevButtonText}
              </Text>
            </Pressable>
          )}
          {showNext && (
            <Pressable
              onPress={onNext}
              className={cn(
                "rounded-full px-3.5 py-2",
                classNames.nextButton,
              )}
            >
              <Text className={cn("text-sm font-medium", classNames.nextButtonText)}>
                {isLast ? config.doneButtonText : config.nextButtonText}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
