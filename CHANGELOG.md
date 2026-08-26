# Changelog

## 0.1.0

First public release: animated SVG spotlight, auto-placed tooltip, six
bundled themes, `TourTarget`, list / gesture tours (`useTourScroll`,
`swipeHint`), and events. JS-only — works in Expo Go and on both Paper and
the New Architecture.

### Spotlight shape belongs to the target

`<TourTarget>` takes `spotlightBorderRadius` and `spotlightPadding`, so a
round icon button stays round and a pill stays a pill for every step that
points at it. Precedence is step, then target, then default — a step can
still override, and each field falls back on its own.

### Touches can reach the spotlighted control

`passThroughTouches` renders nothing over the cutout, so the highlighted
button receives its own press and does whatever it already does — no
`onSpotlightPress` restating the action and drifting from it. Everything
outside the spotlight stays blocked.

Opt-in on `TourStep` and `TourGuideConfig`, because for a step that adopts
it `onSpotlightPress` can't fire (nothing is left to detect the tap) and
`backdropBehavior` no longer applies to taps _inside_ the spotlight.

### Fixes

- **`targetRegion` was in the wrong coordinate space.** Measured targets are
  converted into the overlay host's space; regions were passed through raw.
  The two only agreed when the host sat at the screen origin, so a status
  bar or notch above it — or an iPad max-width column centring it — offset
  every region by exactly that gap.
- **Measurement could hang forever.** `measure`/`measureInWindow` take a
  callback the platform needn't ever call; a detached view simply never
  answered and stalled the whole measure chain. It now resolves `null` after
  a timeout.
- **An unmeasurable target no longer traps the user.** With no rect the
  overlay kept a full-screen backdrop up with no spotlight and an invisible
  tooltip — indistinguishable from a frozen app. It now stops capturing
  touches once measuring gives up, and says so in `__DEV__`.

### Known limitations

- **Tours are single-screen.** The overlay survives navigation but the
  engine doesn't follow: the spotlight keeps its measured rect and an
  unmounted target can't be re-measured. Make a navigating control the last
  step. Cross-screen tours are on the roadmap.
- **Natively-rendered targets can't be wrapped.** Anything drawn outside
  React Native — `expo-router`'s native tabs, a native header — has no view
  to measure, so `<TourTarget>` can't reach it. Use `targetRegion` with
  screen coordinates instead.
