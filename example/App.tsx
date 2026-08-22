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

function Demo() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={["top", "bottom"]}>
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-12 pt-4">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-neutral-900">react-native-tour</Text>
          <Text className="mt-1 text-sm text-neutral-500">
            Six self-contained demos — each one starts its own tour so you can try a
            feature in isolation.
          </Text>
        </View>

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
