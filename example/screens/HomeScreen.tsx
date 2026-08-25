import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTourGuide } from "react-native-tour-guide";

import { CategoryTabs } from "../components/CategoryTabs";
import { SectionCard } from "../components/SectionCard";
import {
  SECTIONS,
  sectionsByCategory,
  type CategoryId,
  type SectionMeta,
} from "../data/sections";

function Hero({ onResetAll }: { onResetAll: () => void }) {
  const [justReset, setJustReset] = useState(false);

  return (
    <View className="overflow-hidden">
      {/* Soft decorative glow behind the heading — plain Views, no extra
          native deps, clipped by the parent's overflow-hidden. */}
      <View
        pointerEvents="none"
        className="absolute -right-16 -top-24 h-56 w-56 rounded-full bg-violet-200 opacity-40"
      />
      <View
        pointerEvents="none"
        className="absolute -right-6 top-4 h-28 w-28 rounded-full bg-amber-200 opacity-30"
      />

      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900">
        <Ionicons name="compass" size={24} color="#FFFFFF" />
      </View>

      <Text className="mt-4 text-[34px] font-extrabold leading-9 tracking-tight text-neutral-900">
        Tour Guide
      </Text>
      <Text className="mt-1.5 text-[15px] leading-5 text-neutral-500">
        Spotlight tours that feel native — pick a category below and see one run.
      </Text>

      <View className="mt-3 flex-row flex-wrap gap-1.5">
        {["React Native", "Expo", "TypeScript"].map((tag) => (
          <View key={tag} className="rounded-full bg-violet-100 px-2.5 py-1">
            <Text className="text-[11px] font-semibold text-violet-700">{tag}</Text>
          </View>
        ))}
      </View>

      <View className="mt-4 flex-row items-center gap-2 rounded-lg bg-neutral-900 px-3.5 py-2.5">
        <Text className="font-mono text-[13px] text-emerald-400">$</Text>
        <Text className="font-mono text-[13px] text-neutral-100">
          npx expo install react-native-tour-guide
        </Text>
      </View>

      {/* Every demo below auto-plays once (persist: true) and never again —
          this clears that "seen" flag for all of them, so the whole example
          behaves like a first-time install again. */}
      <Pressable
        onPress={() => {
          onResetAll();
          setJustReset(true);
          setTimeout(() => setJustReset(false), 1500);
        }}
        className="mt-3 flex-row items-center gap-1.5 self-start rounded-full border border-neutral-200 bg-white px-3.5 py-2 active:opacity-70"
      >
        <Ionicons
          name={justReset ? "checkmark" : "refresh"}
          size={14}
          color={justReset ? "#059669" : "#525252"}
        />
        <Text
          className={
            "text-[12.5px] font-semibold " +
            (justReset ? "text-emerald-600" : "text-neutral-600")
          }
        >
          {justReset ? "All tours reset" : "Reset all tours"}
        </Text>
      </Pressable>
    </View>
  );
}

export interface HomeScreenProps {
  category: CategoryId;
  onChangeCategory: (category: CategoryId) => void;
  onSelectSection: (section: SectionMeta) => void;
}

export function HomeScreen({ category, onChangeCategory, onSelectSection }: HomeScreenProps) {
  const { resetTour } = useTourGuide();
  const sections = useMemo(() => sectionsByCategory(category), [category]);

  const handleResetAll = () => {
    SECTIONS.forEach((section) => resetTour(section.tourId));
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={["top", "bottom"]}>
      <View className="gap-5 px-4 pb-1 pt-4">
        <Hero onResetAll={handleResetAll} />
        <CategoryTabs activeId={category} onChange={onChangeCategory} />
      </View>

      <FlatList
        className="flex-1"
        contentContainerClassName="px-4 pb-12 pt-4"
        data={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SectionCard section={item} onPress={() => onSelectSection(item)} />
        )}
      />
    </SafeAreaView>
  );
}
