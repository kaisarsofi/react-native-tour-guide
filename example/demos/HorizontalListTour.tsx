import { Ionicons } from "@expo/vector-icons";
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
import { DemoHeader } from "../components/DemoHeader";

const CARD_WIDTH = 176;
const CARD_HEIGHT = 220;
const GAP = 12;
const RAIL_HEIGHT = CARD_HEIGHT + 32;

const CATEGORIES = [
  { id: "c0", icon: "sparkles-outline" as const, label: "For you", tint: "#EDE9FE", accent: "#6D28D9" },
  { id: "c1", icon: "flame-outline" as const, label: "Trending", tint: "#FEF3C7", accent: "#B45309" },
  { id: "c2", icon: "star-outline" as const, label: "New", tint: "#DCFCE7", accent: "#15803D" },
  { id: "c3", icon: "color-palette-outline" as const, label: "Design", tint: "#DBEAFE", accent: "#1D4ED8" },
  { id: "c4", icon: "code-slash-outline" as const, label: "Engineering", tint: "#FCE7F3", accent: "#BE185D" },
  { id: "c5", icon: "archive-outline" as const, label: "Archive", tint: "#F1F5F9", accent: "#475569" },
  { id: "c6", icon: "megaphone-outline" as const, label: "Marketing", tint: "#FFE4E6", accent: "#BE123C" },
  { id: "c7", icon: "cash-outline" as const, label: "Finance", tint: "#D1FAE5", accent: "#047857" },
  { id: "c8", icon: "people-outline" as const, label: "People", tint: "#E0E7FF", accent: "#4338CA" },
  { id: "c9", icon: "rocket-outline" as const, label: "Product", tint: "#FEF9C3", accent: "#A16207" },
  { id: "c10", icon: "shield-checkmark-outline" as const, label: "Security", tint: "#CFFAFE", accent: "#0E7490" },
  { id: "c11", icon: "headset-outline" as const, label: "Support", tint: "#FAE8FF", accent: "#A21CAF" },
];

function Card({ item }: { item: (typeof CATEGORIES)[number] }) {
  return (
    <View
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT, backgroundColor: item.tint }}
      className="justify-between rounded-2xl p-4"
    >
      <View
        style={{ backgroundColor: item.accent }}
        className="h-11 w-11 items-center justify-center rounded-xl"
      >
        <Ionicons name={item.icon} size={20} color="#FFFFFF" />
      </View>
      <View>
        <Text style={{ color: item.accent }} className="text-[16px] font-bold" numberOfLines={1}>
          {item.label}
        </Text>
        <Text className="mt-1 text-[13px] text-neutral-500">12 items</Text>
      </View>
    </View>
  );
}

/**
 * Full-screen, edge-to-edge carousel. The swipe hint mimes a left swipe to
 * teach the gesture, then the tour scrolls sideways to reach a card that
 * starts off-screen to the right.
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
      swipeHint: { direction: "left", distance: 100 },
      scroll: { handle, pageSize: CARD_WIDTH + GAP },
      spotlightBorderRadius: 20,
    },
  ];

  return (
    <View className="flex-1 px-4 pt-1">
      <DemoHeader
        index={8}
        title="Horizontal list"
        description={
          <>
            Spotlight stays on the rail, edge-to-edge. Swipe left —{" "}
            <Code>swipeCount</Code> defaults to 3.
          </>
        }
      />

      <View className="flex-1 justify-center">
        <TourTarget id="category-rail">
          <View
            style={{ height: RAIL_HEIGHT }}
            className="-mx-4 justify-center overflow-hidden border-y border-neutral-200 bg-white py-4"
          >
            <FlatList
              ref={ref}
              {...scrollProps}
              horizontal
              data={CATEGORIES}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: GAP }}
              getItemLayout={(_, index) => ({
                length: CARD_WIDTH + GAP,
                offset: (CARD_WIDTH + GAP) * index,
                index,
              })}
              renderItem={({ item }) => <Card item={item} />}
            />
          </View>
        </TourTarget>
      </View>

      <View className="mb-4 flex-row">
        <DemoButton
          label={isThisTour ? "Tour running…" : "Start tour"}
          disabled={isActive}
          onPress={() => {
            reset();
            startTour(steps, { tourId: "horizontal-list" });
          }}
        />
      </View>
    </View>
  );
}
