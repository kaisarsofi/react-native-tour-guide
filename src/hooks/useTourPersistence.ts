import { useCallback } from "react";

import { useTourGuideContext } from "../TourGuideContext";
import type { TourGuideConfig, TourStep } from "../types";

export interface TourStorageAdapter {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem?: (key: string) => void | Promise<void>;
}

const STORAGE_PREFIX = "react-native-tour:";

/**
 * Wraps `startTour` so a tour only plays once per `config.tourId`, persisted
 * via any AsyncStorage/MMKV-shaped adapter.
 */
export function useTourPersistence(storage: TourStorageAdapter) {
  const ctx = useTourGuideContext();

  const startTour = useCallback(
    async (steps: TourStep[], config: TourGuideConfig & { tourId: string }) => {
      const key = `${STORAGE_PREFIX}${config.tourId}`;
      const completed = await storage.getItem(key);
      if (completed === "true") return;

      ctx.startTour(steps, {
        ...config,
        onTourEnd: (isCompleted) => {
          config.onTourEnd?.(isCompleted);
          if (isCompleted) void storage.setItem(key, "true");
        },
      });
    },
    [ctx, storage],
  );

  const resetTour = useCallback(
    (tourId: string) => {
      const key = `${STORAGE_PREFIX}${tourId}`;
      if (storage.removeItem) {
        void storage.removeItem(key);
      } else {
        void storage.setItem(key, "false");
      }
    },
    [storage],
  );

  return { startTour, resetTour };
}
