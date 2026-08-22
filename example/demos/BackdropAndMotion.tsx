import React from "react";
import { View } from "react-native";
import { TourTarget, useTourGuide, type TourStep } from "react-native-tour-guide";

import { Code } from "../components/Code";
import { DemoButton } from "../components/DemoButton";
import { FeedCard } from "../components/mocks";
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
      title: "Product update",
      description: "First stop.",
    },
    {
      id: "tile-b",
      targetId: "motion-tile-b",
      title: "New feature",
      description: "Second stop.",
    },
  ];

  return (
    <Section
      index={4}
      title="Backdrop, timing & motion"
      description={
        <>
          <Code>backdropBehavior</Code>, <Code>autoAdvance</Code>, and{" "}
          <Code>{'motion: "none"'}</Code> — configured per step or for the whole tour.
        </>
      }
    >
      <View className="flex-row gap-2">
        <TourTarget id="motion-tile-a" className="flex-1">
          <FeedCard title="Product update" meta="2 min read" />
        </TourTarget>
        <TourTarget id="motion-tile-b" className="flex-1">
          <FeedCard title="New feature" meta="5 min read" />
        </TourTarget>
      </View>

      <View className="flex-row flex-wrap gap-2">
        <DemoButton
          label="Tap backdrop → next"
          variant="secondary"
          disabled={isActive}
          onPress={() =>
            startTour(baseSteps(), { defaultBackdropBehavior: "next" })
          }
        />
        <DemoButton
          label="Tap backdrop → dismiss"
          variant="secondary"
          disabled={isActive}
          onPress={() =>
            startTour(baseSteps(), { defaultBackdropBehavior: "dismiss" })
          }
        />
        <DemoButton
          label="Auto-advance (1.5s)"
          variant="secondary"
          disabled={isActive}
          onPress={() => {
            const steps = baseSteps().map((step, index) => ({
              ...step,
              autoAdvance: 1500,
              description:
                index === 0
                  ? "Advances on its own after 1.5s — no tap needed."
                  : "Last stop. Closes on its own after 1.5s.",
            }));
            startTour(steps);
          }}
        />
        <DemoButton
          label="No animation"
          variant="secondary"
          disabled={isActive}
          onPress={() => startTour(baseSteps(), { motion: "none", animationDuration: 0 })}
        />
      </View>
    </Section>
  );
}
