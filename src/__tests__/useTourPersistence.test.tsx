import React from "react";
import { act, renderHook } from "@testing-library/react-native";

import {
  useTourPersistence,
  type TourStorageAdapter,
} from "../hooks/useTourPersistence";
import type { TourGuideContextValue } from "../TourGuideContext";
import { makeStep } from "./helpers";

const mockStartTour = jest.fn();

const mockContext: TourGuideContextValue = {
  state: {
    steps: [],
    config: {
      tooltipStyles: {} as TourGuideContextValue["state"]["config"]["tooltipStyles"],
      spotlightStyles:
        {} as TourGuideContextValue["state"]["config"]["spotlightStyles"],
      showProgressDots: true,
      showStepCounter: true,
      nextButtonText: "Next",
      prevButtonText: "Back",
      skipButtonText: "Skip",
      doneButtonText: "Done",
      animationDuration: 320,
      motion: "morph",
      defaultBackdropBehavior: "none",
    },
    currentIndex: 0,
    isActive: false,
    isPaused: false,
    targetRect: null,
    measuring: false,
  },
  startTour: mockStartTour,
  nextStep: jest.fn(),
  prevStep: jest.fn(),
  goToStep: jest.fn(),
  skipTour: jest.fn(),
  endTour: jest.fn(),
  pauseTour: jest.fn(),
  resumeTour: jest.fn(),
  handleBackdropPress: jest.fn(),
  registerTarget: jest.fn(),
  registerOverlayHost: jest.fn(),
  events: { on: jest.fn(() => jest.fn()) },
};

jest.mock("../TourGuideContext", () => ({
  useTourGuideContext: () => mockContext,
}));

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

const wrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

describe("useTourPersistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("starts a tour that has not been completed", async () => {
    const storage = createMockStorage();
    const { result } = renderHook(() => useTourPersistence(storage), { wrapper });

    await act(async () => {
      await result.current.startTour([makeStep()], { tourId: "onboarding" });
    });

    expect(mockStartTour).toHaveBeenCalledTimes(1);
    expect(mockStartTour.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({ tourId: "onboarding" }),
    );
  });

  it("skips a tour that was already completed", async () => {
    const storage = createMockStorage();
    storage.store["react-native-tour-guide:onboarding"] = "true";
    const { result } = renderHook(() => useTourPersistence(storage), { wrapper });

    await act(async () => {
      await result.current.startTour([makeStep()], { tourId: "onboarding" });
    });

    expect(mockStartTour).not.toHaveBeenCalled();
  });

  it("marks the tour completed when onTourEnd(true) fires", async () => {
    const storage = createMockStorage();
    const originalOnTourEnd = jest.fn();
    const { result } = renderHook(() => useTourPersistence(storage), { wrapper });

    await act(async () => {
      await result.current.startTour([makeStep()], {
        tourId: "feature",
        onTourEnd: originalOnTourEnd,
      });
    });

    const passedConfig = mockStartTour.mock.calls[0]?.[1] as {
      onTourEnd?: (completed: boolean) => void;
    };
    await act(async () => {
      passedConfig.onTourEnd?.(true);
    });

    expect(originalOnTourEnd).toHaveBeenCalledWith(true);
    expect(storage.setItem).toHaveBeenCalledWith(
      "react-native-tour-guide:feature",
      "true",
    );
  });

  it("does not persist a skipped tour", async () => {
    const storage = createMockStorage();
    const { result } = renderHook(() => useTourPersistence(storage), { wrapper });

    await act(async () => {
      await result.current.startTour([makeStep()], { tourId: "feature" });
    });

    const passedConfig = mockStartTour.mock.calls[0]?.[1] as {
      onTourEnd?: (completed: boolean) => void;
    };
    await act(async () => {
      passedConfig.onTourEnd?.(false);
    });

    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("clears a completed tour with resetTour", async () => {
    const storage = createMockStorage();
    storage.store["react-native-tour-guide:onboarding"] = "true";
    const { result } = renderHook(() => useTourPersistence(storage), { wrapper });

    await act(async () => {
      result.current.resetTour("onboarding");
    });

    expect(storage.removeItem).toHaveBeenCalledWith(
      "react-native-tour-guide:onboarding",
    );
  });

  it("writes false when resetTour has no removeItem", async () => {
    const store: Record<string, string> = {
      "react-native-tour-guide:onboarding": "true",
    };
    const storage: TourStorageAdapter = {
      getItem: jest.fn(async (key) => store[key] ?? null),
      setItem: jest.fn(async (key, value) => {
        store[key] = value;
      }),
    };
    const { result } = renderHook(() => useTourPersistence(storage), { wrapper });

    await act(async () => {
      result.current.resetTour("onboarding");
    });

    expect(storage.setItem).toHaveBeenCalledWith(
      "react-native-tour-guide:onboarding",
      "false",
    );
  });
});
