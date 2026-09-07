import { nodeConfig } from "@hamd/config-eslint";

export default [
  ...nodeConfig,
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**"],
  },
];
