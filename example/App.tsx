import "./global.css";

import { ScrollView, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { TourGuideProvider, TourGuideOverlay } from "react-native-tour";

import { BackdropAndMotion } from "./demos/BackdropAndMotion";
import { BasicTargeting } from "./demos/BasicTargeting";
import { CustomTooltip } from "./demos/CustomTooltip";
import { EventLog } from "./demos/EventLog";
import { Persistence } from "./demos/Persistence";
import { Themes } from "./demos/Themes";

function Hero() {
  return (
    <View className="mb-6">
      <Text className="text-xs font-semibold uppercase tracking-widest text-violet-600">
        React Native · Expo · NativeWind
      </Text>
      <Text className="mt-2 text-[28px] font-bold leading-8 text-neutral-900">
        react-native-tour
      </Text>
      <Text className="mt-2 text-[13px] leading-5 text-neutral-500">
        Spotlight tours and coach marks for Expo & React Native. Six demos below —
        each starts its own tour in isolation.
      </Text>

      <View className="mt-4 flex-row items-center gap-2 rounded-lg bg-neutral-900 px-3.5 py-2.5">
        <Text className="font-mono text-[13px] text-emerald-400">$</Text>
        <Text className="font-mono text-[13px] text-neutral-100">
          npx expo install react-native-tour
        </Text>
      </View>
    </View>
  );
}

function Demo() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={["top", "bottom"]}>
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-12 pt-4">
        <Hero />

        <BasicTargeting />
        <Themes />
        <CustomTooltip />
        <BackdropAndMotion />
        <Persistence />
        <EventLog />
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <TourGuideProvider>
        <Demo />
        <TourGuideOverlay />
        <StatusBar style="auto" />
      </TourGuideProvider>
    </SafeAreaProvider>
  );
}
