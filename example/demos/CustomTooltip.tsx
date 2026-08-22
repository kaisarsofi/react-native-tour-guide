import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  TourTarget,
  useTourGuide,
  type TooltipProps,
  type TourStep,
} from "react-native-tour";

import { Code } from "../components/Code";
import { DemoButton } from "../components/DemoButton";
import { Section } from "../components/Section";
import { Tile } from "../components/Tile";

/**
 * `renderTooltip` gets the same props the built-in <Tooltip> receives
 * (step, index/total, isFirst/isLast, config, and next/prev/skip callbacks)
 * — return whatever you want instead.
 */
function CardTooltip({ step, isLast, onNext, onSkip }: TooltipProps) {
  return (
    <View className="w-full rounded-3xl bg-violet-600 p-5">
      <Text className="text-xs font-semibold uppercase tracking-wide text-violet-200">
        Custom tooltip
      </Text>
      <Text className="mt-1 text-lg font-bold text-white">{step.title}</Text>
      <Text className="mt-1 text-sm text-violet-100">{step.description}</Text>
      <View className="mt-4 flex-row justify-end gap-4">
        <Pressable onPress={onSkip} hitSlop={8}>
          <Text className="text-sm text-violet-200">Dismiss</Text>
        </Pressable>
        <Pressable onPress={onNext} className="rounded-full bg-white px-4 py-2">
          <Text className="text-sm font-semibold text-violet-700">
            {isLast ? "Got it" : "Continue"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function CustomTooltip() {
  const { startTour, isActive } = useTourGuide();

  const steps: TourStep[] = [
    {
      id: "custom-target",
      targetId: "custom-tooltip-target",
      title: "Fully custom UI",
      description: "renderTooltip swaps out the whole tooltip — layout, buttons, and all.",
      renderTooltip: (props) => <CardTooltip {...props} />,
    },
  ];

  return (
    <Section
      index={3}
      title="Custom tooltip"
      description={
        <>
          Pass <Code>renderTooltip</Code> on a step (or in the tour config) to replace the
          built-in tooltip entirely.
        </>
      }
    >
      <TourTarget id="custom-tooltip-target">
        <Tile label="Highlighted element" />
      </TourTarget>

      <View className="flex-row">
        <DemoButton
          label={isActive ? "Tour running…" : "Show custom tooltip"}
          variant="accent"
          disabled={isActive}
          onPress={() => startTour(steps)}
        />
      </View>
    </Section>
  );
}
