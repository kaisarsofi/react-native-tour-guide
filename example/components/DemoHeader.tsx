import React from "react";
import { Text, View } from "react-native";

export interface DemoHeaderProps {
  index: number;
  title: string;
  description: React.ReactNode;
}

export function DemoHeader({ index, title, description }: DemoHeaderProps) {
  return (
    <View className="mb-3">
      <View className="flex-row items-baseline gap-2.5">
        <Text className="font-mono text-xs text-neutral-400">
          {String(index).padStart(2, "0")}
        </Text>
        <Text className="text-[17px] font-semibold text-neutral-900">{title}</Text>
      </View>
      <Text className="mt-1.5 text-[13px] leading-5 text-neutral-500">{description}</Text>
    </View>
  );
}
