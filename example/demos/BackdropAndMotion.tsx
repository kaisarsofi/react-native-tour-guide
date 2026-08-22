import React from "react";
import { Text, View } from "react-native";
import { TourTarget, useTourGuide, type TourStep } from "react-native-tour";

import { DemoButton } from "../components/DemoButton";
import { Section } from "../components/Section";

/**
 * Three variations of the same two-step tour: tapping the dimmed backdrop
 * either advances or dismisses the tour, a step can auto-advance on a
 * timer, and the spotlight/tooltip transition can be instant instead of
 * animated.
 */
export function BackdropAndMotion() {
  const { startTour, isActive } = useTourGuide();

  const baseSteps = (): TourStep[] => [
    {
      id: "tile-a",
      targetId: "motion-tile-a",
      title: "Tile A",
      description: "First stop.",
    },
    {
      id: "tile-b",
      targetId: "motion-tile-b",
      title: "Tile B",
      description: "Second stop.",
    },
  ];

  return (
    <Section
      index={4}
      title="Backdrop, timing & motion"
      description="Configure what tapping outside the spotlight does, whether a step advances itself, and how transitions animate."
    >
      <View className="flex-row gap-3">
        <TourTarget id="motion-tile-a">
          <View className="flex-1 rounded-xl bg-neutral-100 p-4">
            <Text className="text-sm text-neutral-500">Tile A</Text>
          </View>
        </TourTarget>
        <TourTarget id="motion-tile-b">
          <View className="flex-1 rounded-xl bg-neutral-100 p-4">
            <Text className="text-sm text-neutral-500">Tile B</Text>
          </View>
        </TourTarget>
      </View>

      <View className="flex-row flex-wrap gap-2">
        <DemoButton
          label="Tap backdrop → next"
          variant="outline"
          disabled={isActive}
          onPress={() =>
            startTour(baseSteps(), { defaultBackdropBehavior: "next" })
          }
        />
        <DemoButton
          label="Tap backdrop → dismiss"
          variant="outline"
          disabled={isActive}
          onPress={() =>
            startTour(baseSteps(), { defaultBackdropBehavior: "dismiss" })
          }
        />
        <DemoButton
          label="Auto-advance (1.5s)"
          variant="outline"
          disabled={isActive}
          onPress={() => {
            const steps = baseSteps();
            steps[0]!.autoAdvance = 1500;
            steps[0]!.description = "Advances on its own after 1.5s — no tap needed.";
            startTour(steps);
          }}
        />
        <DemoButton
          label="No animation"
          variant="outline"
          disabled={isActive}
          onPress={() => startTour(baseSteps(), { motion: "none", animationDuration: 0 })}
        />
      </View>
    </Section>
  );
}
