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
    Easing: { out: identity, ease: noop },
    cancelAnimation: noop,
    useAnimatedProps: () => ({}),
    useAnimatedStyle: () => ({}),
    useSharedValue: (init) => ({ value: init }),
    withRepeat: identity,
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
  };
});
