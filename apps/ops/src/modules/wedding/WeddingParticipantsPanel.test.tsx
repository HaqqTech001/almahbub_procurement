import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WeddingParticipantsPanel } from "./WeddingParticipantsPanel.js";
import { opsFetch } from "../../lib/ops-fetch.js";
const ensureSession = vi.hoisted(() => vi.fn().mockResolvedValue("token"));
vi.mock("../../auth/session/auth-context.js", () => ({ useAuth: () => ({ ensureSession }) }));
vi.mock("../../lib/ops-fetch.js", async (original) => ({
  ...await original<object>(),
  requireOpsToken: vi.fn().mockResolvedValue("token"),
  opsFetch: vi.fn().mockResolvedValue({ total: 1, enabled: 1, active: 1, items: [
    { id: "1", displayName: "Wedding guest", enabled: true, active: true, since: "2026-09-10T10:00:00Z" },
  ] }),
}));
describe("WeddingParticipantsPanel", () => {
  it("shows waiting counts, safe names, status and join time", async () => {
    render(<WeddingParticipantsPanel kind="waiting" />);
    expect(await screen.findByText("Wedding guest")).toBeInTheDocument();
    expect(screen.getByText(/1 joined/)).toHaveTextContent("1 currently active");
    expect(screen.getByRole("columnheader", { name: "Joined at" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });
  it("labels subscription records independently of attendance", async () => {
    render(<WeddingParticipantsPanel kind="subscription" />);
    expect(await screen.findByText("Subscribed")).toBeInTheDocument();
    expect(screen.queryByText(/currently active/)).toBeNull();
  });
});

afterEach(() => { cleanup(); vi.useRealTimers(); });
describe("Participant request recovery", () => {
 beforeEach(() => { vi.mocked(opsFetch).mockReset(); });
 it("shows empty subscriptions separately from errors", async () => {
  vi.mocked(opsFetch).mockResolvedValue({ total: 0, enabled: 0, active: 0, items: [] });
  render(<WeddingParticipantsPanel kind="subscription" />);
  expect(await screen.findByText("No wedding update subscribers yet.")).toBeInTheDocument();
 });
 it("stops after two backed-off retries and supports manual recovery", async () => {
  vi.useFakeTimers(); vi.mocked(opsFetch).mockRejectedValue(new Error("500"));
  await act(async () => { render(<WeddingParticipantsPanel kind="waiting" />); });
  expect(screen.getByText("Unable to load waiting-room participants.")).toBeInTheDocument();
  expect(screen.queryByText("No waiting-room participants yet.")).toBeNull();
  await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
  await act(async () => { await vi.advanceTimersByTimeAsync(60000); });
  await act(async () => { await vi.advanceTimersByTimeAsync(600000); });
  expect(opsFetch).toHaveBeenCalledTimes(3);
  vi.mocked(opsFetch).mockResolvedValue({ total: 0, enabled: 0, active: 0, items: [] });
  await act(async () => { fireEvent.click(screen.getByRole("button", {name:"Retry"})); });
  expect(screen.getByText("No waiting-room participants yet.")).toBeInTheDocument();
  expect(opsFetch).toHaveBeenCalledTimes(4);
 });
});
