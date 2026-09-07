import { nodeConfig } from "@hamd/config-eslint";

export default [
  ...nodeConfig,
  {
    ignores: ["storybook-static/**", ".storybook/**"],
  },
];
