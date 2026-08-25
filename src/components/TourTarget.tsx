import React, { useEffect, useRef } from "react";
import { View, type ViewProps } from "react-native";

import { useTourGuideContext } from "../TourGuideContext";

export interface TourTargetProps extends ViewProps {
  /** Referenced from a `TourStep` via `targetId`. */
  id: string;
  className?: string;
}

/**
 * Ref-free way to mark a component as a tour target: wrap it once, then
 * reference it from a step with `targetId` instead of managing a ref.
 *
 * `TourTarget` sizes to its content by default like any plain `View` — pass
 * `style={{ flex: 1 }}` (or the `TourScrollList` wrapper, which does this
 * for you) when wrapping a flex-filling child such as a full-height list, or
 * the spotlight collapses to zero height. In development, a target that
 * measures to zero size logs a warning naming the culprit.
 */
export function TourTarget({ id, children, ...viewProps }: TourTargetProps) {
  const { registerTarget } = useTourGuideContext();
  const ref = useRef<View>(null);

  useEffect(() => registerTarget(id, ref), [id, registerTarget]);

  return (
    <View ref={ref} collapsable={false} {...viewProps}>
      {children}
    </View>
  );
}
