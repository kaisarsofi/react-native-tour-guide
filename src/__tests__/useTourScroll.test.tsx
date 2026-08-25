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

  it("notifies subscribers with each scroll tick", () => {
    const { result } = renderHook(() => useTourScroll());
    const listener = jest.fn();

    let unsubscribe: () => void = () => {};
    act(() => {
      unsubscribe = result.current.handle.subscribe!(listener);
      result.current.scrollProps.onScroll(scrollEvent(0, 96));
    });

    expect(listener).toHaveBeenCalledWith({ x: 0, y: 96 });

    act(() => {
      unsubscribe();
      result.current.scrollProps.onScroll(scrollEvent(0, 192));
    });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("gives each subscriber its own offset snapshot, not the live ref", () => {
    const { result } = renderHook(() => useTourScroll());
    const seen: Array<{ x: number; y: number }> = [];

    act(() => {
      result.current.handle.subscribe!((offset) => seen.push(offset));
      result.current.scrollProps.onScroll(scrollEvent(0, 10));
      result.current.scrollProps.onScroll(scrollEvent(0, 20));
    });

    expect(seen).toEqual([
      { x: 0, y: 10 },
      { x: 0, y: 20 },
    ]);
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
