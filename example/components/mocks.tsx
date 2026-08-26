import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { cn } from "@kaisarsofi/react-native-tour-guide";

/**
 * Small realistic UI fragments standing in for "your actual app" in the
 * demos below — a header, a dashboard, a feed, an onboarding card, a chart.
 * Each one is just what it needs to be to make a tour worth pointing at;
 * none of this is part of the library, it's example dressing.
 */

export function Avatar({
  initials,
  color = "#7C3AED",
  size = 40,
}: {
  initials: string;
  color?: string;
  size?: number;
}) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }}
      className="items-center justify-center"
    >
      <Text className="text-sm font-semibold text-white">{initials}</Text>
    </View>
  );
}

export function ComposeButton({ label = "New post" }: { label?: string }) {
  return (
    <View className="flex-row items-center justify-center gap-1.5 rounded-full bg-neutral-900 px-5 py-3">
      <Ionicons name="add" size={17} color="#FFFFFF" />
      <Text className="text-sm font-semibold text-white">{label}</Text>
    </View>
  );
}

export function SettingsRow({
  icon = "notifications",
  label,
  meta,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  meta?: string;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-xl bg-neutral-50 px-3.5 py-3">
      <View className="h-8 w-8 items-center justify-center rounded-lg bg-neutral-200">
        <Ionicons name={icon} size={16} color="#525252" />
      </View>
      <Text className="flex-1 text-sm font-medium text-neutral-800">{label}</Text>
      {meta && <Text className="text-xs text-neutral-400">{meta}</Text>}
      <Ionicons name="chevron-forward" size={16} color="#D4D4D4" />
    </View>
  );
}

export function StatCard({
  label,
  value,
  trend,
  positive = true,
}: {
  label: string;
  value: string;
  trend?: string;
  positive?: boolean;
}) {
  return (
    <View className="rounded-xl border border-neutral-200 bg-white p-3.5">
      <Text className="text-xs font-medium text-neutral-400">{label}</Text>
      <Text className="mt-1 text-xl font-bold text-neutral-900">{value}</Text>
      {trend && (
        <View className="mt-1.5 flex-row items-center gap-1">
          <Ionicons
            name={positive ? "trending-up" : "trending-down"}
            size={13}
            color={positive ? "#059669" : "#EF4444"}
          />
          <Text
            className={cn(
              "text-xs font-semibold",
              positive ? "text-emerald-600" : "text-red-500",
            )}
          >
            {trend}
          </Text>
        </View>
      )}
    </View>
  );
}

export function IconButton({
  icon,
  badge,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  badge?: boolean;
}) {
  return (
    <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
      <Ionicons name={icon} size={20} color="#404040" />
      {badge && (
        <View className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
      )}
    </View>
  );
}

export function FeedCard({ title, meta }: { title: string; meta: string }) {
  return (
    <View className="rounded-xl border border-neutral-200 bg-white p-3.5">
      <View className="h-16 w-full items-center justify-center rounded-lg bg-neutral-100">
        <Ionicons name="image-outline" size={20} color="#D4D4D4" />
      </View>
      <Text className="mt-2.5 text-sm font-semibold text-neutral-900" numberOfLines={1}>
        {title}
      </Text>
      <Text className="mt-0.5 text-xs text-neutral-400">{meta}</Text>
    </View>
  );
}

export function OnboardingBanner() {
  return (
    <View className="rounded-2xl bg-violet-600 p-4">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-white/20">
        <Ionicons name="sparkles" size={16} color="#FFFFFF" />
      </View>
      <Text className="mt-3 text-base font-bold text-white">Welcome to Acme</Text>
      <Text className="mt-1 text-xs leading-4 text-violet-100">
        Let&apos;s take a quick look around before you get started.
      </Text>
    </View>
  );
}

const BAR_HEIGHTS = [10, 18, 14, 24, 20, 30, 22];

export function MiniBarChart({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-xl border border-neutral-200 bg-white p-3.5">
      <Text className="text-xs font-medium text-neutral-400">{label}</Text>
      <Text className="mt-0.5 text-lg font-bold text-neutral-900">{value}</Text>
      <View className="mt-2.5 h-8 flex-row items-end gap-1">
        {BAR_HEIGHTS.map((h, i) => (
          <View key={i} className="flex-1 rounded-sm bg-violet-200" style={{ height: h }} />
        ))}
      </View>
    </View>
  );
}
