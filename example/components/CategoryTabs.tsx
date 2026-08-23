import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { cn } from "react-native-tour-guide";

import { CATEGORIES, CATEGORY_STYLES, type CategoryId } from "../data/sections";

export interface CategoryTabsProps {
  activeId: CategoryId;
  onChange: (id: CategoryId) => void;
}

export function CategoryTabs({ activeId, onChange }: CategoryTabsProps) {
  return (
    <View className="mt-3 flex-row gap-1.5 rounded-2xl border border-neutral-200 bg-neutral-100 p-1.5">
      {CATEGORIES.map((category) => {
        const active = category.id === activeId;
        const styles = CATEGORY_STYLES[category.id];

        return (
          <Pressable
            key={category.id}
            onPress={() => onChange(category.id)}
            className={cn(
              "flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5",
              active && "border border-neutral-300 bg-white",
            )}
          >
            <Ionicons
              name={category.icon}
              size={14}
              color={active ? styles.iconColor : "#A3A3A3"}
            />
            <Text
              className={cn(
                "text-[12.5px] font-semibold",
                active ? "text-neutral-900" : "text-neutral-400",
              )}
            >
              {category.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
