import { Ionicons } from "@expo/vector-icons";
import { createDrawerNavigator } from "@react-navigation/drawer";
import {
  DrawerActions,
  NavigationContainer,
  NavigationIndependentTree,
  type NavigationContainerRef,
} from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { TourTarget, useTourGuide, type TourStep } from "@kaisarsofi/react-native-tour-guide";

import { Code } from "../components/Code";
import { DemoButton } from "../components/DemoButton";
import { DemoHeader } from "../components/DemoHeader";

const TOUR_ID = "cross-screen";

type DrawerParamList = {
  Home: undefined;
  EditProfile: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

const MESSAGES = [
  { id: "1", name: "Ava Chen", preview: "Sent you the updated designs", time: "9:41" },
  { id: "2", name: "Ben Ortiz", preview: "Can we move standup to 10?", time: "9:12" },
  { id: "3", name: "Cleo Nowak", preview: "Invoice #4821 is ready", time: "Yesterday" },
];

function HomeScreen() {
  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" bounces={false}>
        {MESSAGES.map((message) => (
          <View
            key={message.id}
            className="flex-row items-center gap-3 border-b border-neutral-100 px-4 py-3.5"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-neutral-200">
              <Text className="text-[13px] font-semibold text-neutral-600">
                {message.name.slice(0, 1)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-semibold text-neutral-900">
                {message.name}
              </Text>
              <Text
                className="mt-0.5 text-[12.5px] text-neutral-400"
                numberOfLines={1}
              >
                {message.preview}
              </Text>
            </View>
            <Text className="text-[11px] text-neutral-300">{message.time}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/**
 * A real drawer's own content. `@react-navigation/drawer` keeps this mounted
 * the whole time — just translated off-screen — so its target is already
 * registered before the drawer ever opens. Once the drawer opens, the engine
 * waits for the item's position to settle before placing the spotlight —
 * no per-step `delayBefore` needed for the slide animation.
 */
function CustomDrawerContent({ onEditProfile }: { onEditProfile: () => void }) {
  return (
    <View className="flex-1 gap-1 bg-white px-3 pt-16">
      <View className="flex-row items-center gap-3 px-2 pb-4">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-violet-100">
          <Text className="text-[15px] font-semibold text-violet-700">JD</Text>
        </View>
        <View>
          <Text className="text-[14px] font-semibold text-neutral-900">Jamie Doe</Text>
          <Text className="text-[12px] text-neutral-400">jamie@example.com</Text>
        </View>
      </View>
      <View className="mb-1 h-px bg-neutral-100" />

      <TourTarget id="edit-profile-item" spotlightBorderRadius={12}>
        <Pressable
          onPress={onEditProfile}
          className="flex-row items-center gap-3 rounded-xl px-3 py-3 active:bg-neutral-50"
        >
          <Ionicons name="person-circle-outline" size={20} color="#525252" />
          <Text className="text-[14px] font-medium text-neutral-700">Edit profile</Text>
        </Pressable>
      </TourTarget>

      <View className="flex-row items-center gap-3 rounded-xl px-3 py-3 opacity-50">
        <Ionicons name="settings-outline" size={20} color="#525252" />
        <Text className="text-[14px] font-medium text-neutral-700">Settings</Text>
      </View>
    </View>
  );
}

function EditProfileScreen({
  onBack,
  onSave,
}: {
  onBack: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState("Jamie Doe");

  return (
    <View className="flex-1 bg-white px-4 pt-4">
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={onBack}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full active:opacity-70"
        >
          <Ionicons name="chevron-back" size={19} color="#404040" />
        </Pressable>
        <Text className="text-[17px] font-semibold text-neutral-900">Edit profile</Text>
      </View>

      <View className="mt-5 items-center">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-violet-100">
          <Text className="text-[24px] font-semibold text-violet-700">
            {name.slice(0, 1) || "?"}
          </Text>
        </View>
        <Pressable hitSlop={8} className="mt-2 active:opacity-60">
          <Text className="text-[12.5px] font-medium text-violet-600">Change photo</Text>
        </Pressable>
      </View>

      <View className="mt-6">
        <Text className="mb-1.5 text-[12.5px] font-medium text-neutral-500">Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          className="rounded-xl border border-neutral-200 px-3.5 py-3 text-[14px] text-neutral-900"
        />
      </View>

      <View className="mt-6">
        <TourTarget id="save-button" spotlightBorderRadius={12}>
          <Pressable
            onPress={onSave}
            className="items-center rounded-xl bg-neutral-900 px-4 py-3 active:opacity-80"
          >
            <Text className="text-[14px] font-semibold text-white">Save</Text>
          </Pressable>
        </TourTarget>
      </View>
    </View>
  );
}

/**
 * A real `@react-navigation/drawer` tree — its own `<NavigationContainer>`,
 * scoped to this one demo card. Three real screens/surfaces, three real
 * navigations: open the drawer, tap into a screen that has never mounted
 * before, save back to Home. Nothing here is a local state swap standing in
 * for navigation — this is what wiring the library into an actual navigator
 * (a drawer, a stack, whatever) looks like.
 */
export function CrossScreenTour() {
  const { startTour, resetTour, nextStep, skipTour, isActive, tourId } = useTourGuide();
  const navigationRef = useRef<NavigationContainerRef<DrawerParamList>>(null);
  const isThisTour = isActive && tourId === TOUR_ID;

  const goToEditProfile = () => {
    navigationRef.current?.navigate("EditProfile");
    navigationRef.current?.dispatch(DrawerActions.closeDrawer());
  };

  const goToHome = () => {
    navigationRef.current?.navigate("Home");
    navigationRef.current?.dispatch(DrawerActions.closeDrawer());
  };

  const steps: TourStep[] = [
    {
      id: "open-drawer",
      targetId: "menu-button",
      title: "Open the drawer",
      description: "Tap the menu — the tour follows you into it.",
      spotlightBorderRadius: 999,
      hideNextButton: true,
      onSpotlightPress: () => {
        navigationRef.current?.dispatch(DrawerActions.openDrawer());
        nextStep();
      },
    },
    {
      id: "edit-profile-item",
      targetId: "edit-profile-item",
      title: "Then Edit profile",
      description: "Still on the drawer's own item — same screen the button lives on, now open.",
      spotlightBorderRadius: 12,
      hideNextButton: true,
      // Backward isn't supported here — step one's target sits behind the
      // open drawer, on a screen this step never navigated away from. Only
      // the real menu button (step one's own control) can get back there.
      hidePrevButton: true,
      onSpotlightPress: () => {
        goToEditProfile();
        nextStep();
      },
    },
    {
      id: "save",
      targetId: "save-button",
      title: "Save returns you home",
      description:
        "Edit profile has never been on screen before now — the engine waited for its target to mount, the same as it did for the drawer item.",
      spotlightBorderRadius: 12,
      hideNextButton: true,
      hidePrevButton: true,
      onSpotlightPress: () => {
        goToHome();
        nextStep();
      },
    },
  ];

  const reset = () => {
    navigationRef.current?.dispatch(DrawerActions.closeDrawer());
    navigationRef.current?.navigate("Home");
  };

  useEffect(() => {
    reset();
    startTour(steps, { tourId: TOUR_ID, persist: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View className="flex-1 px-4 pt-1">
      <DemoHeader
        index={13}
        title="Cross-screen"
        description={
          <>
            A real <Code>@react-navigation/drawer</Code> tree. Each step's{" "}
            <Code>onSpotlightPress</Code> navigates for real and calls{" "}
            <Code>nextStep()</Code> — the engine follows onto whatever mounts
            next.
          </>
        }
      />

      <View className="mb-3 flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <NavigationIndependentTree>
          <NavigationContainer ref={navigationRef}>
            <Drawer.Navigator
              screenOptions={{
                headerShown: false,
                drawerStyle: { width: "72%" },
                // Default on iOS is "slide", which drags the content pane
                // along with the drawer as it opens/closes — the very view
                // being spotlit (menu button, then Save) keeps animating
                // for a few hundred ms after the navigation that reveals
                // it. "front" overlays the drawer instead, so content never
                // moves and there's nothing left to settle.
                drawerType: "front",
              }}
              drawerContent={() => (
                <CustomDrawerContent onEditProfile={goToEditProfile} />
              )}
            >
              <Drawer.Screen name="Home">
                {() => (
                  <View className="flex-1">
                    <View className="flex-row items-center gap-3 border-b border-neutral-100 px-4 pb-3 pt-3">
                      <TourTarget id="menu-button" spotlightBorderRadius={999}>
                        <Pressable
                          onPress={() =>
                            navigationRef.current?.dispatch(DrawerActions.openDrawer())
                          }
                          className="h-9 w-9 items-center justify-center rounded-full bg-neutral-100 active:opacity-70"
                        >
                          <Ionicons name="menu-outline" size={17} color="#404040" />
                        </Pressable>
                      </TourTarget>
                      <Text className="text-[17px] font-semibold text-neutral-900">
                        Home
                      </Text>
                    </View>
                    <HomeScreen />
                  </View>
                )}
              </Drawer.Screen>
              <Drawer.Screen name="EditProfile">
                {() => (
                  <EditProfileScreen
                    onBack={() => {
                      if (isThisTour) skipTour();
                      goToHome();
                    }}
                    onSave={goToHome}
                  />
                )}
              </Drawer.Screen>
            </Drawer.Navigator>
          </NavigationContainer>
        </NavigationIndependentTree>
      </View>

      <View className="mb-4 flex-row">
        <DemoButton
          label={isThisTour ? "Tour running…" : "Reset"}
          variant="secondary"
          disabled={isActive}
          onPress={() => {
            reset();
            resetTour(TOUR_ID);
            startTour(steps, { tourId: TOUR_ID, persist: true });
          }}
        />
      </View>
    </View>
  );
}
