import type { Meta, StoryObj } from "@storybook/react";
import { ProductDetailPage } from "../src/product-detail/ProductDetailPage";
import { productDetailFixture } from "../src/product-detail/fixtures";
import "../src/styles/product-detail.css";
import "../src/styles/catalog.css";

const meta: Meta<typeof ProductDetailPage> = {
  title: "Catalog/ProductDetailPage",
  component: ProductDetailPage,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof ProductDetailPage>;

export const Default: Story = {
  args: {
    product: productDetailFixture,
  },
};

export const Loading: Story = {
  args: {
    product: productDetailFixture,
    loading: true,
  },
};

export const BookmarkedComparing: Story = {
  args: {
    product: productDetailFixture,
    bookmarked: true,
    comparing: true,
  },
};
