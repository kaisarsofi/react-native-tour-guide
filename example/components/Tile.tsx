import React from "react";
import { Text, View } from "react-native";
import { cn } from "react-native-tour";

/** Neutral bordered placeholder standing in for "your actual UI" in a demo. */
export function Tile({ label, className }: { label: string; className?: string }) {
  return (
    <View
      className={cn(
        "items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-3.5",
        className,
      )}
    >
      <Text className="text-[13px] text-neutral-400">{label}</Text>
    </View>
  );
}
