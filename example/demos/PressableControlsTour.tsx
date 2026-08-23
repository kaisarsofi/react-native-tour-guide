import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { TourTarget, cn, useTourGuide, type TourStep } from "react-native-tour-guide";

import { Code } from "../components/Code";
import { DemoButton } from "../components/DemoButton";
import { Section } from "../components/Section";

interface ActionButtonProps {
  targetId: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  activeColor: string;
  activeTint: string;
  label: string;
  activeLabel: string;
  onPress: () => void;
}

function ActionButton({
  targetId,
  icon,
  activeIcon,
  active,
  activeColor,
  activeTint,
  label,
  activeLabel,
  onPress,
}: ActionButtonProps) {
  return (
    <TourTarget id={targetId} className="flex-1">
      <Pressable
        onPress={onPress}
        style={active ? { backgroundColor: activeTint, borderColor: activeTint } : undefined}
        className={cn(
          "items-center gap-2.5 rounded-2xl border px-3 py-5 active:opacity-70",
          !active && "border-neutral-200 bg-white",
        )}
      >
        <View
          style={active ? { backgroundColor: activeColor } : undefined}
          className={cn(
            "h-12 w-12 items-center justify-center rounded-full",
            !active && "bg-neutral-100",
          )}
        >
          <Ionicons
            name={active ? activeIcon : icon}
            size={22}
            color={active ? "#FFFFFF" : "#525252"}
          />
        </View>
        <Text
          numberOfLines={1}
          style={active ? { color: activeColor } : undefined}
          className={cn("text-[12.5px] font-semibold", !active && "text-neutral-500")}
        >
          {active ? activeLabel : label}
        </Text>
      </Pressable>
    </TourTarget>
  );
}

/**
 * `onSpotlightPress` fires when the user taps *inside* the spotlight —
 * unlike the default backdrop tap, which fires anywhere and treats the
 * whole screen the same. Paired with `hideNextButton`, a step can require
 * the user to actually press the real, live control to move on, instead of
 * a tooltip's own Next button standing in for it.
 */
export function PressableControlsTour() {
  const { startTour, nextStep, isActive, currentStep, tourId } = useTourGuide();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);
  const isThisTour = isActive && tourId === "pressable-controls";

  const steps: TourStep[] = [
    {
      id: "like",
      targetId: "action-like",
      title: "Press to continue",
      description: "This step has no Next button — tap the highlighted Like button itself to move on.",
      hideNextButton: true,
      spotlightBorderRadius: 16,
      onSpotlightPress: () => {
        setLiked(true);
        nextStep();
      },
    },
    {
      id: "save",
      targetId: "action-save",
      title: "Same again",
      description: "No shortcuts — tap the bookmark to save it and continue.",
      hideNextButton: true,
      spotlightBorderRadius: 16,
      onSpotlightPress: () => {
        setSaved(true);
        nextStep();
      },
    },
    {
      id: "share",
      targetId: "action-share",
      title: "Last one",
      description: "Tap share — this press both shares the post and ends the tour.",
      hideNextButton: true,
      spotlightBorderRadius: 16,
      onSpotlightPress: () => {
        setShared(true);
        nextStep();
      },
    },
  ];

  return (
    <Section
      index={10}
      title="Pressable controls"
      description={
        <>
          <Code>onSpotlightPress</Code> + <Code>hideNextButton</Code> — the
          tooltip has no way forward, only the real control does.
        </>
      }
    >
      <View className="rounded-2xl border border-neutral-200 bg-white p-5">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-violet-100">
            <Ionicons name="image-outline" size={18} color="#7C3AED" />
          </View>
          <View className="flex-1">
            <Text className="text-[13px] font-semibold text-neutral-900">
              Weekend hike
            </Text>
            <Text className="text-xs text-neutral-400">Posted 2h ago</Text>
          </View>
        </View>

        <View className="mt-5 flex-row gap-3">
          <ActionButton
            targetId="action-like"
            icon="heart-outline"
            activeIcon="heart"
            active={liked}
            activeColor="#DC2626"
            activeTint="#FEF2F2"
            label="Like"
            activeLabel="Liked"
            onPress={() => setLiked((value) => !value)}
          />
          <ActionButton
            targetId="action-save"
            icon="bookmark-outline"
            activeIcon="bookmark"
            active={saved}
            activeColor="#7C3AED"
            activeTint="#F5F3FF"
            label="Save"
            activeLabel="Saved"
            onPress={() => setSaved((value) => !value)}
          />
          <ActionButton
            targetId="action-share"
            icon="paper-plane-outline"
            activeIcon="paper-plane"
            active={shared}
            activeColor="#0891B2"
            activeTint="#ECFEFF"
            label="Share"
            activeLabel="Shared"
            onPress={() => setShared(true)}
          />
        </View>
      </View>

      <View className="flex-row">
        <DemoButton
          label={isThisTour ? "Tour running…" : "Start tour"}
          disabled={isActive}
          onPress={() => {
            setLiked(false);
            setSaved(false);
            setShared(false);
            startTour(steps, { tourId: "pressable-controls" });
          }}
        />
      </View>
    </Section>
  );
}
