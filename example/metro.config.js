const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// `react-native-tour` is linked in via the npm `file:..` symlink, so Metro's
// watcher needs to see outside `example/` to pick up changes to it.
config.watchFolders = [workspaceRoot];

// The linked package has its own `node_modules` (with its own copies of
// react/react-native/reanimated/svg as devDependencies for local typechecking).
// Metro's default resolution walks up from the *requiring* file, so code
// inside `react-native-tour/lib/**` finds the package's own `node_modules`
// first — producing two live copies of native-singleton modules like React
// and Reanimated, and crashing with "Invalid hook call" / "[runtime not
// ready]: ReferenceError: Property '_toString' doesn't exist".
// `extraNodeModules` alone doesn't fix this — it's only consulted when normal
// resolution fails, and normal resolution here *succeeds* (just at the wrong,
// closer copy). Globally disabling hierarchical lookup instead breaks Expo's
// own nested deps (e.g. "expo-asset" lives under node_modules/expo/node_modules,
// not hoisted). So only these specific singleton module names get forced to
// the app's own copy; everything else still uses Metro's normal walk-up.
const singletonModules = new Set([
  "react",
  "react-native",
  "react-native-reanimated",
  "react-native-svg",
  "react-native-safe-area-context",
  "buffer",
]);
const appNodeModules = path.resolve(projectRoot, "node_modules");

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "buffer") {
    // "buffer" is also a Node core module name, so a bare
    // `require.resolve("buffer", { paths })` short-circuits to Node's
    // builtin regardless of `paths`. Resolve the package directory itself
    // (an explicit path, not a bare specifier) to force the real npm package.
    return {
      type: "sourceFile",
      filePath: require.resolve(path.join(appNodeModules, "buffer")),
    };
  }
  if (singletonModules.has(moduleName)) {
    return {
      type: "sourceFile",
      filePath: require.resolve(moduleName, { paths: [appNodeModules] }),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
