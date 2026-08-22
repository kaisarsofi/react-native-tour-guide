import React from "react";
import { Pressable, Text } from "react-native";
import { cn } from "react-native-tour-guide";

export interface DemoButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "accent";
}

const VARIANT_CLASSES: Record<NonNullable<DemoButtonProps["variant"]>, string> = {
  primary: "bg-neutral-900",
  secondary: "border border-neutral-200 bg-white",
  accent: "bg-violet-600",
};

const VARIANT_TEXT_CLASSES: Record<NonNullable<DemoButtonProps["variant"]>, string> = {
  primary: "text-white",
  secondary: "text-neutral-700",
  accent: "text-white",
};

export function DemoButton({
  label,
  onPress,
  disabled,
  variant = "primary",
}: DemoButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={cn(
        "items-center rounded-lg px-4 py-2.5 active:opacity-80",
        VARIANT_CLASSES[variant],
        disabled && "opacity-40",
      )}
    >
      <Text className={cn("text-[13px] font-medium", VARIANT_TEXT_CLASSES[variant])}>
        {label}
      </Text>
    </Pressable>
  );
}
