import React from "react";
import { Text, View } from "react-native";
import { cn } from "@kaisarsofi/react-native-tour-guide";

/** Inline `code`-style chip, the way docs sites render identifiers. */
export function Code({ children, className }: { children: string; className?: string }) {
  return (
    <Text
      className={cn(
        "rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono text-[13px] text-neutral-700",
        className,
      )}
    >
      {children}
    </Text>
  );
}

/** Small uppercase status pill, e.g. "Not shown" / "Completed". */
export function Badge({
  children,
  tone = "neutral",
}: {
  children: string;
  tone?: "neutral" | "success" | "accent";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-neutral-100 text-neutral-600",
    success: "bg-emerald-100 text-emerald-700",
    accent: "bg-violet-100 text-violet-700",
  };
  return (
    <View className={cn("self-start rounded-full px-2.5 py-1", tones[tone])}>
      <Text className="text-xs font-semibold uppercase tracking-wide">{children}</Text>
    </View>
  );
}
