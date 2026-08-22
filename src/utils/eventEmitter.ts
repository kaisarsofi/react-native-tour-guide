import type { TourEventEmitter, TourEventName, TourEventPayload } from "../types";

export function createTourEventEmitter(): TourEventEmitter & {
  emit: <E extends TourEventName>(event: E, payload: TourEventPayload[E]) => void;
} {
  const listeners = new Map<TourEventName, Set<(payload: unknown) => void>>();

  return {
    on(event, handler) {
      const set = listeners.get(event) ?? new Set();
      set.add(handler as (payload: unknown) => void);
      listeners.set(event, set);
      return () => {
        set.delete(handler as (payload: unknown) => void);
      };
    },
    emit(event, payload) {
      listeners.get(event)?.forEach((handler) => handler(payload));
    },
  };
}
