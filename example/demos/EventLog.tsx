import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { TourTarget, useTourGuide, type TourStep } from "react-native-tour";

import { DemoButton } from "../components/DemoButton";
import { Section } from "../components/Section";

/**
 * `events.on(name, handler)` subscribes to the tour lifecycle
 * ("start" | "stepChange" | "end" | "skip" | "pause" | "resume") and
 * returns an unsubscribe function — handy for analytics.
 */
export function EventLog() {
  const { startTour, isActive, events } = useTourGuide();
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const append = (line: string) =>
      setLog((prev) => [...prev.slice(-6), line]);

    const unsubscribers = [
      events.on("start", () => append("start")),
      events.on("stepChange", ({ from, to }) => append(`stepChange ${from} → ${to}`)),
      events.on("skip", ({ atStep }) => append(`skip at step ${atStep}`)),
      events.on("end", ({ completed }) => append(`end (completed: ${completed})`)),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [events]);

  const steps: TourStep[] = [
    {
      id: "event-a",
      targetId: "event-target-a",
      title: "Step one",
      description: "Watch the log below as you move through this tour.",
    },
    {
      id: "event-b",
      targetId: "event-target-b",
      title: "Step two",
      description: "Skip or finish the tour to see the corresponding event.",
    },
  ];

  return (
    <Section
      index={6}
      title="Events"
      description="Subscribe to start / stepChange / skip / end via events.on(...) — useful for analytics. The emitter is shared app-wide, so this log also picks up tours started by the other sections above."
    >
      <View className="flex-row gap-3">
        <TourTarget id="event-target-a">
          <View className="flex-1 rounded-xl bg-neutral-100 p-4">
            <Text className="text-sm text-neutral-500">Target A</Text>
          </View>
        </TourTarget>
        <TourTarget id="event-target-b">
          <View className="flex-1 rounded-xl bg-neutral-100 p-4">
            <Text className="text-sm text-neutral-500">Target B</Text>
          </View>
        </TourTarget>
      </View>

      <View className="rounded-xl bg-neutral-900 p-3">
        <ScrollView style={{ maxHeight: 96 }}>
          {log.length === 0 ? (
            <Text className="font-mono text-xs text-neutral-500">
              No events yet — start the tour.
            </Text>
          ) : (
            log.map((line, i) => (
              <Text key={i} className="font-mono text-xs text-lime-400">
                {line}
              </Text>
            ))
          )}
        </ScrollView>
      </View>

      <View className="flex-row">
        <DemoButton
          label={isActive ? "Tour running…" : "Start tour"}
          disabled={isActive}
          onPress={() => {
            setLog([]);
            startTour(steps);
          }}
        />
      </View>
    </Section>
  );
}
