import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "coverage",
      "vendor",
      "test-results",
      "playwright-report",
      "public/mockServiceWorker.js",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { "react-hooks": reactHooks, "jsx-a11y": jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      // Architecture boundary: a feature's public API is its index.ts.
      // Reaching into another feature's internals is a lint error.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*/*"],
              message:
                "Import from the feature's public API (@/features/<name>), not its internals.",
            },
          ],
        },
      ],
    },
  },
  {
    // Features may not depend on the app shell.
    files: ["src/features/**", "src/shared/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/features/*/*"], message: "Import from the feature's public API." },
            {
              group: ["@/app/*", "@/app"],
              message: "Features and shared code must not import from the app shell.",
            },
          ],
        },
      ],
    },
  },
  {
    // Inside a feature, relative imports of its own files are fine.
    files: ["src/features/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/*", "@/app"],
              message: "Features must not import from the app shell.",
            },
          ],
        },
      ],
    },
  },
);
