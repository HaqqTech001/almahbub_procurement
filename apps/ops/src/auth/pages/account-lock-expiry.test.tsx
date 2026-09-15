import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AccountLockedPage } from "./StatusPages.js";
const state = vi.hoisted(() => ({ lockUntil: 0 }));
vi.mock("../session/AuthProvider.js", () => ({ useAuth: () => state }));
vi.mock("@hamd/ui/auth", () => ({ AccountLockedScreen: ({ remainingSeconds }: { remainingSeconds: number }) => <p>Cooldown {remainingSeconds}</p> }));
afterEach(() => { cleanup(); vi.useRealTimers(); });
function page() { render(<MemoryRouter initialEntries={["/account-locked"]}><Routes><Route path="/account-locked" element={<AccountLockedPage />} /><Route path="/login" element={<p>Sign in again</p>} /></Routes></MemoryRouter>); }
it("automatically returns to sign in when the cooldown expires", () => {
 vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-15T10:00:00Z")); state.lockUntil = Date.now() + 2000;
 page(); expect(screen.getByText("Cooldown 2")).toBeTruthy();
 act(() => { vi.advanceTimersByTime(2000); }); expect(screen.getByText("Sign in again")).toBeTruthy();
});
it("recovers immediately when reloaded after expiry", () => {
 state.lockUntil = Date.now() - 1; page(); expect(screen.getByText("Sign in again")).toBeTruthy();
});
