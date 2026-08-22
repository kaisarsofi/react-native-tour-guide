import React, { useState } from "react";
import { Text, View } from "react-native";
import {
  TourTarget,
  useTourPersistence,
  type TourStep,
  type TourStorageAdapter,
} from "react-native-tour";

import { DemoButton } from "../components/DemoButton";
import { Section } from "../components/Section";

const TOUR_ID = "example-onboarding";

/**
 * A minimal in-memory stand-in for AsyncStorage/MMKV, just so this demo has
 * no extra native dependency. Swap this for `@react-native-async-storage/
 * async-storage` (or MMKV) in a real app — same {getItem,setItem,removeItem}
 * shape either way.
 */
function createMemoryStorage(): TourStorageAdapter {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}

const memoryStorage = createMemoryStorage();

/**
 * useTourPersistence wraps startTour so a tour keyed by `tourId` only plays
 * once; onTourEnd(completed) marks it done. resetTour() clears that flag.
 */
export function Persistence() {
  const { startTour, resetTour } = useTourPersistence(memoryStorage);
  const [status, setStatus] = useState<"idle" | "shown" | "skipped">("idle");

  const steps: TourStep[] = [
    {
      id: "onboarding-step",
      targetId: "onboarding-target",
      title: "Welcome!",
      description: "This only plays once per tourId — try tapping the button again.",
    },
  ];

  return (
    <Section
      index={5}
      title="Play once (persistence)"
      description="useTourPersistence(storage) skips startTour if this tourId already completed, and lets you reset it."
    >
      <TourTarget id="onboarding-target">
        <View className="rounded-xl bg-neutral-100 p-4">
          <Text className="text-sm text-neutral-500">Onboarding target</Text>
        </View>
      </TourTarget>

      <Text className="text-xs text-neutral-400">
        Status:{" "}
        <Text className="font-medium text-neutral-600">
          {status === "idle" && "not shown yet"}
          {status === "shown" && "completed — won't show again until reset"}
          {status === "skipped" && "already completed, startTour was a no-op"}
        </Text>
      </Text>

      <View className="flex-row gap-2">
        <DemoButton
          label="Show onboarding"
          onPress={async () => {
            const already = (await memoryStorage.getItem(`react-native-tour:${TOUR_ID}`)) === "true";
            await startTour(steps, {
              tourId: TOUR_ID,
              onTourEnd: () => setStatus("shown"),
            });
            if (already) setStatus("skipped");
          }}
        />
        <DemoButton
          label="Reset"
          variant="outline"
          onPress={() => {
            resetTour(TOUR_ID);
            setStatus("idle");
          }}
        />
      </View>
    </Section>
  );
}
