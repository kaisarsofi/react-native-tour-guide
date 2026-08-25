import React, { useState } from "react";
import { View } from "react-native";
import { TourTarget, useTourGuide, type TourStep } from "react-native-tour-guide";

import { Badge, Code } from "../components/Code";
import { DemoButton } from "../components/DemoButton";
import { OnboardingBanner } from "../components/mocks";
import { Section } from "../components/Section";

const TOUR_ID = "example-onboarding";

const STATUS_LABEL = {
  idle: "Not shown",
  shown: "Completed",
  skipped: "Skipped (already done)",
} as const;

/**
 * `persist: true` is all this takes — no storage adapter, no wrapper hook.
 * It's remembered in-memory for this app session by default; pass a real
 * adapter (AsyncStorage, MMKV, ...) to <TourGuideProvider storage={...}>
 * once, app-wide, to survive restarts too.
 */
export function Persistence() {
  const { startTour, resetTour, isActive } = useTourGuide();
  const [status, setStatus] = useState<"idle" | "shown" | "skipped">("idle");

  const steps: TourStep[] = [
    {
      id: "onboarding-step",
      targetId: "onboarding-target",
      title: "Welcome!",
      description: "This only plays once per tourId — try tapping the button again.",
      spotlightBorderRadius: 16,
    },
  ];

  return (
    <Section
      index={5}
      title="Play once (persistence)"
      description={
        <>
          <Code>{"persist: true"}</Code> on <Code>startTour</Code> skips a tour that
          already completed — no storage setup required.
        </>
      }
    >
      <TourTarget id="onboarding-target">
        <OnboardingBanner />
      </TourTarget>

      <View className="flex-row items-center justify-between">
        <Badge
          tone={status === "shown" ? "success" : status === "skipped" ? "accent" : "neutral"}
        >
          {STATUS_LABEL[status]}
        </Badge>
      </View>

      <View className="flex-row gap-2">
        <DemoButton
          label="Show onboarding"
          disabled={isActive}
          onPress={() => {
            if (status === "shown") setStatus("skipped");
            startTour(steps, {
              tourId: TOUR_ID,
              persist: true,
              onTourEnd: (completed) => {
                if (completed) setStatus("shown");
              },
            });
          }}
        />
        <DemoButton
          label="Reset"
          variant="secondary"
          onPress={() => {
            resetTour(TOUR_ID);
            setStatus("idle");
          }}
        />
      </View>
    </Section>
  );
}
