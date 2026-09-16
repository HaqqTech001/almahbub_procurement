import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it } from "vitest";
import { AboutPage } from "./AboutPage.js";

afterEach(cleanup);
it("presents both operations, informational flows and existing enquiry routes", () => {
  render(<MemoryRouter><AboutPage /></MemoryRouter>);
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Commerce built around real business needs.");
  expect(screen.getAllByRole("article")).toHaveLength(2);
  for (const name of ["Almahbub International", "Almahbub Integrated Export"]) {
    const process = screen.getByRole("list", { name: `${name} process` });
    expect(within(process).getAllByRole("listitem")).toHaveLength(6);
    expect(within(process).queryByRole("button")).toBeNull();
  }
  expect(screen.getByRole("link", { name: "Start Procurement" })).toHaveAttribute("href", "/app/requests/new");
  expect(screen.getByRole("link", { name: "Request Export Quote" })).toHaveAttribute("href", "/businesses/almahbub-integrated-export/request");
  expect(document.title).toContain("About Almahbub");
  expect(document.querySelector('meta[property="og:site_name"]')).toHaveAttribute("content", "Almahbub");
  expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toMatch(/\/about$/);
  expect(document.body.textContent).not.toContain("\u2014");
});
it("replaces failed operation images with accessible designed placeholders", () => {
  render(<MemoryRouter><AboutPage /></MemoryRouter>);
  for (const image of screen.getAllByRole("img")) fireEvent.error(image);
  expect(document.querySelectorAll("img")).toHaveLength(0);
  expect(screen.getAllByRole("img")).toHaveLength(2);
  for (const placeholder of screen.getAllByRole("img")) expect(placeholder).toHaveAccessibleName(/image unavailable/);
});
