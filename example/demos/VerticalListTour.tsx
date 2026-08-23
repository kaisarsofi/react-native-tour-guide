import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import {
  TourTarget,
  useTourGuide,
  useTourScroll,
  type TourStep,
} from "react-native-tour-guide";

import { Code } from "../components/Code";
import { DemoButton } from "../components/DemoButton";
import { DemoHeader } from "../components/DemoHeader";

const ROW_HEIGHT = 76;
const MIN_VISIBLE_ROWS = 4;

const NAMES = [
  "Ava Chen",
  "Ben Ortiz",
  "Cleo Nowak",
  "Dev Patel",
  "Elif Kaya",
  "Farah Idris",
  "Gus Almeida",
  "Hana Suzuki",
  "Ibrahim Cole",
  "Jia Lin",
];

const PREVIEWS = [
  "Sent you the updated designs",
  "Can we move standup to 10?",
  "Invoice #4821 is ready",
  "Re: Q3 planning notes",
  "Lunch tomorrow?",
  "Approved the PR, nice work",
  "Reminder: demo at 3pm",
  "Can you review the deck?",
  "Shipped the release notes",
  "Following up on last week",
];

const INBOX = Array.from({ length: 60 }, (_, i) => ({
  id: `msg-${i}`,
  name: NAMES[i % NAMES.length] + (i >= NAMES.length ? ` ${Math.floor(i / NAMES.length) + 1}` : ""),
  preview: PREVIEWS[i % PREVIEWS.length],
  unread: i === 17,
}));

function Row({ item }: { item: (typeof INBOX)[number] }) {
  return (
    <View
      style={{ height: ROW_HEIGHT }}
      className="flex-row items-center gap-3.5 border-b border-neutral-100 px-4"
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-neutral-200">
        <Text className="text-sm font-semibold text-neutral-600">
          {item.name.slice(0, 1)}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-neutral-900" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="mt-0.5 text-[13px] text-neutral-400" numberOfLines={1}>
          {item.preview}
        </Text>
      </View>
      {item.unread && <View className="h-2.5 w-2.5 rounded-full bg-violet-600" />}
    </View>
  );
}

/**
 * Full-screen spotlight demo. The spotlight stays on the list; each swipe
 * scrolls a viewport, and the third swipe (the default `swipeCount`) ends
 * the tour. The visible viewport is measured at layout time so the guided
 * swipe always scrolls exactly one screenful, whatever the device size.
 */
export function VerticalListTour() {
  const { startTour, isActive, tourId } = useTourGuide();
  const { ref, scrollProps, handle, reset } = useTourScroll();
  const isThisTour = isActive && tourId === "vertical-list";
  const [viewportHeight, setViewportHeight] = useState(0);
  const pageSize = viewportHeight || MIN_VISIBLE_ROWS * ROW_HEIGHT;

  const steps: TourStep[] = [
    {
      id: "list",
      targetId: "inbox-list",
      title: "Your inbox",
      description: "Swipe up to move through messages.",
      swipeHint: "up",
      scroll: { handle, pageSize },
      spotlightBorderRadius: 20,
    },
  ];

  return (
    <View className="flex-1 px-4 pt-1">
      <DemoHeader
        index={7}
        title="Vertical list"
        description={
          <>
            Spotlight stays on the list, full-screen. Swipe to scroll —{" "}
            <Code>swipeCount</Code> defaults to 3, then the tour ends.
          </>
        }
      />

      <View
        className="flex-1"
        onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
      >
        <TourTarget id="inbox-list" style={{ flex: 1 }}>
          <View className="flex-1 overflow-hidden rounded-2xl border border-neutral-200">
            <ScrollView ref={ref} {...scrollProps} style={{ flex: 1 }} nestedScrollEnabled>
              {INBOX.map((item) => (
                <Row key={item.id} item={item} />
              ))}
            </ScrollView>
          </View>
        </TourTarget>
      </View>

      <View className="mt-3 flex-row items-center gap-1.5">
        <Ionicons name="information-circle-outline" size={14} color="#A3A3A3" />
        <Text className="text-xs text-neutral-400">
          Swipe up three times — the hole stays on the whole list.
        </Text>
      </View>

      <View className="mb-4 mt-3 flex-row">
        <DemoButton
          label={isThisTour ? "Tour running…" : "Start tour"}
          disabled={isActive}
          onPress={() => {
            reset();
            startTour(steps, { tourId: "vertical-list" });
          }}
        />
      </View>
    </View>
  );
}
