import React, { useEffect, useImperativeHandle } from "react";
import { View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { act, render, screen } from "@testing-library/react-native";
import { FlashList } from "@shopify/flash-list";
import { LegendList } from "@legendapp/list/react-native";

import { TourGuideOverlay } from "../components/TourGuideOverlay";
import { TourScrollList } from "../components/TourScrollList";
import { TourGuideProvider } from "../TourGuideContext";
import { useTourGuide } from "../hooks/useTourGuide";
import type { TourStep } from "../types";

let mountCount = 0;

interface FakeListProps {
  data?: readonly unknown[] | null;
  testID?: string;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  pagingEnabled?: boolean | null;
  renderItem?: unknown;
}

const FakeList = React.forwardRef<
  { scrollToIndex: jest.Mock; scrollToOffset: jest.Mock },
  FakeListProps
>((props, ref) => {
  useImperativeHandle(ref, () => ({
    scrollToIndex: jest.fn(),
    scrollToOffset: jest.fn(),
  }));
  useEffect(() => {
    mountCount += 1;
  }, []);
  return <View testID={props.testID ?? "fake-list"} />;
});

function StartedStepsListener({ onStart }: { onStart: (steps: TourStep[]) => void }) {
  const { events } = useTourGuide();
  useEffect(() => events.on("start", ({ steps }) => onStart(steps)), [events, onStart]);
  return null;
}

describe("TourScrollList", () => {
  beforeEach(() => {
    mountCount = 0;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the wrapped list and forwards extra props through", () => {
    render(
      <TourGuideProvider>
        <TourScrollList<FakeListProps>
          as={FakeList}
          id="list"
          title="Your list"
          description="Scroll on"
          data={[1, 2, 3]}
          testID="my-list"
        />
      </TourGuideProvider>,
    );

    expect(screen.getByTestId("my-list")).toBeTruthy();
  });

  it("does not start a tour while data is still empty", () => {
    const onStart = jest.fn();
    render(
      <TourGuideProvider>
        <StartedStepsListener onStart={onStart} />
        <TourScrollList
          as={FakeList}
          id="list"
          title="Your list"
          description="Scroll on"
          data={[]}
        />
      </TourGuideProvider>,
    );

    expect(onStart).not.toHaveBeenCalled();
  });

  it("starts the tour once data goes from empty to non-empty, targeting its own id", async () => {
    const onStart = jest.fn();

    function Harness({ data }: { data: number[] }) {
      return (
        <TourGuideProvider>
          <StartedStepsListener onStart={onStart} />
          <TourScrollList
            as={FakeList}
            id="matches-list"
            title="Your matches"
            description="Swipe up to see more profiles."
            data={data}
          />
          <TourGuideOverlay />
        </TourGuideProvider>
      );
    }

    const { rerender } = render(<Harness data={[]} />);
    expect(onStart).not.toHaveBeenCalled();

    await act(async () => {
      rerender(<Harness data={[1, 2, 3]} />);
      await Promise.resolve();
    });
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(onStart).toHaveBeenCalledTimes(1);
    const steps = onStart.mock.calls[0]![0] as TourStep[];
    expect(steps).toHaveLength(1);
    expect(steps[0]!.id).toBe("matches-list");
    expect(steps[0]!.targetId).toBe("matches-list");
    expect(steps[0]!.title).toBe("Your matches");
    expect(steps[0]!.scroll).toBeTruthy();
  });

  it("leaves spotlightPadding/spotlightBorderRadius unset by default, so the overlay's own defaults apply", async () => {
    const onStart = jest.fn();

    function Harness({ data }: { data: number[] }) {
      return (
        <TourGuideProvider>
          <StartedStepsListener onStart={onStart} />
          <TourScrollList
            as={FakeList}
            id="matches-list"
            title="Your matches"
            description="Swipe up to see more profiles."
            data={data}
          />
          <TourGuideOverlay />
        </TourGuideProvider>
      );
    }

    const { rerender } = render(<Harness data={[]} />);
    await act(async () => {
      rerender(<Harness data={[1, 2, 3]} />);
      await Promise.resolve();
    });
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    const steps = onStart.mock.calls[0]![0] as TourStep[];
    expect(steps[0]!.spotlightPadding).toBeUndefined();
    expect(steps[0]!.spotlightBorderRadius).toBeUndefined();
  });

  it("forwards spotlightPadding and spotlightBorderRadius onto the generated step", async () => {
    const onStart = jest.fn();

    function Harness({ data }: { data: number[] }) {
      return (
        <TourGuideProvider>
          <StartedStepsListener onStart={onStart} />
          <TourScrollList
            as={FakeList}
            id="matches-list"
            title="Your matches"
            description="Swipe up to see more profiles."
            spotlightPadding={0}
            spotlightBorderRadius={36}
            data={data}
          />
          <TourGuideOverlay />
        </TourGuideProvider>
      );
    }

    const { rerender } = render(<Harness data={[]} />);
    await act(async () => {
      rerender(<Harness data={[1, 2, 3]} />);
      await Promise.resolve();
    });
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    const steps = onStart.mock.calls[0]![0] as TourStep[];
    expect(steps[0]!.spotlightPadding).toBe(0);
    expect(steps[0]!.spotlightBorderRadius).toBe(36);
  });

  it("lets tourStep override spotlightPadding/spotlightBorderRadius when both are set", async () => {
    const onStart = jest.fn();

    function Harness({ data }: { data: number[] }) {
      return (
        <TourGuideProvider>
          <StartedStepsListener onStart={onStart} />
          <TourScrollList
            as={FakeList}
            id="matches-list"
            title="Your matches"
            description="Swipe up to see more profiles."
            spotlightPadding={0}
            tourStep={{ spotlightPadding: 20 }}
            data={data}
          />
          <TourGuideOverlay />
        </TourGuideProvider>
      );
    }

    const { rerender } = render(<Harness data={[]} />);
    await act(async () => {
      rerender(<Harness data={[1, 2, 3]} />);
      await Promise.resolve();
    });
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    const steps = onStart.mock.calls[0]![0] as TourStep[];
    expect(steps[0]!.spotlightPadding).toBe(20);
  });

  it("does not start the tour while inactive, even once data is present", async () => {
    const onStart = jest.fn();

    render(
      <TourGuideProvider>
        <StartedStepsListener onStart={onStart} />
        <TourScrollList
          as={FakeList}
          id="list"
          title="Your list"
          description="Scroll on"
          data={[1, 2, 3]}
          active={false}
        />
      </TourGuideProvider>,
    );

    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(onStart).not.toHaveBeenCalled();
  });

  it("starts the tour when `active` flips to true while data is already present (a backgrounded tab screen gaining focus)", async () => {
    const onStart = jest.fn();

    function Harness({ active }: { active: boolean }) {
      return (
        <TourGuideProvider>
          <StartedStepsListener onStart={onStart} />
          <TourScrollList
            as={FakeList}
            id="list"
            title="Your list"
            description="Scroll on"
            data={[1, 2, 3]}
            active={active}
          />
        </TourGuideProvider>
      );
    }

    const { rerender } = render(<Harness active={false} />);
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });
    expect(onStart).not.toHaveBeenCalled();

    await act(async () => {
      rerender(<Harness active={true} />);
      await Promise.resolve();
    });
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(onStart).toHaveBeenCalledTimes(1);

    // Flipping active again (e.g. leaving and re-entering the tab) while
    // data stays present re-fires — the same "became ready" transition.
    await act(async () => {
      rerender(<Harness active={false} />);
      await Promise.resolve();
    });
    await act(async () => {
      rerender(<Harness active={true} />);
      await Promise.resolve();
    });
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(onStart).toHaveBeenCalledTimes(2);
  });

  it("marks the generated step's scroll handle paging when pagingEnabled is set, without an explicit index", async () => {
    const onStart = jest.fn();

    function Harness({ data }: { data: number[] }) {
      return (
        <TourGuideProvider>
          <StartedStepsListener onStart={onStart} />
          <TourScrollList
            as={FakeList}
            id="cards"
            title="Cards"
            description="Swipe through"
            data={data}
            pagingEnabled
          />
        </TourGuideProvider>
      );
    }

    const { rerender } = render(<Harness data={[]} />);
    await act(async () => {
      rerender(<Harness data={[1, 2]} />);
      await Promise.resolve();
    });
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    const steps = onStart.mock.calls[0]![0] as TourStep[];
    const scroll = steps[0]!.scroll as {
      handle: { pagingEnabled: boolean };
      index?: number;
    };
    expect(scroll.handle.pagingEnabled).toBe(true);
    expect(scroll.index).toBeUndefined();
  });

  it("does not remount the underlying list across re-renders when `as` stays the same reference", () => {
    function Harness({ title }: { title: string }) {
      return (
        <TourGuideProvider>
          <TourScrollList
            as={FakeList}
            id="list"
            title={title}
            description="Scroll on"
            data={[1, 2, 3]}
          />
        </TourGuideProvider>
      );
    }

    const { rerender } = render(<Harness title="First" />);
    expect(mountCount).toBe(1);

    rerender(<Harness title="Second" />);
    rerender(<Harness title="Third" />);

    expect(mountCount).toBe(1);
  });

  it("works with a real FlashList as `as`", () => {
    render(
      <TourGuideProvider>
        <TourScrollList
          as={FlashList}
          id="flash-list"
          title="Flash"
          description="Fast list"
          data={[1, 2, 3]}
          renderItem={() => null}
          testID="real-flash-list"
        />
      </TourGuideProvider>,
    );

    expect(screen.getByTestId("real-flash-list")).toBeTruthy();
  });

  it("works with a real LegendList as `as`", () => {
    render(
      <TourGuideProvider>
        <TourScrollList
          as={LegendList}
          id="legend-list"
          title="Legend"
          description="Recycling list"
          data={[1, 2, 3]}
          renderItem={() => null}
          keyExtractor={(item: unknown) => String(item)}
          recycleItems
          testID="real-legend-list"
        />
      </TourGuideProvider>,
    );

    expect(screen.getByTestId("real-legend-list")).toBeTruthy();
  });
});
