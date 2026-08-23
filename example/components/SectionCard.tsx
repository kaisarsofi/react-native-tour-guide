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
      className="mb-3 flex-row items-center gap-3.5 rounded-2xl border border-neutral-200 bg-white p-4 active:opacity-70"
    >
      <View
        className={cn("h-11 w-11 items-center justify-center rounded-xl", styles.badgeBg)}
      >
        <Ionicons name={section.icon} size={20} color={styles.iconColor} />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-mono text-[10px] font-semibold text-neutral-300">
            {String(section.index).padStart(2, "0")}
          </Text>
          <Text className="text-[15px] font-semibold text-neutral-900">{section.title}</Text>
        </View>
        <Text className="mt-1 text-[12.5px] leading-4 text-neutral-500" numberOfLines={2}>
          {section.tagline}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#D4D4D4" />
    </Pressable>
  );
}
