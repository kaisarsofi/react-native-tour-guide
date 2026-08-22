import React from "react";
import { FlatList, Text, View } from "react-native";
import {
  TourTarget,
  useTourGuide,
  useTourScroll,
  type TourStep,
} from "react-native-tour-guide";

import { Code } from "../components/Code";
import { DemoButton } from "../components/DemoButton";
import { Section } from "../components/Section";

const CARD_WIDTH = 132;
const GAP = 10;

const CATEGORIES = [
  { id: "c0", label: "For you", tint: "#EDE9FE", accent: "#6D28D9" },
  { id: "c1", label: "Trending", tint: "#FEF3C7", accent: "#B45309" },
  { id: "c2", label: "New", tint: "#DCFCE7", accent: "#15803D" },
  { id: "c3", label: "Design", tint: "#DBEAFE", accent: "#1D4ED8" },
  { id: "c4", label: "Engineering", tint: "#FCE7F3", accent: "#BE185D" },
  { id: "c5", label: "Archive", tint: "#F1F5F9", accent: "#475569" },
];

function Card({ item }: { item: (typeof CATEGORIES)[number] }) {
  return (
    <View
      style={{ width: CARD_WIDTH, backgroundColor: item.tint }}
      className="rounded-xl p-3"
    >
      <View
        style={{ backgroundColor: item.accent }}
        className="h-7 w-7 rounded-lg opacity-90"
      />
      <Text
        style={{ color: item.accent }}
        className="mt-6 text-[13px] font-semibold"
        numberOfLines={1}
      >
        {item.label}
      </Text>
      <Text className="mt-0.5 text-xs text-neutral-500">12 items</Text>
    </View>
  );
}

/**
 * A horizontal carousel. The swipe hint mimes a left swipe to teach the
 * gesture, then the tour scrolls sideways to reach a card that starts
 * off-screen to the right.
 */
export function HorizontalListTour() {
  const { startTour, isActive, tourId } = useTourGuide();
  const { ref, scrollProps, handle, reset } = useTourScroll({ horizontal: true });
  const isThisTour = isActive && tourId === "horizontal-list";

  const steps: TourStep[] = [
    {
      id: "rail",
      targetId: "category-rail",
      title: "Browse categories",
      description: "Swipe left to see them all.",
      swipeHint: { direction: "left", distance: 90 },
      scroll: { handle, pageSize: CARD_WIDTH + GAP },
      spotlightBorderRadius: 16,
    },
  ];

  return (
    <Section
      index={8}
      title="Horizontal list"
      description={
        <>
          Spotlight stays on the rail. Swipe left —{" "}
          <Code>swipeCount</Code> defaults to 3.
        </>
      }
    >
      <TourTarget id="category-rail">
        <View className="overflow-hidden rounded-xl border border-neutral-200 py-3">
          <FlatList
            ref={ref}
            {...scrollProps}
            horizontal
            data={CATEGORIES}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, gap: GAP }}
            getItemLayout={(_, index) => ({
              length: CARD_WIDTH + GAP,
              offset: (CARD_WIDTH + GAP) * index,
              index,
            })}
            renderItem={({ item }) => (
              <Card item={item} />
            )}
          />
        </View>
      </TourTarget>

      <View className="flex-row">
        <DemoButton
          label={isThisTour ? "Tour running…" : "Start tour"}
          disabled={isActive}
          onPress={() => {
            reset();
            startTour(steps, { tourId: "horizontal-list" });
          }}
        />
      </View>
    </Section>
  );
}
