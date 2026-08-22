import React, { useRef } from "react";
import { Text, View } from "react-native";
import { TourTarget, useTourGuide, type TourStep } from "react-native-tour-guide";

import { Code } from "../components/Code";
import { DemoButton } from "../components/DemoButton";
import { Section } from "../components/Section";
import { Tile } from "../components/Tile";

/**
 * Shows the two ways to point a step at a component: a `targetRef` (the
 * avatar) and a `<TourTarget id>` wrapper (the compose button + settings
 * row), plus a `tooltipPosition: "top"` override on the last step.
 */
export function BasicTargeting() {
  const avatarRef = useRef<View>(null);
  const { startTour, isActive } = useTourGuide();

  const steps: TourStep[] = [
    {
      id: "avatar",
      targetRef: avatarRef,
      title: "Targeted by ref",
      description: "This avatar is highlighted via a plain React targetRef.",
      spotlightBorderRadius: 999,
    },
    {
      id: "compose",
      targetId: "compose-button",
      title: "Targeted by id",
      description: "This button is wrapped in <TourTarget> — no ref needed.",
      spotlightBorderRadius: 16,
    },
    {
      id: "settings",
      targetId: "settings-row",
      title: "Positioned above",
      description: "tooltipPosition: \"top\" flips the tooltip above the target.",
      tooltipPosition: "top",
    },
  ];

  return (
    <Section
      index={1}
      title="Targeting"
      description={
        <>
          Highlight a component with <Code>targetRef</Code>, or wrap it in{" "}
          <Code>{"<TourTarget id>"}</Code> and reference the id.
        </>
      }
    >
      <View className="flex-row items-center gap-3">
        <View
          ref={avatarRef}
          collapsable={false}
          className="h-11 w-11 items-center justify-center rounded-full bg-violet-600"
        >
          <Text className="text-sm font-semibold text-white">RN</Text>
        </View>
        <TourTarget id="compose-button" className="flex-1">
          <Tile label="Compose button" />
        </TourTarget>
      </View>

      <TourTarget id="settings-row">
        <Tile label="Settings row" />
      </TourTarget>

      <View className="flex-row">
        <DemoButton
          label={isActive ? "Tour running…" : "Start tour"}
          disabled={isActive}
          onPress={() => startTour(steps)}
        />
      </View>
    </Section>
  );
}
