import type { Preview } from "@storybook/react";
import "../src/styles/auth.css";

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: {
      test: "todo",
    },
    backgrounds: {
      default: "surface",
      values: [
        { name: "surface", value: "#ffffff" },
        { name: "dark", value: "#0b1220" },
      ],
    },
  },
};

export default preview;
