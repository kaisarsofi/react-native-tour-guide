import React from "react";
import { Text, View } from "react-native";
import {
  TourTarget,
  darkTheme,
  lightTheme,
  minimalTheme,
  useTourGuide,
  vibrantTheme,
  type TourGuideTheme,
  type TourStep,
} from "react-native-tour";

import { DemoButton } from "../components/DemoButton";
import { Section } from "../components/Section";

const THEMES: { label: string; theme: TourGuideTheme; variant: "dark" | "accent" | "outline" }[] = [
  { label: "Light", theme: lightTheme, variant: "outline" },
  { label: "Dark", theme: darkTheme, variant: "dark" },
  { label: "Minimal", theme: minimalTheme, variant: "outline" },
  { label: "Vibrant", theme: vibrantTheme, variant: "accent" },
];

/**
 * Same two-step tour, run four times with the four bundled themes, to show
 * how `tooltipClassNames` + `spotlightStyles` change the look without
 * touching a single step definition.
 */
export function Themes() {
  const { startTour, isActive } = useTourGuide();

  const steps: TourStep[] = [
    {
      id: "card-a",
      targetId: "theme-card-a",
      title: "Card A",
      description: "The tooltip and spotlight dim both come from the active theme.",
    },
    {
      id: "card-b",
      targetId: "theme-card-b",
      title: "Card B",
      description: "Swap the theme object passed to startTour — nothing else changes.",
    },
  ];

  return (
    <Section
      index={2}
      title="Themes"
      description="lightTheme, darkTheme, minimalTheme, vibrantTheme — or build your own with createTheme()."
    >
      <View className="flex-row gap-3">
        <TourTarget id="theme-card-a">
          <View className="flex-1 rounded-xl bg-neutral-100 p-4">
            <Text className="text-sm text-neutral-500">Card A</Text>
          </View>
        </TourTarget>
        <TourTarget id="theme-card-b">
          <View className="flex-1 rounded-xl bg-neutral-100 p-4">
            <Text className="text-sm text-neutral-500">Card B</Text>
          </View>
        </TourTarget>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {THEMES.map(({ label, theme, variant }) => (
          <DemoButton
            key={label}
            label={label}
            variant={variant}
            disabled={isActive}
            onPress={() => startTour(steps, { ...theme, showStepCounter: true })}
          />
        ))}
      </View>
    </Section>
  );
}
