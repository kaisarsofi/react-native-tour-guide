import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { FlatList, Text, View, useWindowDimensions } from "react-native";
import {
  TourTarget,
  cn,
  useTourGuide,
  useTourScroll,
  type TourStep,
} from "react-native-tour-guide";

import { Code } from "../components/Code";
import { DemoButton } from "../components/DemoButton";
import { DemoHeader } from "../components/DemoHeader";

const PAGES = [
  {
    id: "p0",
    icon: "wallet-outline" as const,
    title: "Track spending",
    body: "Every transaction, categorised automatically.",
  },
  {
    id: "p1",
    icon: "pie-chart-outline" as const,
    title: "See the split",
    body: "Where your money actually goes each month.",
  },
  {
    id: "p2",
    icon: "trophy-outline" as const,
    title: "Hit your goals",
    body: "Set a target and we'll keep you on pace.",
  },
  {
    id: "p3",
    icon: "notifications-outline" as const,
    title: "Stay on budget",
    body: "A nudge before you overspend a category.",
  },
  {
    id: "p4",
    icon: "people-outline" as const,
    title: "Split with friends",
    body: "Track shared bills without the spreadsheet.",
  },
];

/**
 * Full-screen paged carousel. One spotlight stays on the pager; each swipe
 * advances a page. The third swipe ends the tour.
 */
export function PaginatedCardsTour() {
  const { startTour, isActive, tourId } = useTourGuide();
  const { ref, scrollProps, handle, reset } = useTourScroll({ horizontal: true });
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const isThisTour = isActive && tourId === "paginated";

  // The pager sits inside the screen's own side padding.
  const pageWidth = width - 32;

  const steps: TourStep[] = [
    {
      id: "pager",
      targetId: "onboarding-pager",
      title: "A paged walkthrough",
      description: "Swipe left to move between pages.",
      swipeHint: { direction: "left", distance: 100 },
      scroll: { handle, index: 0, viewPosition: 0 },
      // Defaults to 3. Pass swipeCount (or startTour's swipeCount) to change it.
      spotlightBorderRadius: 24,
    },
  ];

  return (
    <View className="flex-1 px-4 pt-1">
      <DemoHeader
        index={9}
        title="Paginated cards"
        description={
          <>
            Full-screen pager. Spotlight stays put — three swipes by default (
            <Code>swipeCount</Code>), then the tour ends.
          </>
        }
      />

      <TourTarget id="onboarding-pager" style={{ flex: 1 }}>
        <View className="flex-1 overflow-hidden rounded-3xl border border-neutral-200">
          <FlatList
            ref={ref}
            {...scrollProps}
            style={{ flex: 1 }}
            horizontal
            pagingEnabled
            data={PAGES}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) =>
              setPage(Math.round(event.nativeEvent.contentOffset.x / pageWidth))
            }
            getItemLayout={(_, index) => ({
              length: pageWidth,
              offset: pageWidth * index,
              index,
            })}
            renderItem={({ item }) => (
              <View style={{ width: pageWidth }} className="flex-1 items-center justify-center px-10">
                <View className="h-24 w-24 items-center justify-center rounded-3xl bg-violet-100">
                  <Ionicons name={item.icon} size={40} color="#6D28D9" />
                </View>
                <Text className="mt-7 text-center text-[22px] font-bold text-neutral-900">
                  {item.title}
                </Text>
                <Text className="mt-2 text-center text-[15px] leading-6 text-neutral-500">
                  {item.body}
                </Text>
              </View>
            )}
          />

          <View className="flex-row justify-center gap-1.5 pb-6">
            {PAGES.map((item, index) => (
              <View
                key={item.id}
                className={cn(
                  "h-1.5 rounded-full",
                  index === page ? "w-6 bg-violet-600" : "w-1.5 bg-neutral-200",
                )}
              />
            ))}
          </View>
        </View>
      </TourTarget>

      <View className="mb-4 mt-3 flex-row">
        <DemoButton
          label={isThisTour ? "Tour running…" : "Start tour"}
          variant="accent"
          disabled={isActive}
          onPress={() => {
            reset();
            setPage(0);
            startTour(steps, { tourId: "paginated" });
          }}
        />
      </View>
    </View>
  );
}
