import "./global.css";

import { useRef } from "react";
import { Pressable, SafeAreaView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  TourGuideProvider,
  TourGuideOverlay,
  TourTarget,
  useTourGuide,
  darkTheme,
  type TourStep,
} from "react-native-tour";

function Demo() {
  const avatarRef = useRef<View>(null);
  const { startTour, isActive } = useTourGuide();

  const steps: TourStep[] = [
    {
      id: "avatar",
      targetRef: avatarRef,
      title: "Your profile",
      description: "This is your avatar. Tap it any time to edit your profile.",
      spotlightBorderRadius: 999,
    },
    {
      id: "compose",
      targetId: "compose-button",
      title: "Compose",
      description: "Tap here to start a new post. This step is targeted by id.",
      spotlightBorderRadius: 16,
    },
    {
      id: "settings",
      targetId: "settings-row",
      title: "Settings",
      description: "Manage your account and preferences from here.",
      tooltipPosition: "top",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      <View className="flex-row items-center justify-between px-4 py-3">
        <View
          ref={avatarRef}
          collapsable={false}
          className="h-10 w-10 rounded-full bg-violet-500"
        />
        <Text className="text-base font-semibold text-neutral-900">
          react-native-tour
        </Text>
        <View className="h-10 w-10" />
      </View>

      <View className="flex-1 items-center justify-center gap-6 px-6">
        <TourTarget id="compose-button">
          <Pressable className="rounded-full bg-neutral-900 px-6 py-3">
            <Text className="font-medium text-white">Compose</Text>
          </Pressable>
        </TourTarget>

        <TourTarget id="settings-row">
          <View className="w-full rounded-2xl bg-white p-4 shadow">
            <Text className="text-sm text-neutral-500">Settings</Text>
          </View>
        </TourTarget>

        <Pressable
          disabled={isActive}
          onPress={() => startTour(steps, { ...darkTheme, showStepCounter: true })}
          className="rounded-full bg-violet-600 px-6 py-3 disabled:opacity-50"
        >
          <Text className="font-medium text-white">
            {isActive ? "Tour running…" : "Start tour"}
          </Text>
        </Pressable>
      </View>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <TourGuideProvider>
      <Demo />
      <TourGuideOverlay />
    </TourGuideProvider>
  );
}
