import React from "react";
import { Pressable, Text } from "react-native";
import { cn } from "react-native-tour";

export interface DemoButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "dark" | "accent" | "outline";
}

const VARIANT_CLASSES: Record<NonNullable<DemoButtonProps["variant"]>, string> = {
  dark: "bg-neutral-900",
  accent: "bg-violet-600",
  outline: "border border-neutral-300 bg-white",
};

const VARIANT_TEXT_CLASSES: Record<NonNullable<DemoButtonProps["variant"]>, string> = {
  dark: "text-white",
  accent: "text-white",
  outline: "text-neutral-900",
};

export function DemoButton({
  label,
  onPress,
  disabled,
  variant = "dark",
}: DemoButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={cn(
        "items-center rounded-full px-5 py-3",
        VARIANT_CLASSES[variant],
        disabled && "opacity-40",
      )}
    >
      <Text className={cn("text-sm font-medium", VARIANT_TEXT_CLASSES[variant])}>
        {label}
      </Text>
    </Pressable>
  );
}
