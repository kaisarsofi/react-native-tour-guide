import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTourGuide } from "@kaisarsofi/react-native-tour-guide";

import { CATEGORIES, CATEGORY_STYLES, type SectionMeta } from "../data/sections";

export interface DetailScreenProps {
  section: SectionMeta;
  onBack: () => void;
}

export function DetailScreen({ section, onBack }: DetailScreenProps) {
  const category = CATEGORIES.find((item) => item.id === section.category)!;
  const styles = CATEGORY_STYLES[section.category];
  const Demo = section.component;

  // Each demo runs its own tour on this screen. If the user navigates back
  // mid-tour, the target unmounts but the provider's `isActive` flag never
  // clears on its own — that would permanently disable every "Start tour"
  // button app-wide. End whatever tour is running when this screen unmounts.
  const { isActive, endTour } = useTourGuide();
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;
  const endTourRef = useRef(endTour);
  endTourRef.current = endTour;

  useEffect(() => {
    return () => {
      if (isActiveRef.current) {
        endTourRef.current();
      }
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={["top", "bottom"]}>
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
        <Pressable
          onPress={onBack}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white active:opacity-70"
        >
          <Ionicons name="chevron-back" size={18} color="#404040" />
        </Pressable>

        <View className="flex-row items-center gap-1.5">
          <Ionicons name={category.icon} size={12} color={styles.iconColor} />
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            {category.label}
          </Text>
        </View>
      </View>

      {section.fullBleed ? (
        <Demo />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pb-12 pt-1"
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never"
        >
          <Demo />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
