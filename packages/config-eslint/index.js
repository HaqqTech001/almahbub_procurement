import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

/**
 * Baseline policy for TypeScript packages. Applications may append narrowly
 * scoped overrides for generated files or framework-specific conventions.
 */
export const nodeConfig = tseslint.config(
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "separate-type-imports" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
);
