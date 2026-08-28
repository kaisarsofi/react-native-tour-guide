# Changelog

## Unreleased

### The engine follows a tour across screens

A step advanced (`nextStep`/`goToStep`) onto a target that hasn't mounted
yet — most often because it lives on a screen still navigating in — used to
measure once, find nothing, and give up: the spotlight sat on empty space
until something else happened to re-trigger measurement. The target
registry now remembers what a waiting step needs and finishes its
measurement itself the instant the matching `<TourTarget>` registers, so a
step whose `onSpotlightPress`/`onNext` navigates and then calls `nextStep()`
picks its target up on the destination screen with no extra setup.

This covers a step-driven advance (`onSpotlightPress`, `onNext`, a step's
own `before`). A `passThroughTouches` step that navigates on its own, with
nothing calling `nextStep()` for it, still can't be followed — see
[`passThroughTouches` can't advance itself](README.md#passthroughtouches-cant-advance-itself)
in the README.

### Measurement now waits for a target to stop moving, not just to exist

Every target resolution — not only the late/cross-screen case above — used
to measure once, a fixed two frames after the step became current, and
commit to whatever it got. If that view was still animating into place (a
drawer sliding open, a screen transition still finishing), the spotlight
could lock onto a mid-animation position and stay there once the animation
caught up and moved on without it — visually, the spotlight "jumps" to the
wrong spot and the overlay gives up on it. This previously had one real
fix: hand-tuning `delayBefore` per step to outlast whatever transition sits
in front of it, which nobody discovers until they hit the bug.

Target measurement now polls a frame apart and only commits once two
consecutive reads agree (within half a pixel), for up to 700ms before
giving up and using the last reading — so it settles itself on the common
case (a target moving because of an animation already in flight) without
requiring a step to declare how long that takes. `delayBefore` keeps its
own, narrower job: gating on work that has to finish *before* the target
even starts rendering — an async data load, a screen that doesn't mount its
`<TourTarget>` at all until then. Combine both when a step's target is
gated on data *and* sits behind an animated transition once it does render.

## 1.0.0

First stable public release: animated SVG spotlight, auto-placed tooltip, six
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
