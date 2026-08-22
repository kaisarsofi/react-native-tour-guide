jest.mock("react-native-reanimated", () => {
  const React = require("react");
  const { View } = require("react-native");

  const noop = () => undefined;
  const identity = (value) => value;

  return {
    __esModule: true,
    default: {
      call: noop,
      View,
      createAnimatedComponent: (Component) => Component,
    },
    View,
    createAnimatedComponent: (Component) => Component,
    Easing: {
      out: identity,
      in: identity,
      inOut: identity,
      ease: noop,
      linear: noop,
    },
    cancelAnimation: noop,
    interpolate: (_value, _input, output) => (output ? output[0] : 0),
    useAnimatedProps: () => ({}),
    // Run the worklet so the component's interpolate/transform code is
    // actually exercised by render tests rather than skipped.
    useAnimatedStyle: (worklet) => {
      try {
        return worklet();
      } catch {
        return {};
      }
    },
    useSharedValue: (init) => ({ value: init }),
    withDelay: (_delay, animation) => animation,
    withRepeat: identity,
    withSequence: (...animations) => animations[0],
    withTiming: identity,
  };
});

jest.mock("react-native-worklets", () => ({}));

jest.mock("react-native-svg", () => {
  const React = require("react");
  const { View } = require("react-native");

  const Mock = React.forwardRef((props, ref) =>
    React.createElement(View, { ...props, ref }),
  );
  Mock.displayName = "SvgMock";

  return {
    __esModule: true,
    default: Mock,
    Svg: Mock,
    Defs: Mock,
    Mask: Mock,
    Rect: Mock,
    Path: Mock,
    Circle: Mock,
    G: Mock,
  };
});
