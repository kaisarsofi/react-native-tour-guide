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
import { Tile } from "../components/Tile";

const THEMES: { label: string; theme: TourGuideTheme; variant: "primary" | "accent" | "secondary" }[] = [
  { label: "Light", theme: lightTheme, variant: "secondary" },
  { label: "Dark", theme: darkTheme, variant: "primary" },
  { label: "Minimal", theme: minimalTheme, variant: "secondary" },
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
      <View className="flex-row gap-2">
        <TourTarget id="theme-card-a" className="flex-1">
          <Tile label="Card A" />
        </TourTarget>
        <TourTarget id="theme-card-b" className="flex-1">
          <Tile label="Card B" />
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
