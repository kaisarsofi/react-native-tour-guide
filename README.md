# react-native-tour

Expo-compatible spotlight tour guide / coach marks / walkthroughs for React
Native, with first-class [NativeWind](https://www.nativewind.dev/) (Tailwind
CSS) styling support. Inspired by
[`@wrack/react-native-tour-guide`](https://www.npmjs.com/package/@wrack/react-native-tour-guide),
rebuilt to be Expo-first and styled with `className` instead of bespoke style
objects.

> Status: early — core spotlight/tooltip/step engine is in place. More themes,
> auto-scroll, and interactive/inline spotlight modes are planned next.

## Features

- Works in any Expo (SDK 50+) or bare React Native app — zero native modules,
  zero config plugins.
- Style the built-in tooltip entirely with Tailwind classes via NativeWind,
  or swap in your own with `renderTooltip`.
- Auto shape-matching spotlight cutout (rounded rect, pill, circle) rendered
  with `react-native-svg`, animated between steps with `react-native-reanimated`.
- Target components by ref (`targetRef`) or by id (`<TourTarget id="...">`),
  or highlight a fixed screen region (`targetRegion`).
- Auto-flipping tooltip placement (`top` / `bottom` / `left` / `right` / `auto`).
- Full step lifecycle: `before` (async setup), `delayBefore`, `autoAdvance`,
  per-step callbacks, configurable backdrop behavior.
- Built-in event emitter (`start`, `stepChange`, `end`, `skip`, `pause`, `resume`).
- Optional one-time persistence via `useTourPersistence` (bring your own
  AsyncStorage/MMKV adapter).
- Ships 4 base themes (`lightTheme`, `darkTheme`, `minimalTheme`,
  `vibrantTheme`) plus `createTheme` for your own.

## Installation

```bash
npx expo install react-native-tour react-native-svg react-native-reanimated
```

Or in a bare RN app:

```bash
npm install react-native-tour react-native-svg react-native-reanimated
```

`react-native-reanimated` needs its Babel plugin — see the
[Reanimated install guide](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/)
if you don't already have it set up (most Expo Router apps already do).

### NativeWind setup

This package's components use `className` for styling. If your app already
has NativeWind configured, the only extra step is telling Tailwind to scan
this package's compiled output so its classes aren't purged:

```js
// tailwind.config.js
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./node_modules/react-native-tour/lib/**/*.{js,jsx,ts,tsx}",
  ],
  // ...
};
```

If you haven't set up NativeWind yet, follow the
[NativeWind installation guide](https://www.nativewind.dev/getting-started/installation)
first. The library still works without NativeWind — `className` is simply a
no-op prop in that case — but you'll want to pass your own styling via
`tooltipClassNames` overrides or a custom `renderTooltip`.

## Quick start

```tsx
import { useRef } from "react";
import { View, Text, Pressable } from "react-native";
import {
  TourGuideProvider,
  TourGuideOverlay,
  useTourGuide,
  type TourStep,
} from "react-native-tour";

function ComposeButton() {
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
      <ComposeButton />
      <TourGuideOverlay />
    </TourGuideProvider>
  );
}
```

Wrap your app once with `TourGuideProvider` and render a single
`TourGuideOverlay` near the root (e.g. in your root layout) — everything else
is driven through `useTourGuide()`.

### Targeting by id instead of a ref

```tsx
import { TourTarget, useTourGuide } from "react-native-tour";

function Header() {
  return (
    <TourTarget id="header-avatar">
      <Avatar />
    </TourTarget>
  );
}

const { startTour } = useTourGuide();
startTour([
  {
    id: "avatar-step",
    targetId: "header-avatar",
    title: "Your profile",
    description: "Tap your avatar any time to edit your profile.",
  },
]);
```

### Styling the tooltip

```tsx
startTour(steps, {
  tooltipClassNames: {
    container: "bg-neutral-900",
    title: "text-white",
    description: "text-neutral-300",
    nextButton: "bg-white",
    nextButtonText: "text-neutral-900",
  },
  spotlightStyles: { overlayOpacity: 0.7 },
});
```

Or use a bundled theme:

```tsx
import { darkTheme } from "react-native-tour";

startTour(steps, { ...darkTheme });
```

### Fully custom tooltip

```tsx
import type { TooltipProps } from "react-native-tour";

function MyTooltip({ step, onNext, isLast, config }: TooltipProps) {
  return (
    <View className="rounded-xl bg-indigo-600 p-4">
      <Text className="text-white font-bold">{step.title}</Text>
      <Text className="text-indigo-100">{step.description}</Text>
      <Pressable onPress={onNext}>
        <Text className="mt-2 text-white underline">
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
import { useTourPersistence } from "react-native-tour";

const { startTour } = useTourPersistence(AsyncStorage);

startTour(onboardingSteps, { tourId: "onboarding-v1" });
```

## API reference

### `<TourGuideProvider>`

Wraps the part of your app that needs tour context. Mount it once, high in
the tree.

### `<TourGuideOverlay />`

Renders the spotlight + tooltip as a `Modal`. Mount it once, anywhere inside
`TourGuideProvider` (typically right at the root, after your app content).

### `useTourGuide()`

```ts
const {
  startTour, // (steps: TourStep[], config?: TourGuideConfig) => void
  nextStep,
  prevStep,
  goToStep, // (index: number) => void
  skipTour,
  endTour, // (completed?: boolean) => void
  pauseTour,
  resumeTour,
  isActive,
  isPaused,
  currentStep,
  currentStepIndex,
  totalSteps,
  events, // .on('start' | 'stepChange' | 'end' | 'skip' | 'pause' | 'resume', handler)
} = useTourGuide();
```

### `TourStep`

| Property                 | Type                                | Default    | Purpose                                          |
| ------------------------ | ------------------------------------ | ---------- | ------------------------------------------------- |
| `id`                      | `string`                             | required   | Unique step id                                    |
| `targetRef`               | `RefObject<View>`                    | —          | Ref to the component to highlight                 |
| `targetId`                | `string`                             | —          | Id of a `<TourTarget>` wrapper                    |
| `targetRegion`            | `{x,y,width,height}`                 | —          | Fixed region, no ref needed                       |
| `title` / `description`   | `string`                             | required   | Tooltip copy                                      |
| `tooltipPosition`         | `'top'\|'bottom'\|'left'\|'right'\|'auto'` | `'auto'` | Placement                                     |
| `spotlightPadding`        | `number`                             | `8`        | Space around the cutout                           |
| `spotlightBorderRadius`   | `number`                             | `12`       | Cutout corner radius                              |
| `active`                  | `boolean`                            | `true`     | Exclude from the tour when `false`                |
| `backdropBehavior`        | `'next'\|'dismiss'\|'none'`          | `'none'`   | Tap-outside behavior                              |
| `autoAdvance`             | `number`                             | —          | Auto-advance after N ms                           |
| `before`                  | `() => Promise<void> \| void`        | —          | Awaited before measuring (navigate, expand, etc.) |
| `delayBefore`             | `number`                             | —          | Static delay after `before`                       |
| `renderTooltip`           | `(props: TooltipProps) => ReactNode` | —          | Per-step custom tooltip                           |
| `motion`                  | `'morph'\|'fade'\|'none'`            | config     | Step transition style                             |
| `hideNextButton` / `hidePrevButton` / `hideSkipButton` | `boolean` | `false` | Hide individual controls |
| `onNext` / `onPrev` / `onSkip` / `onSpotlightPress` | `() => void` | — | Per-step callbacks |
| `accessibilityLabel`      | `string`                             | —          | Screen reader label                               |

### `TourGuideConfig` (2nd arg to `startTour`)

| Property                  | Type                                   | Default  |
| ------------------------- | --------------------------------------- | -------- |
| `tooltipClassNames`        | `TooltipClassNames`                     | —        |
| `spotlightStyles`          | `{ overlayColor?, overlayOpacity? }`    | —        |
| `renderTooltip`            | `(props: TooltipProps) => ReactNode`    | —        |
| `showProgressDots`         | `boolean`                               | `false`  |
| `showStepCounter`          | `boolean`                               | `true`   |
| `nextButtonText` / `prevButtonText` / `skipButtonText` / `doneButtonText` | `string` | `'Next'` / `'Back'` / `'Skip'` / `'Done'` |
| `animationDuration`        | `number`                                | `300`    |
| `motion`                   | `'morph'\|'fade'\|'none'`               | `'morph'`|
| `tourId`                   | `string`                                | —        |
| `defaultBackdropBehavior`  | `'next'\|'dismiss'\|'none'`             | `'none'` |
| `onTourStart` / `onTourEnd` / `onStepChange` | callbacks             | —        |

### `<TourTarget id="...">`

Ref-free way to register a target; wraps children in a `View`.

### `useTourPersistence(storage)`

Wraps `startTour` / adds `resetTour` so a tour (keyed by `config.tourId`)
only plays once, using any `{ getItem, setItem, removeItem? }` adapter
(AsyncStorage, MMKV, etc.).

## Roadmap

- [ ] Interactive/inline spotlight mode (pass touches through the cutout)
- [ ] Auto-scroll support for `ScrollView`/`FlatList` targets
- [ ] Pulse/glow spotlight styles
- [ ] More bundled themes
- [ ] Example Expo app

## License

MIT
