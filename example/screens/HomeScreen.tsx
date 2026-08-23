import React, { useMemo } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CategoryTabs } from "../components/CategoryTabs";
import { SectionCard } from "../components/SectionCard";
import { sectionsByCategory, type CategoryId, type SectionMeta } from "../data/sections";

function Hero() {
  return (
    <View>
      <Text className="text-xs font-semibold uppercase tracking-widest text-violet-600">
        React Native · Expo · TypeScript
      </Text>
      <Text className="mt-2 text-[28px] font-bold leading-8 text-neutral-900">
        react-native-tour-guide
      </Text>
      <Text className="mt-2 text-[13px] leading-5 text-neutral-500">
        Spotlight tours and coach marks for Expo & React Native. Pick a category, then a
        demo — each one runs its own tour on its own screen.
      </Text>

      <View className="mt-4 flex-row items-center gap-2 rounded-lg bg-neutral-900 px-3.5 py-2.5">
        <Text className="font-mono text-[13px] text-emerald-400">$</Text>
        <Text className="font-mono text-[13px] text-neutral-100">
          npx expo install react-native-tour-guide
        </Text>
      </View>
    </View>
  );
}

export interface HomeScreenProps {
  category: CategoryId;
  onChangeCategory: (category: CategoryId) => void;
  onSelectSection: (section: SectionMeta) => void;
}

export function HomeScreen({ category, onChangeCategory, onSelectSection }: HomeScreenProps) {
  const sections = useMemo(() => sectionsByCategory(category), [category]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={["top", "bottom"]}>
      <View className="gap-5 px-4 pb-1 pt-4">
        <Hero />
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
