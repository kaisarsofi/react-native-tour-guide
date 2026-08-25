import React from "react";
import { act, renderHook } from "@testing-library/react-native";

import { useTourGuide } from "../hooks/useTourGuide";
import { TourGuideProvider } from "../TourGuideContext";
import type { TourStorageAdapter } from "../utils/storage";
import { makeStep } from "./helpers";

function makeWrapper(storage?: TourStorageAdapter) {
  return ({ children }: { children: React.ReactNode }) => (
    <TourGuideProvider storage={storage}>{children}</TourGuideProvider>
  );
}

function createMockStorage(): TourStorageAdapter & { store: Record<string, string> } {
  const store: Record<string, string> = {};
  return {
    store,
    getItem: jest.fn(async (key: string) => store[key] ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn(async (key: string) => {
      delete store[key];
    }),
  };
}

async function start(
  result: { current: ReturnType<typeof useTourGuide> },
  config?: Parameters<ReturnType<typeof useTourGuide>["startTour"]>[1],
) {
  await act(async () => {
    result.current.startTour([makeStep()], config);
  });
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("startTour({ persist: true })", () => {
  it("starts normally without persist, even with a tourId", async () => {
    const { result } = renderHook(() => useTourGuide(), { wrapper: makeWrapper() });

    await start(result, { tourId: "onboarding" });
    expect(result.current.isActive).toBe(true);
    act(() => result.current.endTour(true));

    await start(result, { tourId: "onboarding" });
    expect(result.current.isActive).toBe(true);
  });

  it("is ignored without a tourId (starts normally)", async () => {
    const { result } = renderHook(() => useTourGuide(), { wrapper: makeWrapper() });

    await start(result, { persist: true });
    expect(result.current.isActive).toBe(true);
  });

  it("skips a completed persisted tour on the next startTour call", async () => {
    const { result } = renderHook(() => useTourGuide(), { wrapper: makeWrapper() });

    await start(result, { tourId: "onboarding", persist: true });
    expect(result.current.isActive).toBe(true);

    act(() => result.current.endTour(true));
    expect(result.current.isActive).toBe(false);

    await start(result, { tourId: "onboarding", persist: true });
    expect(result.current.isActive).toBe(false);
  });

  it("does not persist a tour ended without completing or skipping it", async () => {
    const { result } = renderHook(() => useTourGuide(), { wrapper: makeWrapper() });

    await start(result, { tourId: "onboarding", persist: true });
    act(() => result.current.endTour(false));

    await start(result, { tourId: "onboarding", persist: true });
    expect(result.current.isActive).toBe(true);
  });

  it("persists a tour the user explicitly skipped, same as completing it", async () => {
    const { result } = renderHook(() => useTourGuide(), { wrapper: makeWrapper() });

    await start(result, { tourId: "onboarding", persist: true });
    act(() => result.current.skipTour());
    expect(result.current.isActive).toBe(false);

    await start(result, { tourId: "onboarding", persist: true });
    expect(result.current.isActive).toBe(false);
  });

  it("still calls the caller's onTourEnd", async () => {
    const onTourEnd = jest.fn();
    const { result } = renderHook(() => useTourGuide(), { wrapper: makeWrapper() });

    await start(result, { tourId: "onboarding", persist: true, onTourEnd });
    act(() => result.current.endTour(true));

    expect(onTourEnd).toHaveBeenCalledWith(true);
  });

  it("shows the tour again after resetTour", async () => {
    const { result } = renderHook(() => useTourGuide(), { wrapper: makeWrapper() });

    await start(result, { tourId: "onboarding", persist: true });
    act(() => result.current.endTour(true));

    act(() => result.current.resetTour("onboarding"));
    await act(async () => {
      await Promise.resolve();
    });

    await start(result, { tourId: "onboarding", persist: true });
    expect(result.current.isActive).toBe(true);
  });

  it("uses a custom storage adapter passed to TourGuideProvider", async () => {
    const storage = createMockStorage();
    const { result } = renderHook(() => useTourGuide(), {
      wrapper: makeWrapper(storage),
    });

    await start(result, { tourId: "onboarding", persist: true });
    act(() => result.current.endTour(true));

    expect(storage.setItem).toHaveBeenCalledWith(
      "react-native-tour-guide:onboarding",
      "true",
    );
    expect(storage.store["react-native-tour-guide:onboarding"]).toBe("true");
  });
});
