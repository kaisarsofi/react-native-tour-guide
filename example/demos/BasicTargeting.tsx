import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import { TourTarget, useTourGuide, type TourStep } from "@kaisarsofi/react-native-tour-guide";

import { Code } from "../components/Code";
import { DemoButton } from "../components/DemoButton";
import { Avatar, ComposeButton, SettingsRow } from "../components/mocks";
import { Section } from "../components/Section";

/**
 * Shows the two ways to point a step at a component: a `targetRef` (the
 * avatar) and a `<TourTarget id>` wrapper (the compose button + settings
 * row), plus a `tooltipPosition: "top"` override on the last step.
 */
export function BasicTargeting() {
  const avatarRef = useRef<View>(null);
  const { startTour, resetTour, isActive, tourId } = useTourGuide();
  const isThisTour = isActive && tourId === "targeting";
  const TOUR_ID = "targeting";

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

  // Mirrors a real app: a tour plays itself the first time this screen is
  // seen, then never again — persist:true remembers it, no button needed.
  useEffect(() => {
    startTour(steps, { tourId: TOUR_ID, persist: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <View ref={avatarRef} collapsable={false}>
          <Avatar initials="JD" />
        </View>
        <TourTarget id="compose-button" className="flex-1">
          <ComposeButton />
        </TourTarget>
      </View>

      <TourTarget id="settings-row">
        <SettingsRow label="Notifications" meta="On" />
      </TourTarget>

      <View className="flex-row">
        <DemoButton
          label={isThisTour ? "Tour running…" : "Reset"}
          variant="secondary"
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
