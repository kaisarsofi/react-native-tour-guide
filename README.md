<div align="center">

# react-native-tour-guide

**Spotlight tours, coach marks, and onboarding walkthroughs for React Native.**
Expo-first. Zero native modules. TypeScript throughout.

[![npm version](https://img.shields.io/npm/v/react-native-tour-guide.svg?style=flat-square)](https://www.npmjs.com/package/react-native-tour-guide)
[![npm downloads](https://img.shields.io/npm/dm/react-native-tour-guide.svg?style=flat-square)](https://www.npmjs.com/package/react-native-tour-guide)
[![license](https://img.shields.io/npm/l/react-native-tour-guide.svg?style=flat-square)](./LICENSE)
[![types](https://img.shields.io/badge/types-included-3178C6.svg?style=flat-square)](./src/index.ts)

</div>

---

`react-native-tour-guide` highlights a real component on screen with an
animated spotlight, shows a tooltip that auto-places itself and points a
caret back at the target, and walks the user through as many steps as you
give it. No native code, no config plugin, no prebuild — install it and go.

```tsx
const { startTour } = useTourGuide();

startTour([
  { id: "compose", targetRef: buttonRef, title: "Compose", description: "Tap here to start a new post." },
]);
```

## Contents

- [Features](#features)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Guides](#guides)
  - [Targeting a component](#targeting-a-component)
  - [Step lifecycle](#step-lifecycle)
  - [Themes](#themes)
  - [Style tokens](#style-tokens)
  - [Per-slot style overrides](#per-slot-style-overrides)
  - [A fully custom tooltip](#a-fully-custom-tooltip)
  - [Backdrop behavior, timing & motion](#backdrop-behavior-timing--motion)
  - [Play a tour only once](#play-a-tour-only-once)
  - [Listening to tour events](#listening-to-tour-events)
  - [NativeWind / Tailwind](#nativewind--tailwind)
- [API reference](#api-reference)
- [Example app](#example-app)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Features

| | |
| --- | --- |
| 🎯 **Three ways to target** | a `targetRef`, a `<TourTarget id>` wrapper, or a fixed `targetRegion` — no ref plumbing required |
| ✨ **Animated spotlight** | an SVG mask cut out of the scrim, morphing between steps with Reanimated, with an optional ring and pulse |
| 💬 **Auto-placed tooltip** | flips to whichever side of the target has room, and keeps its caret pointed at the target even when clamped to the screen edge |
| 🎨 **Six bundled themes** | `light`, `dark`, `minimal`, `vibrant`, `ocean`, `sunset` — or compose your own with `createTheme()` |
| 🧩 **Full step lifecycle** | async `before`, `delayBefore`, `autoAdvance`, per-step callbacks, configurable backdrop behavior, conditional steps |
| 📡 **Events** | `start`, `stepChange`, `end`, `skip`, `pause`, `resume` — subscribe with `events.on(...)` |
| 💾 **Play-once persistence** | `useTourPersistence` works with any AsyncStorage/MMKV-shaped adapter |
| 📦 **Zero native code** | works in Expo Go, dev builds, and bare React Native alike — no config plugin, no prebuild |
| 🖌️ **Looks right immediately** | the built-in tooltip is styled with real `StyleSheet` values, so it renders correctly with or without NativeWind/Tailwind in your app |
| 🧪 **Well tested** | 85+ unit and render tests across the spotlight, tooltip, geometry, and provider |

## Installation

```bash
npx expo install react-native-tour-guide react-native-svg react-native-reanimated
```

Bare React Native (npm or yarn):

```bash
npm install react-native-tour-guide react-native-svg react-native-reanimated
# or
yarn add react-native-tour-guide react-native-svg react-native-reanimated
```

Reanimated needs its Babel plugin — see the
[Reanimated install guide](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/)
if it isn't already set up (most Expo apps have it).

## Quick start

Mount the provider once, render one overlay near the root, then drive
everything from `useTourGuide()`.

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

`TourGuideOverlay` can live anywhere inside the provider — most apps put it
once at the root, right after their navigator.

## Guides

### Targeting a component

Point a step at a component with a plain `targetRef`:

```tsx
const avatarRef = useRef<View>(null);

<View ref={avatarRef}>...</View>;

startTour([{ id: "avatar", targetRef: avatarRef, title: "…", description: "…" }]);
```

...or skip the ref entirely by wrapping the component in `<TourTarget id>`
and referencing that id — handy when the target is deep in a child component
you don't want to thread a ref through:

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

A third option, `targetRegion: { x, y, width, height }`, highlights a fixed
screen region with no component involved at all — useful for pointing at
something rendered outside your React tree (a native tab bar icon, a status
bar area).

### Step lifecycle

Each step can gate itself on async work, wait before showing, and auto-advance:

```tsx
{
  id: "notifications",
  targetId: "bell-icon",
  title: "Stay in the loop",
  description: "We'll notify you here.",
  before: async () => { await openDrawer(); },   // awaited before measuring
  delayBefore: 200,                                // then wait 200ms
  autoAdvance: 2500,                                // then auto-advance after 2.5s
}
```

`active: false` removes a step from the tour without renumbering the rest —
useful for conditionally skipping a step based on app state:

```tsx
{ id: "beta-badge", targetId: "badge", active: user.isBetaTester, ... }
```

### Themes

```tsx
import { darkTheme, oceanTheme } from "react-native-tour-guide";

startTour(steps, darkTheme);
startTour(steps, { ...oceanTheme, showProgressDots: false });
```

Bundled: `lightTheme` (default), `darkTheme`, `minimalTheme`, `vibrantTheme`,
`oceanTheme`, `sunsetTheme` — also available as `themes.light`, `themes.dark`,
etc. A theme is just `tooltipStyles` + `spotlightStyles`, so building your own
is a matter of picking colors:

```tsx
import { createTheme } from "react-native-tour-guide";

const brandTheme = createTheme({
  tooltipStyles: { backgroundColor: "#111827", primaryButtonColor: "#F97316" },
  spotlightStyles: { overlayOpacity: 0.85, pulseColor: "#F97316" },
});
```

### Style tokens

Prefer overriding a single value over building a whole theme? Pass
`tooltipStyles` / `spotlightStyles` directly in the tour config — anything you
don't set falls back to the default theme:

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

<details>
<summary><strong>All tooltip tokens</strong></summary>

`backgroundColor`, `borderRadius`, `borderColor`, `borderWidth`, `titleColor`,
`descriptionColor`, `stepCounterColor`, `primaryButtonColor`,
`primaryButtonTextColor`, `secondaryButtonColor`, `secondaryButtonTextColor`,
`skipButtonTextColor`, `progressDotColor`, `progressDotActiveColor`,
`showArrow`, `shadow`, `maxWidth`.

</details>

<details>
<summary><strong>All spotlight tokens</strong></summary>

`overlayColor`, `overlayOpacity`, `borderColor`, `borderWidth`, `enablePulse`,
`pulseColor`, `pulseWidth`, `pulseDuration`.

</details>

### Per-slot style overrides

For a one-off tweak that isn't a color — a custom font, some extra padding —
pass raw RN styles via `styles`. These are applied last, so they win over
both the defaults and the active theme:

```tsx
startTour(steps, {
  ...darkTheme,
  styles: {
    container: { paddingHorizontal: 24 },
    title: { fontFamily: "Inter_700Bold", fontSize: 19 },
    primaryButton: { borderRadius: 8 },
  },
});
```

<details>
<summary><strong>All style slots</strong></summary>

`container`, `stepCounter`, `progressDot`, `progressDotActive`, `title`,
`description`, `footer`, `primaryButton`, `primaryButtonText`,
`secondaryButton`, `secondaryButtonText`, `skipButtonText`.

</details>

### A fully custom tooltip

Need something the token system can't express — a different layout, an
illustration, your own component library? Replace the tooltip entirely with
`renderTooltip`, per step or for the whole tour:

```tsx
import type { TooltipProps } from "react-native-tour-guide";

function MyTooltip({ step, isLast, onNext, config }: TooltipProps) {
  return (
    <View style={{ borderRadius: 16, backgroundColor: "#4F46E5", padding: 16 }}>
      <Text style={{ fontSize: 16, fontWeight: "700", color: "white" }}>{step.title}</Text>
      <Text style={{ marginTop: 4, color: "#E0E7FF" }}>{step.description}</Text>
      <Pressable onPress={onNext} style={{ marginTop: 12, alignSelf: "flex-end" }}>
        <Text style={{ color: "white", fontWeight: "600" }}>
          {isLast ? config.doneButtonText : config.nextButtonText}
        </Text>
      </Pressable>
    </View>
  );
}

startTour(steps, { renderTooltip: (props) => <MyTooltip {...props} /> });
```

`renderTooltip` is a component you write, compiled by your own app's
bundler — so if your app uses NativeWind, Tailwind classes work fine here.
See [NativeWind / Tailwind](#nativewind--tailwind) below for why that's not
true of the built-in tooltip.

### Backdrop behavior, timing & motion

Configure what tapping outside the spotlight does — per step, or as the
default for the whole tour:

```tsx
startTour(steps, { defaultBackdropBehavior: "next" });   // tap anywhere to advance
startTour(steps, { defaultBackdropBehavior: "dismiss" }); // tap anywhere to end the tour
```

```tsx
{ ...step, backdropBehavior: "dismiss" }  // override for just this step
```

Turn off the morph animation for an instant cut instead:

```tsx
startTour(steps, { motion: "none", animationDuration: 0 });
```

### Play a tour only once

`useTourPersistence` wraps `startTour` so a tour (keyed by `tourId`) only
plays once, using any `{ getItem, setItem, removeItem? }` storage adapter —
AsyncStorage, MMKV, or your own:

```tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTourPersistence } from "react-native-tour-guide";

const { startTour, resetTour } = useTourPersistence(AsyncStorage);

startTour(onboardingSteps, { tourId: "onboarding-v1" });
resetTour("onboarding-v1"); // clear the flag — show it again next time
```

### Listening to tour events

The event emitter is shared across every tour in the app — handy for
analytics:

```tsx
const { events } = useTourGuide();

useEffect(() => {
  const unsubscribe = events.on("stepChange", ({ from, to }) => {
    analytics.track("tour_step", { from, to });
  });
  return unsubscribe;
}, [events]);
```

Available events: `start`, `stepChange`, `end`, `skip`, `pause`, `resume`.

### NativeWind / Tailwind

The built-in tooltip deliberately uses `StyleSheet` rather than `className`.
NativeWind rewrites `className` into styles **at build time**, and this
package ships precompiled — so a `className` written inside the library
would never be transformed, and would silently do nothing in your app. Style
it with [tokens](#style-tokens), [per-slot overrides](#per-slot-style-overrides),
or a [custom `renderTooltip`](#a-fully-custom-tooltip) instead — that last
one is compiled by *your* app, so Tailwind classes work there normally.

## API reference

### `useTourGuide()`

```ts
const {
  startTour,   // (steps: TourStep[], config?: TourGuideConfig) => void
  nextStep, prevStep, goToStep, skipTour, endTour, pauseTour, resumeTour,
  isActive, isPaused, currentStep, currentStepIndex, totalSteps, tourId,
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
| `tooltipStyles` | `TooltipStyles` | see [tokens](#style-tokens) |
| `spotlightStyles` | `SpotlightStyles` | see [tokens](#style-tokens) |
| `styles` | `TooltipSlotStyles` | see [per-slot overrides](#per-slot-style-overrides) |
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

A full showcase — six sections, each running its own isolated tour against
realistic mock UI (a header, a dashboard, a feed, an onboarding banner,
analytics charts):

```bash
git clone https://github.com/kaisarsofi/react-native-tour-guide.git
cd react-native-tour-guide/example
npm install
npx expo run:ios      # or: npx expo start
```

## Roadmap

- [ ] Interactive spotlight (pass touches through the cutout)
- [ ] Auto-scroll for targets inside a `ScrollView` / `FlatList`
- [ ] Blur backdrop option

Have a feature request? [Open an issue](https://github.com/kaisarsofi/react-native-tour-guide/issues).

## Contributing

```bash
git clone https://github.com/kaisarsofi/react-native-tour-guide.git
cd react-native-tour-guide
npm install
npm run validate   # lint + format check + typecheck + tests
```

A Husky pre-commit hook runs `lint-staged` (ESLint + Prettier on staged
files) and a full typecheck automatically — no extra setup needed once
`npm install` has run.

<details>
<summary><strong>Publishing (maintainers)</strong></summary>

The published tarball is a whitelist (`files` in `package.json`) plus
`.npmignore` for extra excludes inside those folders. `README.md`,
`LICENSE`, and `package.json` are always included.

Included:

- `src/` — Metro / `react-native` entry (`src/index.ts`)
- `lib/` — CommonJS, ESM, and TypeScript declarations from `bob build`

Excluded: tests (`src/__tests__`), source maps, the `example/` app, CI,
Husky, lockfiles, and editor/build caches.

#### First-time npm login (Yarn 4)

```bash
yarn npm login
# or: echo 'npmAuthToken: "YOUR_NPM_TOKEN"' >> .yarnrc.yml   # do not commit this
```

Create a granular access token at https://www.npmjs.com/settings/~/tokens
with **Read and write** for the `react-native-tour-guide` package (or the
whole account).

#### Release

1. Bump `"version"` in `package.json`.
2. Confirm the tarball:

   ```bash
   yarn validate
   yarn pack:list
   ```

3. Publish:

   ```bash
   yarn release
   ```

   That runs lint, format, typecheck, and tests, then `yarn npm publish`
   (`prepack` builds `lib/` first).

4. Optional: tag the git commit (`git tag v<version> && git push --tags`).
   Pushing a GitHub Release named `v*` can also publish via
   `.github/workflows/publish.yml` if the `NPM_TOKEN` secret is set.

</details>

## License

MIT © [kaisarsofi](https://github.com/kaisarsofi)
