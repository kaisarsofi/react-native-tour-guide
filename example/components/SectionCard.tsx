import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { cn } from "react-native-tour-guide";

import { CATEGORY_STYLES, type SectionMeta } from "../data/sections";

export interface SectionCardProps {
  section: SectionMeta;
  onPress: () => void;
}

export function SectionCard({ section, onPress }: SectionCardProps) {
  const styles = CATEGORY_STYLES[section.category];

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center gap-3.5 rounded-3xl border border-neutral-200 bg-white p-4 active:opacity-70"
    >
      <View
        className={cn("h-14 w-14 items-center justify-center rounded-2xl", styles.badgeBg)}
      >
        <Ionicons name={section.icon} size={24} color={styles.iconColor} />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <View className={cn("h-5 w-5 items-center justify-center rounded-full", styles.chipBg)}>
            <Text className="text-[9px] font-extrabold text-white">{section.index}</Text>
          </View>
          <Text className="flex-1 text-[18px] font-extrabold text-neutral-950" numberOfLines={1}>
            {section.title}
          </Text>
        </View>
        <Text className="mt-1.5 text-[13px] leading-[18px] text-neutral-500" numberOfLines={2}>
          {section.tagline}
        </Text>
      </View>

      <View className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
        <Ionicons name="chevron-forward" size={16} color="#737373" />
      </View>
    </Pressable>
  );
}
