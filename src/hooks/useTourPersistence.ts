import { useCallback } from "react";

import { useTourGuideContext } from "../TourGuideContext";
import type { TourGuideConfig, TourStep } from "../types";
import { storageKey, type TourStorageAdapter } from "../utils/storage";

export type { TourStorageAdapter };

/**
 * Wraps `startTour` so a tour only plays once per `config.tourId`, persisted
 * via any AsyncStorage/MMKV-shaped adapter.
 *
 * For most apps, `startTour(steps, { tourId, persist: true })` plus a
 * `storage` prop on `TourGuideProvider` does this without a separate hook —
 * reach for this one when a specific tour needs its own adapter or key
 * scheme instead of the provider's.
 */
export function useTourPersistence(storage: TourStorageAdapter) {
  const ctx = useTourGuideContext();

  const startTour = useCallback(
    async (steps: TourStep[], config: TourGuideConfig & { tourId: string }) => {
      const key = storageKey(config.tourId);
      const completed = await storage.getItem(key);
      if (completed === "true") return;

      ctx.startTour(steps, {
        ...config,
        onTourEnd: (isCompleted) => {
          config.onTourEnd?.(isCompleted);
          if (isCompleted) storage.setItem(key, "true");
        },
      });
    },
    [ctx, storage],
  );

  const resetTour = useCallback(
    (tourId: string) => {
      const key = storageKey(tourId);
      if (storage.removeItem) {
        storage.removeItem(key);
      } else {
        storage.setItem(key, "false");
      }
    },
    [storage],
  );

  return { startTour, resetTour };
}
