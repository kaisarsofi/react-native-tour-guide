import React from "react";
import { Text, View } from "react-native";

export interface SectionProps {
  index: number;
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}

export function Section({ index, title, description, children }: SectionProps) {
  return (
    <View className="mb-4 rounded-2xl border border-neutral-200 bg-white p-5">
      <View className="flex-row items-baseline gap-2.5">
        <Text className="font-mono text-xs text-neutral-400">
          {String(index).padStart(2, "0")}
        </Text>
        <Text className="text-[15px] font-semibold text-neutral-900">{title}</Text>
      </View>
      <Text className="mt-1.5 text-[13px] leading-5 text-neutral-500">{description}</Text>
      <View className="mt-4 h-px bg-neutral-100" />
      <View className="mt-4 gap-3">{children}</View>
    </View>
  );
}
