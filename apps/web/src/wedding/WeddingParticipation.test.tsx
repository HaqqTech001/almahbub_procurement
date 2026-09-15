import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WeddingParticipation } from "./WeddingParticipation.js";
import { fetchWeddingParticipation, changeWeddingSubscription, changeWeddingWaiting, heartbeatWeddingWaiting } from "./wedding-api.js";
const session = vi.hoisted(() => ({ status: "authenticated" }));
vi.mock("../auth/session/AuthProvider.js", () => ({ useAuth: () => session }));
vi.mock("./wedding-api.js", () => ({
  fetchWeddingParticipation: vi.fn(), changeWeddingSubscription: vi.fn(), changeWeddingWaiting: vi.fn(), heartbeatWeddingWaiting: vi.fn(),
}));
beforeEach(() => {
  session.status = "authenticated";
  vi.mocked(fetchWeddingParticipation).mockResolvedValue({ joined: false, subscribed: false });
  vi.mocked(heartbeatWeddingWaiting).mockResolvedValue({ joined: true, subscribed: false });
});
describe("wedding participation controls", () => {
  it("preserves the destination for a signed-out guest", () => {
    session.status = "anonymous";
    render(<MemoryRouter initialEntries={["/rowdotul-hamd-26?from=invite"]}><WeddingParticipation /></MemoryRouter>);
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/login?returnTo=%2Frowdotul-hamd-26%3Ffrom%3Dinvite");
  });
  it("subscribes and unsubscribes independently of joining", async () => {
    const user = userEvent.setup();
    vi.mocked(changeWeddingSubscription).mockResolvedValueOnce({ subscribed: true, joined: false }).mockResolvedValueOnce({ subscribed: false, joined: false });
    render(<MemoryRouter><WeddingParticipation /></MemoryRouter>);
    await user.click(await screen.findByRole("button", { name: "Subscribe for updates" }));
    expect(screen.getByText("You are subscribed to Rowdotul HAMD'26 updates.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Join waiting room" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Unsubscribe from updates" }));
    expect(changeWeddingSubscription).toHaveBeenLastCalledWith(false);
  });
  it("restores joined state after remount and persists leaving", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchWeddingParticipation).mockResolvedValue({ subscribed: false, joined: true });
    vi.mocked(changeWeddingWaiting).mockResolvedValue({ subscribed: false, joined: false });
    const first = render(<MemoryRouter><WeddingParticipation /></MemoryRouter>);
    expect(await screen.findByText("You joined the waiting room.")).toBeInTheDocument();
    first.unmount();
    render(<MemoryRouter><WeddingParticipation /></MemoryRouter>);
    await user.click(await screen.findByRole("button", { name: "Leave waiting room" }));
    await waitFor(() => expect(changeWeddingWaiting).toHaveBeenCalledWith(false));
    expect(await screen.findByRole("button", { name: "Join waiting room" })).toBeInTheDocument();
  });
});
