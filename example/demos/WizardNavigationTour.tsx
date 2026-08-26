import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import {
  cn,
  createWizardTourSteps,
  TourTarget,
  useTourGuide,
} from "@kaisarsofi/react-native-tour-guide";

import { Code } from "../components/Code";
import { DemoButton } from "../components/DemoButton";
import { DemoHeader } from "../components/DemoHeader";
import { ONBOARDING_PAGES as PAGES } from "../data/onboardingPages";

const BUTTON_SHADOW = {
  shadowColor: "#0A0A0A",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.14,
  shadowRadius: 8,
  elevation: 6,
} as const;

/**
 * Same paged carousel as Paginated cards, driven by Prev/Next instead of a
 * swipe. `createWizardTourSteps` defaults to Next 2, then Prev 1, then close.
 * Pass `nextCount` / `prevCount` to change it; Prev is clamped so it cannot
 * rewind further than Next advanced.
 */
const TOUR_ID = "wizard-navigation";

export function WizardNavigationTour() {
  const { startTour, resetTour, nextStep, isActive, tourId } = useTourGuide();
  const listRef = useRef<FlatList<(typeof PAGES)[number]>>(null);
  const pageRef = useRef(0);
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const [pagerWidth, setPagerWidth] = useState(width - 56);
  const isThisTour = isActive && tourId === TOUR_ID;

  const goTo = (index: number) => {
    const next = Math.max(0, Math.min(index, PAGES.length - 1));
    pageRef.current = next;
    setPage(next);
    listRef.current?.scrollToIndex({ index: next, animated: true });
  };

  const goNext = () => goTo(pageRef.current + 1);
  const goPrev = () => goTo(pageRef.current - 1);

  const steps = createWizardTourSteps({
    nextTargetId: "wizard-next",
    prevTargetId: "wizard-prev",
    onNext: goNext,
    onPrev: goPrev,
    nextStep,
    spotlightBorderRadius: 999,
  });

  const atStart = page === 0;
  const atEnd = page === PAGES.length - 1;

  useEffect(() => {
    pageRef.current = 0;
    setPage(0);
    listRef.current?.scrollToIndex({ index: 0, animated: false });
    startTour(steps, { tourId: TOUR_ID, persist: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / pagerWidth);
    pageRef.current = index;
    setPage(index);
  };

  return (
    <View className="flex-1 px-4 pt-1">
      <DemoHeader
        index={11}
        title="Wizard navigation"
        description={
          <>
            Same pager as Paginated cards, with Prev/Next. Default tour is{" "}
            <Code>nextCount: 2</Code>, then <Code>prevCount: 1</Code>, then
            close.
          </>
        }
      />

      <View className="mx-3 flex-1">
        <View
          className="flex-1 overflow-hidden rounded-3xl border border-neutral-200 bg-white"
          onLayout={(event) => setPagerWidth(event.nativeEvent.layout.width)}
        >
          <FlatList
            ref={listRef}
            style={{ flex: 1 }}
            horizontal
            pagingEnabled
            data={PAGES}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumScrollEnd}
            getItemLayout={(_, index) => ({
              length: pagerWidth,
              offset: pagerWidth * index,
              index,
            })}
            renderItem={({ item }) => (
              <View
                style={{ width: pagerWidth }}
                className="flex-1 items-center justify-center px-10"
              >
                <View className="h-24 w-24 items-center justify-center rounded-3xl bg-violet-100">
                  <Ionicons name={item.icon} size={40} color="#6D28D9" />
                </View>
                <Text className="mt-7 text-center text-[22px] font-bold text-neutral-900">
                  {item.title}
                </Text>
                <Text className="mt-2 text-center text-[15px] leading-6 text-neutral-500">
                  {item.body}
                </Text>
              </View>
            )}
          />

          <View className="flex-row justify-center gap-1.5 pb-6">
            {PAGES.map((item, index) => (
              <View
                key={item.id}
                className={cn(
                  "h-1.5 rounded-full",
                  index === page ? "w-6 bg-violet-600" : "w-1.5 bg-neutral-200",
                )}
              />
            ))}
          </View>
        </View>

        <View
          className="absolute items-center justify-center"
          style={{ left: -22, top: "50%", marginTop: -24 }}
        >
          <TourTarget id="wizard-prev">
            <Pressable
              disabled={atStart}
              onPress={goPrev}
              style={BUTTON_SHADOW}
              className={cn(
                "h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-slate-300 active:bg-neutral-100",
                atStart && "opacity-50",
              )}
            >
              <Ionicons name="chevron-back" size={24} color="#171717" />
            </Pressable>
          </TourTarget>
        </View>

        <View
          className="absolute items-center justify-center"
          style={{ right: -22, top: "50%", marginTop: -24 }}
        >
          <TourTarget id="wizard-next">
            <Pressable
              disabled={atEnd}
              onPress={goNext}
              style={BUTTON_SHADOW}
              className={cn(
                "h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-slate-300 active:bg-neutral-100",
                atEnd && "opacity-30",
              )}
            >
              <Ionicons name="chevron-forward" size={24} color="#171717" />
            </Pressable>
          </TourTarget>
        </View>
      </View>

      <View className="mb-4 mt-4 flex-row">
        <DemoButton
          label={isThisTour ? "Tour running…" : "Reset"}
          variant="secondary"
          disabled={isActive}
          onPress={() => {
            pageRef.current = 0;
            setPage(0);
            listRef.current?.scrollToIndex({ index: 0, animated: false });
            resetTour(TOUR_ID);
            startTour(steps, { tourId: TOUR_ID, persist: true });
          }}
        />
      </View>
    </View>
  );
}
