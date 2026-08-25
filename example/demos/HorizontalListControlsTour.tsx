import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { FlatList, Pressable, Text, View, useWindowDimensions } from "react-native";
import {
  TourTarget,
  useTourGuide,
  useTourScroll,
  type TourStep,
} from "react-native-tour-guide";

import { Code } from "../components/Code";
import { DemoButton } from "../components/DemoButton";
import { DemoHeader } from "../components/DemoHeader";

const CARD_HEIGHT = 360;

const CATEGORIES = [
  { id: "c0", icon: "sparkles-outline" as const, label: "For you", body: "Picks based on what you open most.", tint: "#EDE9FE", accent: "#6D28D9" },
  { id: "c1", icon: "flame-outline" as const, label: "Trending", body: "What people are browsing right now.", tint: "#FEF3C7", accent: "#B45309" },
  { id: "c2", icon: "star-outline" as const, label: "New", body: "Just added this week.", tint: "#DCFCE7", accent: "#15803D" },
  { id: "c3", icon: "color-palette-outline" as const, label: "Design", body: "Layouts, type, and color systems.", tint: "#DBEAFE", accent: "#1D4ED8" },
  { id: "c4", icon: "code-slash-outline" as const, label: "Engineering", body: "APIs, tooling, and architecture.", tint: "#FCE7F3", accent: "#BE185D" },
  { id: "c5", icon: "archive-outline" as const, label: "Archive", body: "Older collections, still searchable.", tint: "#F1F5F9", accent: "#475569" },
];

function Card({
  item,
  width,
}: {
  item: (typeof CATEGORIES)[number];
  width: number;
}) {
  return (
    <View style={{ width }} className="px-1">
      <View
        style={{ height: CARD_HEIGHT }}
        className="items-center justify-center overflow-hidden rounded-3xl border border-neutral-200 bg-white px-8"
      >
        <View
          style={{ backgroundColor: item.tint }}
          className="h-24 w-24 items-center justify-center rounded-3xl"
        >
          <View
            style={{ backgroundColor: item.accent }}
            className="h-16 w-16 items-center justify-center rounded-2xl"
          >
            <Ionicons name={item.icon} size={32} color="#FFFFFF" />
          </View>
        </View>
        <Text className="mt-7 text-center text-[24px] font-bold text-neutral-900">
          {item.label}
        </Text>
        <Text className="mt-2.5 text-center text-[16px] leading-6 text-neutral-500">
          {item.body}
        </Text>
      </View>
    </View>
  );
}

const BUTTON_SHADOW = {
  shadowColor: "#0A0A0A",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.14,
  shadowRadius: 8,
  elevation: 6,
} as const;

const TOUR_ID = "horizontal-list-controls";

/**
 * One tour. First step: swipe twice on the pager (then that step hides).
 * Then one step on Previous and one step on Next.
 */
export function HorizontalListControlsTour() {
  const { startTour, resetTour, nextStep, isActive, tourId } = useTourGuide();
  const { ref, scrollProps, handle, reset } = useTourScroll({ horizontal: true });
  const isThisTour = isActive && tourId === TOUR_ID;
  // The rail sits inside `mx-10` (40px each side) — computing this from the
  // window synchronously, instead of measuring the rail with `onLayout`,
  // avoids a race where the tour's initial `scroll: { index: 0 }` step could
  // fire against a stale width and land the list mid-page (two cards, each
  // showing half).
  const { width: windowWidth } = useWindowDimensions();
  const pageWidth = windowWidth - 80;

  const scrollByPage = (delta: number) => {
    if (pageWidth <= 0) return;
    const page = Math.round(handle.offsetRef.current.x / pageWidth);
    const next = Math.min(CATEGORIES.length - 1, Math.max(0, page + delta));
    handle.ref.current?.scrollToOffset?.({
      offset: next * pageWidth,
      animated: true,
    });
  };

  const steps: TourStep[] = [
    {
      id: "scroll",
      targetId: "category-rail",
      title: "Swipe the cards",
      description: "One card per screen. Swipe twice, then the tour moves on.",
      swipeHint: { direction: "left", distance: 100 },
      swipeCount: 2,
      scroll: { handle, index: 0, viewPosition: 0 },
      spotlightBorderRadius: 24,
    },
    {
      id: "prev-button",
      targetId: "rail-prev",
      title: "Previous",
      description: "Tap the highlighted arrow — not Next on the tooltip.",
      hideNextButton: true,
      hidePrevButton: true,
      spotlightBorderRadius: 999,
      onSpotlightPress: () => {
        scrollByPage(-1);
        nextStep();
      },
    },
    {
      id: "next-button",
      targetId: "rail-next",
      title: "Next",
      description: "Tap this arrow to move a card and finish the tour.",
      hideNextButton: true,
      hidePrevButton: true,
      spotlightBorderRadius: 999,
      onSpotlightPress: () => {
        scrollByPage(1);
        nextStep();
      },
    },
  ];

  useEffect(() => {
    reset();
    startTour(steps, { tourId: TOUR_ID, persist: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View className="flex-1 px-4 pt-1">
      <DemoHeader
        index={8}
        title="Horizontal + controls"
        description={
          <>
            Paged cards (one per screen). Swipe twice, then tap each arrow —
            those steps use <Code>onSpotlightPress</Code> with no tooltip Next.
          </>
        }
      />

      <View className="flex-1 justify-center">
        <View className="mx-10">
          <TourTarget id="category-rail">
            <View className="overflow-hidden rounded-3xl">
              <FlatList
                ref={ref}
                {...scrollProps}
                horizontal
                pagingEnabled
                data={CATEGORIES}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                getItemLayout={(_, index) => ({
                  length: pageWidth,
                  offset: pageWidth * index,
                  index,
                })}
                renderItem={({ item }) => <Card item={item} width={pageWidth} />}
              />
            </View>
          </TourTarget>

          <View
            className="absolute items-center justify-center"
            style={{ left: -44, top: "50%", marginTop: -32 }}
          >
            <TourTarget id="rail-prev">
              <Pressable
                onPress={() => scrollByPage(-1)}
                style={BUTTON_SHADOW}
                className="h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-white active:opacity-70"
              >
                <Ionicons name="chevron-back" size={26} color="#171717" />
              </Pressable>
            </TourTarget>
          </View>

          <View
            className="absolute items-center justify-center"
            style={{ right: -44, top: "50%", marginTop: -32 }}
          >
            <TourTarget id="rail-next">
              <Pressable
                onPress={() => scrollByPage(1)}
                style={BUTTON_SHADOW}
                className="h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-white active:opacity-70"
              >
                <Ionicons name="chevron-forward" size={26} color="#171717" />
              </Pressable>
            </TourTarget>
          </View>
        </View>
      </View>

      <View className="mb-4 flex-row">
        <DemoButton
          label={isThisTour ? "Tour running…" : "Reset"}
          variant="secondary"
          disabled={isActive}
          onPress={() => {
            reset();
            resetTour(TOUR_ID);
            startTour(steps, { tourId: TOUR_ID, persist: true });
          }}
        />
      </View>
    </View>
  );
}
