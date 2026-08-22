/**
 * NativeWind augments core React Native components with a `className` prop
 * via its own ambient types (`nativewind-env.d.ts`) in the consuming app.
 * This package's own isolated `tsc --noEmit` run doesn't see those, so we
 * declare the same additive, optional prop here — it merges harmlessly with
 * the real augmentation when this package is consumed from an app that has
 * NativeWind (or Uniwind, which ships the same shape) configured.
 */
declare module "react-native" {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
}

export {};
