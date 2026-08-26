import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import {
  TourTarget,
  useTourGuide,
  type TooltipProps,
  type TourStep,
} from "@kaisarsofi/react-native-tour-guide";

import { Code } from "../components/Code";
import { DemoButton } from "../components/DemoButton";
import { IconButton } from "../components/mocks";
import { Section } from "../components/Section";

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
      <Text className="mt-1.5 text-sm leading-5 text-violet-100">{step.description}</Text>

      {/* Dismiss sits left as a recessed secondary button, matching the
          built-in tooltip's hierarchy. Both buttons share the same vertical
          padding so their heights line up exactly. */}
      <View className="mt-5 flex-row items-center justify-between">
        <Pressable
          onPress={onSkip}
          className="rounded-full bg-violet-500 px-4 py-2.5 active:opacity-70"
        >
          <Text className="text-sm font-medium text-white">Dismiss</Text>
        </Pressable>
        <Pressable
          onPress={onNext}
          className="rounded-full bg-white px-5 py-2.5 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-violet-700">
            {isLast ? "Got it" : "Continue"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const TOUR_ID = "custom";

export function CustomTooltip() {
  const { startTour, resetTour, isActive, tourId } = useTourGuide();

  const steps: TourStep[] = [
    {
      id: "custom-target",
      targetId: "custom-tooltip-target",
      title: "Fully custom UI",
      description: "renderTooltip swaps out the whole tooltip — layout, buttons, and all.",
      spotlightBorderRadius: 999,
      renderTooltip: (props) => <CardTooltip {...props} />,
    },
  ];

  useEffect(() => {
    startTour(steps, { tourId: TOUR_ID, persist: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <View className="flex-row">
        <TourTarget id="custom-tooltip-target">
          <IconButton icon="chatbubble" badge />
        </TourTarget>
      </View>

      <View className="flex-row">
        <DemoButton
          label={isActive && tourId === TOUR_ID ? "Tour running…" : "Reset"}
          variant="accent"
          disabled={isActive}
          onPress={() => {
            resetTour(TOUR_ID);
            startTour(steps, { tourId: TOUR_ID, persist: true });
          }}
        />
      </View>
    </Section>
  );
}
