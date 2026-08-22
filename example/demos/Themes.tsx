import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  TourTarget,
  cn,
  darkTheme,
  lightTheme,
  minimalTheme,
  oceanTheme,
  sunsetTheme,
  useTourGuide,
  vibrantTheme,
  type TourGuideTheme,
  type TourStep,
} from "react-native-tour";

import { Section } from "../components/Section";
import { Tile } from "../components/Tile";

const THEMES: { label: string; theme: TourGuideTheme; swatch: string }[] = [
  { label: "Light", theme: lightTheme, swatch: "#6D28D9" },
  { label: "Dark", theme: darkTheme, swatch: "#1E293B" },
  { label: "Minimal", theme: minimalTheme, swatch: "#0F172A" },
  { label: "Vibrant", theme: vibrantTheme, swatch: "#7C3AED" },
  { label: "Ocean", theme: oceanTheme, swatch: "#0F766E" },
  { label: "Sunset", theme: sunsetTheme, swatch: "#EA580C" },
];

/**
 * The same two-step tour run with each bundled theme — every theme is just a
 * bag of `tooltipStyles` + `spotlightStyles` tokens, so nothing about the
 * steps changes.
 */
export function Themes() {
  const { startTour, isActive } = useTourGuide();
  const [active, setActive] = useState("Light");

  const steps: TourStep[] = [
    {
      id: "card-a",
      targetId: "theme-card-a",
      title: "Themed tooltip",
      description:
        "Card colour, button colours, the arrow, the scrim and the pulse ring all come from the theme.",
    },
    {
      id: "card-b",
      targetId: "theme-card-b",
      title: "Same steps, new skin",
      description: "Swap the theme object passed to startTour — nothing else changes.",
    },
  ];

  return (
    <Section
      index={2}
      title="Themes"
      description="Six bundled themes, or compose your own token set with createTheme()."
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
        {THEMES.map(({ label, theme, swatch }) => (
          <Pressable
            key={label}
            disabled={isActive}
            onPress={() => {
              setActive(label);
              startTour(steps, theme);
            }}
            className={cn(
              "flex-row items-center gap-2 rounded-lg border px-3 py-2 active:opacity-70",
              active === label
                ? "border-neutral-900 bg-neutral-900"
                : "border-neutral-200 bg-white",
              isActive && "opacity-40",
            )}
          >
            <View
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: swatch }}
            />
            <Text
              className={cn(
                "text-[13px] font-medium",
                active === label ? "text-white" : "text-neutral-700",
              )}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Section>
  );
}
