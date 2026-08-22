# react-native-tour-guide

Spotlight tours, coach marks and onboarding walkthroughs for React Native —
Expo-first, zero native modules, TypeScript throughout.

> Status: early but functional. Core spotlight/tooltip/step engine, six
> themes, persistence and events are in place.

## Features

- **Works anywhere** — Expo (SDK 50+) or bare React Native. No config plugin,
  no native module, no prebuild.
- **Looks right out of the box** — the built-in tooltip is styled with real
  `StyleSheet` values, so it renders correctly with zero setup, with or
  without NativeWind/Tailwind in your app.
- **Animated spotlight** — an SVG mask cut out of the scrim, morphing between
  steps with Reanimated, with an optional ring and pulse.
- **Auto-placed tooltip with a caret** — flips to whichever side has room and
  keeps the arrow pointing at the target even when the card is clamped to the
  screen edge.
- **Three ways to target** — a `targetRef`, a `<TourTarget id>` wrapper, or a
  fixed `targetRegion`.
- **Six themes** plus `createTheme()`, or replace the tooltip entirely with
  `renderTooltip`.
- **Full step lifecycle** — async `before`, `delayBefore`, `autoAdvance`,
  per-step callbacks, configurable backdrop behavior, conditional steps.
- **Events** — `start`, `stepChange`, `end`, `skip`, `pause`, `resume`.
- **Play-once persistence** via `useTourPersistence` with any
  AsyncStorage/MMKV-shaped adapter.

## Installation

```bash
npx expo install react-native-tour-guide react-native-svg react-native-reanimated
```

Bare React Native:

```bash
npm install react-native-tour-guide react-native-svg react-native-reanimated
```

Reanimated needs its Babel plugin — see the
[Reanimated install guide](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/)
if it isn't already set up (most Expo apps have it).

## Quick start

Mount the provider once, render one overlay, then drive everything from
`useTourGuide()`.

```tsx
import { useRef } from "react";
import { View, Text, Pressable } from "react-native";
import {
  TourGuideProvider,
  TourGuideOverlay,
  useTourGuide,
  type TourStep,
} from "react-native-tour-guide";

function Screen() {
  const buttonRef = useRef<View>(null);
  const { startTour } = useTourGuide();

  const steps: TourStep[] = [
    {
      id: "compose",
      targetRef: buttonRef,
      title: "Compose",
      description: "Tap here to start a new post.",
      spotlightBorderRadius: 999,
    },
  ];

  return (
    <Pressable ref={buttonRef} onPress={() => startTour(steps)}>
      <Text>New post</Text>
    </Pressable>
  );
}

export default function App() {
  return (
    <TourGuideProvider>
      <Screen />
      <TourGuideOverlay />
    </TourGuideProvider>
  );
}
```

### Targeting by id instead of a ref

```tsx
import { TourTarget } from "react-native-tour-guide";

<TourTarget id="header-avatar">
  <Avatar />
</TourTarget>;

startTour([
  {
    id: "avatar",
    targetId: "header-avatar",
    title: "Your profile",
    description: "Tap your avatar any time to edit your profile.",
  },
]);
```

## Styling

### Themes

```tsx
import { darkTheme, oceanTheme } from "react-native-tour-guide";

startTour(steps, darkTheme);
startTour(steps, { ...oceanTheme, showProgressDots: false });
```

Bundled: `lightTheme` (default), `darkTheme`, `minimalTheme`, `vibrantTheme`,
`oceanTheme`, `sunsetTheme` — also available as `themes.light`, `themes.dark`, etc.

### Tokens

A theme is just `tooltipStyles` + `spotlightStyles`. Override any single token;
the rest fall back to the defaults.

```tsx
startTour(steps, {
  tooltipStyles: {
    backgroundColor: "#111827",
    titleColor: "#FFFFFF",
    primaryButtonColor: "#F97316",
  },
  spotlightStyles: { overlayOpacity: 0.85, enablePulse: false },
});
```

`tooltipStyles`: `backgroundColor`, `borderRadius`, `borderColor`, `borderWidth`,
`titleColor`, `descriptionColor`, `stepCounterColor`, `primaryButtonColor`,
`primaryButtonTextColor`, `secondaryButtonColor`, `secondaryButtonTextColor`,
`skipButtonTextColor`, `progressDotColor`, `progressDotActiveColor`,
`showArrow`, `shadow`, `maxWidth`.

`spotlightStyles`: `overlayColor`, `overlayOpacity`, `borderColor`,
`borderWidth`, `enablePulse`, `pulseColor`, `pulseWidth`, `pulseDuration`.

### Per-slot style overrides

For one-off tweaks where a whole theme is overkill, pass raw RN styles. These
are applied last, so they win over both the defaults and the theme tokens.

```tsx
startTour(steps, {
  ...darkTheme,
  styles: {
    container: { paddingHorizontal: 24 },
    title: { fontFamily: "Inter_700Bold", fontSize: 19 },
    description: { fontFamily: "Inter_400Regular" },
    primaryButton: { borderRadius: 8 },
  },
});
```

Slots: `container`, `stepCounter`, `progressDot`, `progressDotActive`, `title`,
`description`, `footer`, `primaryButton`, `primaryButtonText`,
`secondaryButton`, `secondaryButtonText`, `skipButtonText`.

### A note on NativeWind / Tailwind

The built-in tooltip deliberately uses `StyleSheet` rather than `className`.
NativeWind rewrites `className` into styles **at build time**, and this package
ships precompiled — so a `className` written inside the library would never be
transformed and would silently do nothing in your app.

Your own components have no such limitation. A `renderTooltip` you write is
compiled by *your* app, so Tailwind classes work there normally:

```tsx
import type { TooltipProps } from "react-native-tour-guide";

function MyTooltip({ step, isLast, onNext, config }: TooltipProps) {
  return (
    <View className="rounded-2xl bg-indigo-600 p-4">
      <Text className="text-base font-bold text-white">{step.title}</Text>
      <Text className="mt-1 text-sm text-indigo-100">{step.description}</Text>
      <Pressable onPress={onNext} className="mt-3 self-end rounded-full bg-white px-4 py-2">
        <Text className="font-semibold text-indigo-700">
          {isLast ? config.doneButtonText : config.nextButtonText}
        </Text>
      </Pressable>
    </View>
  );
}

startTour(steps, { renderTooltip: (props) => <MyTooltip {...props} /> });
```

### Show a tour only once

```tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTourPersistence } from "react-native-tour-guide";

const { startTour, resetTour } = useTourPersistence(AsyncStorage);

startTour(onboardingSteps, { tourId: "onboarding-v1" });
resetTour("onboarding-v1"); // show it again
```

## API

### `useTourGuide()`

```ts
const {
  startTour,   // (steps: TourStep[], config?: TourGuideConfig) => void
  nextStep, prevStep, goToStep, skipTour, endTour, pauseTour, resumeTour,
  isActive, isPaused, currentStep, currentStepIndex, totalSteps,
  events,      // .on('start'|'stepChange'|'end'|'skip'|'pause'|'resume', handler) => unsubscribe
} = useTourGuide();
```

### `TourStep`

| Property | Type | Default | Purpose |
| --- | --- | --- | --- |
| `id` | `string` | required | Unique step id |
| `targetRef` | `RefObject<View>` | — | Component to highlight |
| `targetId` | `string` | — | Id of a `<TourTarget>` wrapper |
| `targetRegion` | `{x,y,width,height}` | — | Fixed region, no ref needed |
| `title` / `description` | `string` | required | Tooltip copy |
| `tooltipPosition` | `'top'\|'bottom'\|'left'\|'right'\|'auto'` | `'auto'` | Preferred side |
| `spotlightPadding` | `number` | `8` | Space around the cutout |
| `spotlightBorderRadius` | `number` | `12` | Cutout corner radius (`999` = circle) |
| `active` | `boolean` | `true` | Exclude from the tour when `false` |
| `backdropBehavior` | `'next'\|'dismiss'\|'none'` | `'none'` | Tap-outside behavior |
| `autoAdvance` | `number` | — | Auto-advance after N ms |
| `before` | `() => Promise<void>\|void` | — | Awaited before measuring |
| `delayBefore` | `number` | — | Static delay after `before` |
| `renderTooltip` | `(props) => ReactNode` | — | Per-step custom tooltip |
| `motion` | `'morph'\|'fade'\|'none'` | config | Transition style |
| `hideNextButton` / `hidePrevButton` / `hideSkipButton` | `boolean` | `false` | Hide controls |
| `onNext` / `onPrev` / `onSkip` / `onSpotlightPress` | `() => void` | — | Callbacks |
| `accessibilityLabel` | `string` | — | Screen reader label |

### `TourGuideConfig`

| Property | Type | Default |
| --- | --- | --- |
| `tooltipStyles` | `TooltipStyles` | see tokens above |
| `spotlightStyles` | `SpotlightStyles` | see tokens above |
| `renderTooltip` | `(props) => ReactNode` | — |
| `showProgressDots` | `boolean` | `true` |
| `showStepCounter` | `boolean` | `true` |
| `nextButtonText` / `prevButtonText` / `skipButtonText` / `doneButtonText` | `string` | `Next` / `Back` / `Skip` / `Done` |
| `animationDuration` | `number` | `320` |
| `motion` | `'morph'\|'fade'\|'none'` | `'morph'` |
| `tourId` | `string` | — |
| `defaultBackdropBehavior` | `'next'\|'dismiss'\|'none'` | `'none'` |
| `onTourStart` / `onTourEnd` / `onStepChange` | callbacks | — |

## Example app

```bash
cd example
npm install
npx expo run:ios
```

Six demos: targeting, themes, custom tooltips, backdrop/timing/motion,
persistence, and a live event log.

## Roadmap

- [ ] Interactive spotlight (pass touches through the cutout)
- [ ] Auto-scroll for targets inside a `ScrollView` / `FlatList`
- [ ] Blur backdrop option

## License

MIT
