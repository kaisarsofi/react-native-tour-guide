module.exports = {
  root: true,
  extends: ["@react-native", "prettier"],
  plugins: ["react-hooks"],
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "no-console": "warn",
  },
  ignorePatterns: ["lib/", "example/", "node_modules/", "jest.setup.js"],
  overrides: [
    {
      files: ["**/__tests__/**/*.{ts,tsx}", "**/*.{test,spec}.{ts,tsx}"],
      env: { jest: true },
    },
  ],
};
