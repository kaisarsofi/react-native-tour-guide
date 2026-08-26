# react-native-tour-guide

**Product tours for React Native that actually feel native.** An animated
spotlight, a tooltip that places itself, and a list-aware engine that scrolls,
swipes, and remembers — in one component, zero native code.

![npm version](https://img.shields.io/npm/v/react-native-tour-guide.svg?style=flat-square)
![npm downloads](https://img.shields.io/npm/dm/react-native-tour-guide.svg?style=flat-square)
![license](https://img.shields.io/npm/l/react-native-tour-guide.svg?style=flat-square)
![types](https://img.shields.io/badge/types-included-3178C6.svg?style=flat-square)
![expo](https://img.shields.io/badge/Expo-Go%20%26%20dev%20builds-000.svg?style=flat-square&logo=expo)
![new arch](https://img.shields.io/badge/New%20Architecture-supported-61DAFB.svg?style=flat-square)

If this saves you a sprint of edge cases, a ⭐ on
[GitHub](https://github.com/kaisarsofi/react-native-tour-guide) keeps it maintained.

---

## Why this one

- 🎯 **Zero setup, real results.** Wrap a provider, wrap a list, done — the
  library handles measuring, scrolling, placement, and safe areas for you.
- 📜 **List tours that don't fight you.** `<TourScrollList>` turns any
  `FlatList` / `FlashList` / `LegendList` into a guided tour with no refs, no
  `useEffect`, no manual scroll math.
- ✋ **Real gestures, not fake ones.** Swipe-hint steps let the actual list
  scroll natively wherever possible — no captured, simulated touches.
- 📦 **Ships nothing extra.** No native modules, no config plugin, no
  prebuild. Works in Expo Go, dev builds, and bare React Native alike.
- 🧪 **Actually tested.** 200+ unit and render tests across the spotlight,
  scroll engine, gestures, and provider — this isn't a demo dressed up as a
  library.

## See it

| **Targeting**                                                                                   | **Behavior**                                                                               | **Scrolling**                                                                                  |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| ![Targeting tab — ref or TourTarget id, themes, and a custom tooltip](docs/TargetTourGuide.gif) | ![Behavior tab — backdrop, persistence, events, and live controls](docs/behaviourTour.gif) | ![Scrolling tab — list tours, paging, swipe hints, and wizard navigation](docs/scrollTour.gif) |
| ref or id-based targeting, six themes, custom tooltips                                          | backdrop taps, play-once persistence, press-the-real-button                                | auto-scroll lists, swipe hints, paging, wizard nav                                             |

_Same example app, iOS simulator and Android device._

## Two components. That's the whole API surface you touch daily.

```tsx
import {
  TourGuideProvider,
  TourGuideOverlay,
  useTourGuide,
} from "react-native-tour-guide";

function App() {
  return (
    <TourGuideProvider>
      <Screen />
      <TourGuideOverlay />
    </TourGuideProvider>
  );
}

function Screen() {
  const buttonRef = useRef<View>(null);
  const { startTour } = useTourGuide();

  return (
    <Pressable
      ref={buttonRef}
      onPress={() =>
        startTour([
          {
            id: "compose",
            targetRef: buttonRef,
            title: "Compose",
            description: "Tap here to start a new post.",
          },
        ])
      }
    >
      <Text>New post</Text>
    </Pressable>
  );
}
```

## List tours in one wrapper

The most common real-world tour — teach the list itself, spotlight fixed,
user swipes to catch up — used to mean wiring a ref, a `useEffect`, and
remembering that paging lists scroll differently. Now it's one component:

```tsx
import { FlashList } from "@shopify/flash-list";
import { TourScrollList } from "react-native-tour-guide";
import { useIsFocused } from "@react-navigation/native";

<TourScrollList
  as={FlashList}
  id="item-list"
  tourId="item-list-tour"
  persist
  title="Your items"
  description="Swipe up to see more."
  swipeHint="up"
  active={useIsFocused()}
  data={items}
  renderItem={({ item }) => <Card item={item} />}
  pagingEnabled
/>;
```

It starts itself the moment `data` arrives and the screen is actually
visible, resets the scroll position for you, auto-detects paging, and
forwards every other prop straight to `FlashList` — swap in `LegendList` or
plain `FlatList` with no other change. Behind a tab navigator? `active`
keeps the tour from firing on a screen that's mounted but off-screen.

**Need the tour to also point at something _outside_ the list** — nav
arrows next to a carousel, a filter chip above it? `<TourScrollList>` only
builds one step, for the list itself. Drop to `useTourScroll()` +
`TourTarget` and write the steps yourself — the arrows below drive the
same `handle` the list's own step scrolls with:

```tsx
import { useTourScroll, TourTarget, useTourGuide } from "react-native-tour-guide";

const { ref, scrollProps, handle, reset } = useTourScroll({ horizontal: true });
const { startTour, nextStep } = useTourGuide();

const scrollByPage = (delta: number) => {
  const page = Math.round(handle.offsetRef.current.x / pageWidth) + delta;
  handle.ref.current?.scrollToOffset?.({ offset: page * pageWidth, animated: true });
};

const steps = [
  {
    id: "rail",
    targetId: "category-rail",
    title: "Swipe the cards",
    description: "One card per screen.",
    swipeHint: "left",
    scroll: { handle, index: 0 },
  },
  {
    id: "prev",
    targetId: "rail-prev",
    title: "Previous",
    description: "Tap the highlighted arrow.",
    hideNextButton: true,
    onSpotlightPress: () => { scrollByPage(-1); nextStep(); },
  },
  {
    id: "next",
    targetId: "rail-next",
    title: "Next",
    description: "Tap this arrow to finish.",
    hideNextButton: true,
    onSpotlightPress: () => { scrollByPage(1); nextStep(); },
  },
];

reset();
startTour(steps, { tourId: "rail" });

<TourTarget id="category-rail">
  <FlatList ref={ref} {...scrollProps} horizontal pagingEnabled data={items} ... />
</TourTarget>
<TourTarget id="rail-prev">
  <Pressable onPress={() => scrollByPage(-1)}>{/* ‹ */}</Pressable>
</TourTarget>
<TourTarget id="rail-next">
  <Pressable onPress={() => scrollByPage(1)}>{/* › */}</Pressable>
</TourTarget>
```

Full working version, including waiting for the rail's real width before
starting:
[`example/demos/HorizontalListControlsTour.tsx`](example/demos/HorizontalListControlsTour.tsx).

## Install

```bash
npx expo install react-native-tour-guide react-native-svg react-native-reanimated
```

```bash
npm install react-native-tour-guide react-native-svg react-native-reanimated
```

That's it for JS-only usage. Reanimated needs its Babel plugin if your app
doesn't have it already — see the
[install guide](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/).

<details>
<summary><strong>Requirements & optional dependencies</strong></summary>

| React Native | React               | Expo                               | Architecture           |
| ------------ | ------------------- | ---------------------------------- | ---------------------- |
| 0.71+        | 18+ (works with 19) | SDK 49+ (Go, dev builds, prebuild) | Paper and Fabric, both |

`react-native-reanimated` (≥3) and `react-native-svg` (≥13) are required
peers. `@shopify/flash-list` and `@legendapp/list` are **optional** —
only needed if you use `<TourScrollList as={FlashList}>` /
`as={LegendList}`. Plain `ScrollView`, `FlatList`, and `SectionList` need
nothing extra.

</details>

## Everything else, in one pass

**Targeting** — `targetRef`, `<TourTarget id>`, or a fixed `targetRegion`.
No ref plumbing required for the ones you don't want to thread through.

**Shape lives on the target** — give `<TourTarget>` a
`spotlightBorderRadius` / `spotlightPadding` once and every step pointing at
it is shaped to match, so a round icon button stays round and a pill stays a
pill without each step restating it. A step can still override either.

```tsx
<TourTarget id="chat-icon" spotlightBorderRadius={999} spotlightPadding={8}>
  <IconButton />
</TourTarget>
```

**Themes & styling** — six bundled themes (`light`, `dark`, `minimal`,
`vibrant`, `ocean`, `sunset`), token overrides for one-off colors, or
replace the tooltip entirely with `renderTooltip` — a real component your
own bundler compiles, so Tailwind/NativeWind classes work there.

**Step lifecycle** — async `before`, `delayBefore`, `autoAdvance`,
per-step callbacks, conditional `active` steps, configurable backdrop
behavior (tap to advance, dismiss, or nothing).

**Gesture tours** — `swipeHint` draws an animated hand and turns a step
into a swipe-to-advance demo. When the target's own list can be subscribed
to, the tour counts real native swipes instead of capturing touches — the
list scrolls itself, exactly as it would with no tour running.

```tsx
{
  id: "inbox",
  targetId: "inbox-list",
  title: "Your inbox",
  description: "Swipe up to catch up.",
  swipeHint: "up",
  scroll: { handle },
}
```

**Press the real button** — two ways, depending on whether the tour needs
to know about the tap.

`passThroughTouches: true` renders nothing over the spotlight, so the touch
reaches the real control and it behaves exactly as it would with no tour
running — its own navigation, analytics, haptics, disabled state. Nothing to
restate:

```tsx
{
  id: "menu",
  targetId: "drawer-button",
  title: "Your menu",
  description: "Tap here for your profile and settings.",
  passThroughTouches: true,   // the button just works
}
```

Everything outside the spotlight is still blocked. Two things change for a
step that opts in, which is why it isn't the default yet:

- `onSpotlightPress` never fires — there's nothing over the hole left to
  detect the tap with, so pick one or the other.
- `backdropBehavior` no longer applies to taps _inside_ the spotlight. Only
  taps outside reach the backdrop handler.

So a pass-through step advances from the tooltip, `autoAdvance`, or a tap
outside — not from the control itself.

When the tour _does_ need to react to the press, keep the default and use
`onSpotlightPress`: it fires when the user taps the highlighted control
rather than a tooltip shortcut, at the cost of re-invoking the action
yourself. Pairs with `hideNextButton` for "teach the live action" steps, or
with `createWizardTourSteps()` for a Prev/Next-driven carousel.

Set `passThroughTouches` on `TourGuideConfig` to apply it to a whole tour; a
step can still opt out.

### Tours are single-screen

A tour runs on the screen it started on. `TourGuideOverlay` sits above your
navigator, so it survives a navigation — but the engine doesn't follow: the
spotlight keeps the rect it already measured, and a target that unmounted
can't be re-measured. Spotlight a control that navigates away and the tour
is left ringing empty space on the new screen.

So if a spotlighted control navigates, **make it the last step** — end the
tour there and start a fresh one on the destination:

```tsx
{
  id: "open-settings",
  targetId: "settings-button",
  title: "Settings",
  description: "Everything else lives in here.",
  passThroughTouches: true,   // the button navigates for real
  hideNextButton: true,
  autoAdvance: 1200,          // ...and the tour bows out behind it
}
```

Carrying one tour across screens is on the [roadmap](#roadmap).

**Play once, persist forever** — `persist: true` plus `tourId` and it
just won't show again, zero storage setup. Pass `TourGuideProvider` a real
adapter (`storage={AsyncStorage}`, MMKV, anything shaped like
`{ getItem, setItem, removeItem? }`) to survive restarts.

**Events** — `events.on('start' | 'stepChange' | 'end' | 'skip' | 'pause' | 'resume', handler)`
for analytics, wired the same way anywhere in the tree.

## API reference

### `useTourGuide()`

```ts
const {
  startTour, // (steps: TourStep[], config?: TourGuideConfig) => void
  nextStep,
  prevStep,
  goToStep,
  skipTour,
  endTour,
  pauseTour,
  resumeTour,
  resetTour,
  isActive,
  isPaused,
  currentStep,
  currentStepIndex,
  totalSteps,
  tourId,
  events,
} = useTourGuide();
```

Every function here is referentially stable — safe to drop straight into a
`useEffect` dependency array, no `eslint-disable` required.

### `<TourScrollList>`

```tsx
<TourScrollList
  as={FlashList}              // stable reference: FlatList, SectionList, FlashList, LegendList
  id="item-list"               // TourTarget id + step targetId
  tourId="item-list-tour"
  persist
  title="Your items"
  description="Swipe up to see more."
  swipeHint="up"
  active={useIsFocused()}      // default true
  pagingEnabled                 // auto-detected: steps with scrollToIndex(0)
  spotlightPadding={8}          // or { horizontal, vertical } — default 8/8
  spotlightBorderRadius={12}
  wrapperStyle={{ flex: 1 }}    // default
  tourStep={{ ... }}            // merged over the generated step
  tourConfig={{ ... }}          // merged into startTour's config
  data={items}
  renderItem={...}
/>
```

### `<TourTarget>`

Wraps anything you want to spotlight, so a step can reference it by
`targetId` instead of threading a ref through.

| Prop                    | Type                                   | Default  | Purpose                                                           |
| ----------------------- | -------------------------------------- | -------- | ----------------------------------------------------------------- |
| `id`                    | `string`                               | required | Referenced by a step's `targetId`                                 |
| `spotlightBorderRadius` | `number`                               | `12`     | Cutout radius for every step targeting this (`999` = circle/pill) |
| `spotlightPadding`      | `number \| { horizontal?, vertical? }` | `8`      | Space between this target and the cutout                          |
| ...`ViewProps`          |                                        |          | Forwarded to the wrapper `View`                                   |

Declaring the shape here rather than on each step keeps it with the thing
being highlighted. A step's own `spotlightBorderRadius` / `spotlightPadding`
still wins when it sets one.

It sizes to its content like a plain `View` — pass `style={{ flex: 1 }}`
when wrapping a flex-filling child (a full-height list), or the spotlight
collapses to zero height. In development a target that measures to zero
size logs a warning naming it.

> **Natively-rendered targets.** Anything drawn by native code rather than
> React Native — `expo-router`'s native tabs (a UIKit `UITabBar`), a native
> header — has no view to wrap or measure, so `<TourTarget>` can't reach it.
> Use `targetRegion` with screen coordinates for those. If a step's target
> never measures, the overlay warns in development and stops blocking
> touches rather than leaving the app untappable behind an invisible scrim.

### `useTourScroll()`

```ts
const { ref, scrollProps, handle, reset } = useTourScroll({
  horizontal?: boolean,
  pagingEnabled?: boolean,   // steps with scrollToIndex(0) unless `index` is set
  onScroll?: (event) => void,
  onScrollBeginDrag?: (event) => void,
  onScrollEndDrag?: (event) => void,
  onMomentumScrollBegin?: (event) => void,
  onMomentumScrollEnd?: (event) => void,
});

<FlatList ref={ref} {...scrollProps} ... />
// handle → a step's `scroll` option. reset() → jump back to the top.
```

Need your own `onMomentumScrollEnd` (to track the current page, say)?
Pass it here, not as a separate prop on the list after `{...scrollProps}`
— setting it afterwards replaces the hook's own handler instead of adding
to it, and `swipeHint` steps on that list silently stop advancing. All
five callbacks above compose with the hook's own the same way.

### `TourStep`

| Property                                                                | Type                                          | Default                                                   | Purpose                                                           |
| ----------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------- |
| `id`                                                                    | `string`                                      | required                                                  | Unique step id                                                    |
| `targetRef` / `targetId` / `targetRegion`                               | see [Targeting](#everything-else-in-one-pass) | —                                                         | What to highlight. `targetRegion` is in window/screen coordinates |
| `title` / `description`                                                 | `string`                                      | required                                                  | Tooltip copy                                                      |
| `tooltipPosition`                                                       | `'top'\|'bottom'\|'left'\|'right'\|'auto'`    | `'auto'`                                                  | Preferred side                                                    |
| `spotlightPadding`                                                      | `number \| { horizontal?, vertical? }`        | target's, else `8`                                        | Space around the cutout                                           |
| `spotlightBorderRadius`                                                 | `number`                                      | target's, else `12`                                       | Cutout corner radius (`999` = circle)                             |
| `active`                                                                | `boolean`                                     | `true`                                                    | Exclude from the tour when `false`                                |
| `backdropBehavior`                                                      | `'next'\|'dismiss'\|'none'`                   | `'none'`                                                  | Tap-outside behavior                                              |
| `autoAdvance`                                                           | `number`                                      | —                                                         | Auto-advance after N ms                                           |
| `before` / `delayBefore`                                                | fn / `number`                                 | —                                                         | Gate on async work, then wait                                     |
| `scroll`                                                                | `TourScrollOptions \| [...]`                  | —                                                         | Scroll a list into view first                                     |
| `swipeHint`                                                             | direction or `SwipeHintConfig`                | —                                                         | Animated hand + gesture tour                                      |
| `renderTooltip`                                                         | `(props) => ReactNode`                        | —                                                         | Per-step custom tooltip                                           |
| `hideNextButton` / `hidePrevButton` / `hideSkipButton` / `hideControls` | `boolean`                                     | `false`                                                   | Hide controls                                                     |
| `swipeCount`                                                            | `number`                                      | `3` (paging list) / `2` (plain list) when `swipeHint` set | Swipes before this step advances                                  |
| `passThroughTouches`                                                    | `boolean`                                     | `false`                                                   | Render nothing over the hole so the real control gets the touch   |
| `onNext` / `onPrev` / `onSkip` / `onSpotlightPress`                     | `() => void`                                  | —                                                         | Callbacks                                                         |

### `TourGuideConfig`

`tooltipStyles`, `spotlightStyles`, `styles`, `renderTooltip`,
`showProgressDots`, `showStepCounter`, `*ButtonText`, `animationDuration`,
`motion`, `tourId`, `persist`, `defaultBackdropBehavior`, `swipeCount`,
`passThroughTouches`, `onTourStart` / `onTourEnd` / `onStepChange`.

## Example app

```bash
git clone https://github.com/kaisarsofi/react-native-tour-guide.git
cd react-native-tour-guide/example && npm install && npx expo start
```

Three tabs — Targeting, Behavior, Scrolling — covering every pattern above
with real, runnable code.

## Roadmap

- [x] Pass touches through the spotlight cutout to the live view
      (`passThroughTouches`, opt-in — see [Press the real button](#everything-else-in-one-pass))
- [ ] Make `passThroughTouches` the default, once a pass-through step can
      also self-advance without a capture view over the hole
- [ ] **Cross-screen tours** — carry a tour across navigation, so a step
      whose control navigates can continue on the screen it lands on. Needs
      two things the engine doesn't have yet: a way to know the press
      happened without capturing it, and a registry that waits for a target
      that mounts a moment later instead of measuring once. Today a tour is
      single-screen: see [Tours are single-screen](#tours-are-single-screen).
- [ ] Reach natively-rendered targets (`expo-router` native tabs, native
      headers) without hand-written `targetRegion` coordinates
- [ ] Optional blur backdrop
- [ ] Multi-hole / multi-target steps

[Open an issue](https://github.com/kaisarsofi/react-native-tour-guide/issues)
with a feature request.

## Contributing

```bash
git clone https://github.com/kaisarsofi/react-native-tour-guide.git
cd react-native-tour-guide && npm install && npm run validate
```

A Husky pre-commit hook runs lint, format, and typecheck automatically.

## License

MIT © [kaisarsofi](https://github.com/kaisarsofi)
