import React, { useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { TourTarget, useTourGuide, type TourStep } from "react-native-tour";

import { DemoButton } from "../components/DemoButton";
import { Section } from "../components/Section";

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
      description: "This avatar is highlighted via a plain React `targetRef`.",
      spotlightBorderRadius: 999,
    },
    {
      id: "compose",
      targetId: "compose-button",
      title: "Targeted by id",
      description:
        "This button is wrapped in <TourTarget id=\"compose-button\"> — no ref needed.",
      spotlightBorderRadius: 16,
    },
    {
      id: "settings",
      targetId: "settings-row",
      title: "Positioned above",
      description: "tooltipPosition: \"top\" flips the tooltip to sit above the target.",
      tooltipPosition: "top",
    },
  ];

  return (
    <Section
      index={1}
      title="Targeting"
      description="Highlight a component with targetRef, or wrap it in <TourTarget id> and reference the id — no ref plumbing required."
    >
      <View className="flex-row items-center gap-3">
        <View ref={avatarRef} collapsable={false} className="h-10 w-10 rounded-full bg-violet-500" />
        <TourTarget id="compose-button">
          <Pressable className="rounded-full bg-neutral-900 px-4 py-2.5">
            <Text className="text-sm font-medium text-white">Compose</Text>
          </Pressable>
        </TourTarget>
      </View>

      <TourTarget id="settings-row">
        <View className="rounded-xl bg-neutral-100 p-3">
          <Text className="text-sm text-neutral-500">Settings row</Text>
        </View>
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
