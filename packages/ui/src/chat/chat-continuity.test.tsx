import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChatRoom } from "./useChatRoom.js";
import { chatRoomsFixture } from "./fixtures.js";
import type { ChatMessage } from "./types.js";
const noMessages: ChatMessage[] = [];
beforeEach(() => sessionStorage.clear());
describe("chat continuity", () => {
  it("preserves text/files on failure, prevents double send and allows a deliberate retry", async () => {
    let reject!: (error: Error) => void;
    const onSend = vi.fn(() => new Promise<void>((_resolve, fail) => { reject = fail; }));
    const { result } = renderHook(() => useChatRoom(chatRoomsFixture, noMessages, { currentUserId: "buyer", onSend }));
    act(() => result.current.onComposerChange("Please review this quote"));
    let first!: Promise<void>;
    act(() => { first = result.current.send(); });
    await act(async () => { await result.current.send(); });
    expect(onSend).toHaveBeenCalledOnce();
    await act(async () => { reject(new Error("network")); await first; });
    expect(result.current.draft.body).toBe("Please review this quote");
    onSend.mockResolvedValueOnce();
    await act(async () => { await result.current.send(); });
    expect(onSend).toHaveBeenCalledTimes(2);
    expect(result.current.draft.body).toBe("");
  });
  it("restores only that user's conversation draft after remount", () => {
    const first = renderHook(() => useChatRoom(chatRoomsFixture, noMessages, { currentUserId: "buyer" }));
    act(() => first.result.current.onComposerChange("Unsent draft")); first.unmount();
    const second = renderHook(() => useChatRoom(chatRoomsFixture, noMessages, { currentUserId: "buyer" }));
    expect(second.result.current.draft.body).toBe("Unsent draft"); second.unmount();
    const third = renderHook(() => useChatRoom(chatRoomsFixture, noMessages, { currentUserId: "other" }));
    expect(third.result.current.draft.body).toBe("");
  });
});
