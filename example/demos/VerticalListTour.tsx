import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import {
  TourTarget,
  useTourGuide,
  useTourScroll,
  type TourStep,
} from "react-native-tour-guide";

import { Code } from "../components/Code";
import { DemoButton } from "../components/DemoButton";
import { Section } from "../components/Section";

const ROW_HEIGHT = 64;

const INBOX = Array.from({ length: 24 }, (_, i) => ({
  id: `msg-${i}`,
  name:
    ["Ava Chen", "Ben Ortiz", "Cleo Nowak", "Dev Patel", "Elif Kaya"][i % 5] +
    (i > 4 ? ` ${Math.floor(i / 5) + 1}` : ""),
  preview: [
    "Sent you the updated designs",
    "Can we move standup to 10?",
    "Invoice #4821 is ready",
    "Re: Q3 planning notes",
    "Lunch tomorrow?",
  ][i % 5],
  unread: i === 17,
}));

function Row({ item }: { item: (typeof INBOX)[number] }) {
  return (
    <View
      style={{ height: ROW_HEIGHT }}
      className="flex-row items-center gap-3 border-b border-neutral-100 px-3"
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-neutral-200">
        <Text className="text-xs font-semibold text-neutral-600">
          {item.name.slice(0, 1)}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-[13px] font-semibold text-neutral-900" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-xs text-neutral-400" numberOfLines={1}>
          {item.preview}
        </Text>
      </View>
      {item.unread && <View className="h-2 w-2 rounded-full bg-violet-600" />}
    </View>
  );
}

/**
 * The spotlight stays on the list. Each swipe scrolls a viewport; the third
 * swipe (the default `swipeCount`) ends the tour.
 */
export function VerticalListTour() {
  const { startTour, isActive, tourId } = useTourGuide();
  const { ref, scrollProps, handle, reset } = useTourScroll();
  const isThisTour = isActive && tourId === "vertical-list";

  const steps: TourStep[] = [
    {
      id: "list",
      targetId: "inbox-list",
      title: "Your inbox",
      description: "Swipe up to move through messages.",
      swipeHint: "up",
      scroll: { handle, pageSize: 3 * ROW_HEIGHT },
      spotlightBorderRadius: 16,
    },
  ];

  return (
    <Section
      index={7}
      title="Vertical list"
      description={
        <>
          Spotlight stays on the list. Swipe to scroll —{" "}
          <Code>swipeCount</Code> defaults to 3, then the tour ends.
        </>
      }
    >
      <TourTarget id="inbox-list">
        <View className="overflow-hidden rounded-xl border border-neutral-200">
          <ScrollView
            ref={ref}
            {...scrollProps}
            style={{ height: 3 * ROW_HEIGHT }}
            nestedScrollEnabled
          >
            {INBOX.map((item) => (
              <Row key={item.id} item={item} />
            ))}
          </ScrollView>
        </View>
      </TourTarget>

      <View className="flex-row items-center gap-1.5">
        <Ionicons name="information-circle-outline" size={14} color="#A3A3A3" />
        <Text className="text-xs text-neutral-400">
          Swipe up three times — the hole stays on the whole list.
        </Text>
      </View>

      <View className="flex-row">
        <DemoButton
          label={isThisTour ? "Tour running…" : "Start tour"}
          disabled={isActive}
          onPress={() => {
            reset();
            startTour(steps, { tourId: "vertical-list" });
          }}
        />
      </View>
    </Section>
  );
}
