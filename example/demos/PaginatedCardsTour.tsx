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
import { Section } from "../components/Section";

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
];

/**
 * A paged carousel. One spotlight stays on the pager; each swipe advances a
 * page. The third swipe ends the tour.
 */
export function PaginatedCardsTour() {
  const { startTour, isActive, tourId } = useTourGuide();
  const { ref, scrollProps, handle, reset } = useTourScroll({ horizontal: true });
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const isThisTour = isActive && tourId === "paginated";

  // The card sits inside the section card, which is inset from the screen.
  const pageWidth = width - 32 - 40;

  const steps: TourStep[] = [
    {
      id: "pager",
      targetId: "onboarding-pager",
      title: "A paged walkthrough",
      description: "Swipe left to move between pages.",
      swipeHint: { direction: "left", distance: 100 },
      scroll: { handle, index: 0, viewPosition: 0 },
      // Defaults to 3. Pass swipeCount (or startTour's swipeCount) to change it.
      spotlightBorderRadius: 16,
    },
  ];

  return (
    <Section
      index={9}
      title="Paginated cards"
      description={
        <>
          Spotlight stays on the pager. Three swipes by default (
          <Code>swipeCount</Code>), then the tour ends.
        </>
      }
    >
      <TourTarget id="onboarding-pager">
        <View className="overflow-hidden rounded-xl border border-neutral-200">
          <FlatList
            ref={ref}
            {...scrollProps}
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
              <View style={{ width: pageWidth }} className="items-center px-5 py-6">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-violet-100">
                  <Ionicons name={item.icon} size={22} color="#6D28D9" />
                </View>
                <Text className="mt-3 text-[15px] font-bold text-neutral-900">
                  {item.title}
                </Text>
                <Text className="mt-1 text-center text-xs leading-4 text-neutral-500">
                  {item.body}
                </Text>
              </View>
            )}
          />

          <View className="flex-row justify-center gap-1.5 pb-3">
            {PAGES.map((item, index) => (
              <View
                key={item.id}
                className={cn(
                  "h-1.5 rounded-full",
                  index === page ? "w-5 bg-violet-600" : "w-1.5 bg-neutral-200",
                )}
              />
            ))}
          </View>
        </View>
      </TourTarget>

      <View className="flex-row">
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
    </Section>
  );
}
