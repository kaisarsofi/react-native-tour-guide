import React, { useState } from "react";
import { View } from "react-native";
import {
  TourTarget,
  useTourPersistence,
  type TourStep,
  type TourStorageAdapter,
} from "react-native-tour-guide";

import { Badge, Code } from "../components/Code";
import { DemoButton } from "../components/DemoButton";
import { Section } from "../components/Section";
import { Tile } from "../components/Tile";

const TOUR_ID = "example-onboarding";

const STATUS_LABEL = {
  idle: "Not shown",
  shown: "Completed",
  skipped: "Skipped (already done)",
} as const;

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
      description={
        <>
          <Code>useTourPersistence(storage)</Code> skips <Code>startTour</Code> if this{" "}
          tourId already completed, and lets you reset it.
        </>
      }
    >
      <TourTarget id="onboarding-target">
        <Tile label="Onboarding target" />
      </TourTarget>

      <View className="flex-row items-center justify-between">
        <Badge tone={status === "shown" ? "success" : status === "skipped" ? "accent" : "neutral"}>
          {STATUS_LABEL[status]}
        </Badge>
      </View>

      <View className="flex-row gap-2">
        <DemoButton
          label="Show onboarding"
          onPress={async () => {
            const already = (await memoryStorage.getItem(`react-native-tour-guide:${TOUR_ID}`)) === "true";
            await startTour(steps, {
              tourId: TOUR_ID,
              onTourEnd: () => setStatus("shown"),
            });
            if (already) setStatus("skipped");
          }}
        />
        <DemoButton
          label="Reset"
          variant="secondary"
          onPress={() => {
            resetTour(TOUR_ID);
            setStatus("idle");
          }}
        />
      </View>
    </Section>
  );
}
