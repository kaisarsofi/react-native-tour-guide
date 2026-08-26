import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { TourTarget, cn, useTourGuide, type TourStep } from "@kaisarsofi/react-native-tour-guide";

import { Code } from "../components/Code";
import { DemoButton } from "../components/DemoButton";
import { Section } from "../components/Section";

const TOUR_ID = "pass-through";

interface ToggleProps {
  targetId: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  on: boolean;
  onPress: () => void;
}

/**
 * A perfectly ordinary toggle. Nothing here knows a tour exists — which is
 * the whole point: with `passThroughTouches` the spotlighted control keeps
 * its own `onPress`, so whatever it already does (state, analytics,
 * haptics, disabled handling) happens exactly as it would with no tour
 * running.
 */
function Toggle({ targetId, icon, label, on, onPress }: ToggleProps) {
  return (
    <TourTarget id={targetId} className="flex-1" spotlightBorderRadius={16}>
      <Pressable
        onPress={onPress}
        className={cn(
          "items-center gap-2.5 rounded-2xl border px-3 py-5 active:opacity-70",
          on ? "border-emerald-200 bg-emerald-50" : "border-neutral-200 bg-white",
        )}
      >
        <View
          className={cn(
            "h-12 w-12 items-center justify-center rounded-full",
            on ? "bg-emerald-600" : "bg-neutral-100",
          )}
        >
          <Ionicons name={icon} size={22} color={on ? "#FFFFFF" : "#525252"} />
        </View>
        <Text
          numberOfLines={1}
          className={cn(
            "text-[12.5px] font-semibold",
            on ? "text-emerald-700" : "text-neutral-500",
          )}
        >
          {on ? "On" : label}
        </Text>
      </Pressable>
    </TourTarget>
  );
}

export function PassThroughTour() {
  const { startTour, resetTour, isActive, tourId } = useTourGuide();
  const [wifi, setWifi] = useState(false);
  const [alerts, setAlerts] = useState(false);
  const [sync, setSync] = useState(false);
  const isThisTour = isActive && tourId === TOUR_ID;

  // Note what these steps *don't* have: no `onSpotlightPress` restating what
  // each toggle already does. The tap goes straight to the real control.
  // Advancing is the tooltip's job, since with nothing over the cutout the
  // overlay can't see the tap at all.
  const steps: TourStep[] = [
    {
      id: "wifi",
      targetId: "toggle-wifi",
      title: "Tap it — really",
      description:
        "The spotlight isn't covering this button. Toggling it here does exactly what it does normally.",
      passThroughTouches: true,
    },
    {
      id: "alerts",
      targetId: "toggle-alerts",
      title: "Still your button",
      description:
        "No duplicated handler in the tour, so this can't drift from what the real control does.",
      passThroughTouches: true,
    },
    {
      id: "sync",
      targetId: "toggle-sync",
      title: "Outside is still blocked",
      description:
        "Only the spotlit control is live — taps anywhere else still hit the backdrop.",
      passThroughTouches: true,
    },
  ];

  const reset = () => {
    setWifi(false);
    setAlerts(false);
    setSync(false);
  };

  useEffect(() => {
    reset();
    startTour(steps, { tourId: TOUR_ID, persist: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Section
      index={12}
      title="Touch pass-through"
      description={
        <>
          <Code>passThroughTouches</Code> — nothing is rendered over the
          cutout, so the real control receives the press itself.
        </>
      }
    >
      <View className="rounded-2xl border border-neutral-200 bg-white p-5">
        <Text className="text-[13px] font-semibold text-neutral-900">
          Quick settings
        </Text>
        <Text className="mt-0.5 text-xs text-neutral-400">
          Each toggle owns its own onPress.
        </Text>

        <View className="mt-5 flex-row gap-3">
          <Toggle
            targetId="toggle-wifi"
            icon="wifi-outline"
            label="Wi-Fi"
            on={wifi}
            onPress={() => setWifi((value) => !value)}
          />
          <Toggle
            targetId="toggle-alerts"
            icon="notifications-outline"
            label="Alerts"
            on={alerts}
            onPress={() => setAlerts((value) => !value)}
          />
          <Toggle
            targetId="toggle-sync"
            icon="sync-outline"
            label="Sync"
            on={sync}
            onPress={() => setSync((value) => !value)}
          />
        </View>
      </View>

      <View className="flex-row">
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
    </Section>
  );
}
