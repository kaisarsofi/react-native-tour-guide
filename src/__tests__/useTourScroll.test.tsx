import { act, renderHook } from "@testing-library/react-native";
import React from "react";
import {
  FlatList,
  ScrollView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { useTourScroll } from "../hooks/useTourScroll";

function scrollEvent(x: number, y: number) {
  return {
    nativeEvent: { contentOffset: { x, y } },
  } as NativeSyntheticEvent<NativeScrollEvent>;
}

describe("useTourScroll", () => {
  it("starts at a zero offset and exposes a stable handle", () => {
    const { result, rerender } = renderHook(() => useTourScroll());

    expect(result.current.handle.offsetRef.current).toEqual({ x: 0, y: 0 });
    expect(result.current.handle.horizontal).toBe(false);
    expect(result.current.scrollProps.scrollEventThrottle).toBe(16);

    const firstHandle = result.current.handle;
    rerender({});
    expect(result.current.handle).toBe(firstHandle);
  });

  it("tracks the live scroll offset without re-rendering", () => {
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return useTourScroll();
    });

    const rendersAfterMount = renders;

    act(() => {
      result.current.scrollProps.onScroll(scrollEvent(0, 240));
    });

    expect(result.current.handle.offsetRef.current).toEqual({ x: 0, y: 240 });
    expect(renders).toBe(rendersAfterMount);
  });

  it("marks the handle horizontal when asked", () => {
    const { result } = renderHook(() => useTourScroll({ horizontal: true }));

    expect(result.current.handle.horizontal).toBe(true);
  });

  it("still calls a caller-supplied onScroll", () => {
    const onScroll = jest.fn();
    const { result } = renderHook(() => useTourScroll({ onScroll }));

    const event = scrollEvent(120, 0);
    act(() => {
      result.current.scrollProps.onScroll(event);
    });

    expect(onScroll).toHaveBeenCalledWith(event);
    expect(result.current.handle.offsetRef.current.x).toBe(120);
  });

  it("reset jumps back to offset 0", () => {
    const scrollTo = jest.fn();
    const { result } = renderHook(() => useTourScroll());

    result.current.handle.ref.current = { scrollTo };
    act(() => {
      result.current.scrollProps.onScroll(scrollEvent(0, 240));
      result.current.reset();
    });

    expect(result.current.handle.offsetRef.current).toEqual({ x: 0, y: 0 });
    expect(scrollTo).toHaveBeenCalledWith({ y: 0, animated: false });
  });

  describe("subscribeGesture", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it("emits the net offset delta once a drag with no momentum settles", () => {
      const { result } = renderHook(() => useTourScroll());
      const listener = jest.fn();

      act(() => {
        result.current.handle.subscribeGesture!(listener);
        result.current.scrollProps.onScrollBeginDrag();
        result.current.scrollProps.onScroll(scrollEvent(0, 40));
        result.current.scrollProps.onScroll(scrollEvent(0, 96));
        result.current.scrollProps.onScrollEndDrag();
      });

      // Still inside the "might this have momentum?" grace window.
      expect(listener).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(60);
      });

      expect(listener).toHaveBeenCalledWith({ x: 0, y: 96 });
    });

    it("waits for onMomentumScrollEnd instead when the drag has momentum", () => {
      const { result } = renderHook(() => useTourScroll());
      const listener = jest.fn();

      act(() => {
        result.current.handle.subscribeGesture!(listener);
        result.current.scrollProps.onScrollBeginDrag();
        result.current.scrollProps.onScroll(scrollEvent(0, 50));
        result.current.scrollProps.onScrollEndDrag();
        result.current.scrollProps.onMomentumScrollBegin();
      });

      // The no-momentum grace window passes with nothing emitted — momentum
      // beginning preempted it.
      act(() => {
        jest.advanceTimersByTime(60);
      });
      expect(listener).not.toHaveBeenCalled();

      act(() => {
        result.current.scrollProps.onScroll(scrollEvent(0, 220));
        result.current.scrollProps.onMomentumScrollEnd();
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ x: 0, y: 220 });
    });

    it("stops notifying once unsubscribed", () => {
      const { result } = renderHook(() => useTourScroll());
      const listener = jest.fn();

      let unsubscribe: () => void = () => {};
      act(() => {
        unsubscribe = result.current.handle.subscribeGesture!(listener);
        result.current.scrollProps.onScrollBeginDrag();
        result.current.scrollProps.onScroll(scrollEvent(0, 60));
        result.current.scrollProps.onScrollEndDrag();
        jest.advanceTimersByTime(60);
      });
      expect(listener).toHaveBeenCalledTimes(1);

      act(() => {
        unsubscribe();
        result.current.scrollProps.onScrollBeginDrag();
        result.current.scrollProps.onScroll(scrollEvent(0, 120));
        result.current.scrollProps.onScrollEndDrag();
        jest.advanceTimersByTime(60);
      });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("never emits for a scroll with no drag session (e.g. a programmatic scroll)", () => {
      const { result } = renderHook(() => useTourScroll());
      const listener = jest.fn();

      act(() => {
        result.current.handle.subscribeGesture!(listener);
        result.current.scrollProps.onScroll(scrollEvent(0, 300));
        jest.advanceTimersByTime(200);
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  it("accepts FlatList and ScrollView refs without a generic", () => {
    function Demo() {
      const list = useTourScroll({ horizontal: true });
      const page = useTourScroll();
      return (
        <>
          <FlatList
            ref={list.ref}
            {...list.scrollProps}
            data={[] as string[]}
            renderItem={() => null}
          />
          <ScrollView ref={page.ref} {...page.scrollProps} />
        </>
      );
    }

    expect(<Demo />).toBeTruthy();
  });
});
