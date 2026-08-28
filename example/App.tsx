import "./global.css";

import React, { useState } from "react";
import { LogBox, StyleSheet } from "react-native";

LogBox.ignoreAllLogs(true);
import Animated, { FadeIn, SlideInRight, SlideOutRight } from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { TourGuideProvider, TourGuideOverlay } from "@kaisarsofi/react-native-tour-guide";

import { DetailScreen } from "./screens/DetailScreen";
import { HomeScreen } from "./screens/HomeScreen";
import type { CategoryId, SectionMeta } from "./data/sections";

export default function App() {
  const [activeSection, setActiveSection] = useState<SectionMeta | null>(null);
  // Lifted out of HomeScreen so the active tab survives navigating to a
  // demo and back — HomeScreen unmounts while a DetailScreen is showing,
  // which would otherwise reset its own local state to the default tab.
  const [category, setCategory] = useState<CategoryId>("targeting");

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <TourGuideProvider>
          {activeSection ? (
            <Animated.View
              entering={SlideInRight.duration(220)}
              exiting={SlideOutRight.duration(180)}
              style={StyleSheet.absoluteFill}
            >
              <DetailScreen section={activeSection} onBack={() => setActiveSection(null)} />
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(180)} style={StyleSheet.absoluteFill}>
              <HomeScreen
                category={category}
                onChangeCategory={setCategory}
                onSelectSection={setActiveSection}
              />
            </Animated.View>
          )}

          <TourGuideOverlay />
          <StatusBar style="auto" />
        </TourGuideProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
