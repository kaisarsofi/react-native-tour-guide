import React from "react";
import { Text, View } from "react-native";
import { cn } from "react-native-tour";

export interface SectionProps {
  index: number;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function Section({ index, title, description, children }: SectionProps) {
  return (
    <View className="mb-5 rounded-2xl bg-white p-5 shadow-sm shadow-neutral-300">
      <View className="flex-row items-center gap-2">
        <View className="h-6 w-6 items-center justify-center rounded-full bg-neutral-900">
          <Text className="text-xs font-bold text-white">{index}</Text>
        </View>
        <Text className="text-base font-semibold text-neutral-900">{title}</Text>
      </View>
      <Text className="mt-2 text-sm leading-5 text-neutral-500">{description}</Text>
      <View className="mt-4 gap-3">{children}</View>
    </View>
  );
}
