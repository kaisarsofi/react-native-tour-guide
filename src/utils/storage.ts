export interface TourStorageAdapter {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem?: (key: string) => void | Promise<void>;
}

export const STORAGE_PREFIX = "react-native-tour-guide:";

export function storageKey(tourId: string): string {
  return `${STORAGE_PREFIX}${tourId}`;
}

/**
 * In-memory adapter used when no `storage` is passed to `TourGuideProvider`.
 * A tour marked `persist: true` still won't repeat for the rest of this app
 * session with zero setup — it just doesn't survive a restart. For that,
 * pass a real adapter (AsyncStorage, MMKV, ...) as `storage`; this package
 * can't auto-detect one itself, since Metro resolves `require()` calls at
 * bundle time — requiring an optional dependency that isn't installed would
 * break the consumer's build even inside a try/catch.
 */
export function createMemoryStorage(): TourStorageAdapter {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}
