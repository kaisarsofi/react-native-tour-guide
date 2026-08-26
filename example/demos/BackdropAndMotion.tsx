import React, { useEffect } from "react";
import { View } from "react-native";
import { TourTarget, useTourGuide, type TourStep } from "@kaisarsofi/react-native-tour-guide";

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

  // Spells out what tapping the dimmed backdrop actually does — that's not
  // obvious from the tooltip alone. Skip stays available too (the built-in
  // tooltip shows it by default on every step but the last).
  const backdropSteps = (behavior: "next" | "dismiss"): TourStep[] =>
    baseSteps().map((step, index) => ({
      ...step,
      description:
        behavior === "next"
          ? index === 0
            ? "Tap anywhere on the dimmed background to continue — or use Skip."
            : "Tap anywhere to finish, or Skip."
          : "Tap anywhere on the dimmed background to dismiss the tour — or use Skip.",
    }));

  // Auto-plays the first variant (tap backdrop → next) once, like the rest
  // of the example — the other three buttons stay manual, so every variant
  // is still explorable on repeat visits.
  useEffect(() => {
    startTour(backdropSteps("next"), {
      defaultBackdropBehavior: "next",
      tourId: "backdrop-motion",
      persist: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            startTour(backdropSteps("next"), { defaultBackdropBehavior: "next" })
          }
        />
        <DemoButton
          label="Tap backdrop → dismiss"
          variant="secondary"
          disabled={isActive}
          onPress={() =>
            startTour(backdropSteps("dismiss"), { defaultBackdropBehavior: "dismiss" })
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
