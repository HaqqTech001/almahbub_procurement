import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getGoogleIdentity,
  initializeGoogleIdentity,
  loadGoogleIdentityScript,
  resetGoogleIdentityLoaderForTests,
} from "./gis.js";
import {
  clearPendingGoogleCredential,
  peekPendingGoogleCredential,
  setPendingGoogleCredential,
  takePendingGoogleCredential,
} from "./pending-credential.js";

describe("pending Google credential", () => {
  afterEach(() => {
    clearPendingGoogleCredential();
  });

  it("stays in memory and is not written to storage", () => {
    setPendingGoogleCredential("aaa.bbb.ccc");
    expect(peekPendingGoogleCredential()).toBe("aaa.bbb.ccc");
    expect(window.localStorage.getItem("aaa.bbb.ccc")).toBeNull();
    expect(takePendingGoogleCredential()).toBe("aaa.bbb.ccc");
    expect(peekPendingGoogleCredential()).toBeNull();
  });
});

describe("GIS loader", () => {
  afterEach(() => {
    resetGoogleIdentityLoaderForTests();
    delete window.google;
  });

  it("resolves immediately when GIS is already present", async () => {
    const api = {
      initialize: () => undefined,
      renderButton: () => undefined,
    };
    window.google = { accounts: { id: api } };
    await expect(loadGoogleIdentityScript()).resolves.toBe(api);
    expect(getGoogleIdentity()).toBe(api);
  });

  it("initializes GIS once in popup mode for the same client ID", () => {
    const initialize = vi.fn();
    const api = {
      initialize,
      renderButton: () => undefined,
    };
    const first = vi.fn();
    const second = vi.fn();
    initializeGoogleIdentity(api, "client.apps.googleusercontent.com", first);
    initializeGoogleIdentity(api, "client.apps.googleusercontent.com", second);
    expect(initialize).toHaveBeenCalledTimes(1);
    expect(initialize.mock.calls[0]?.[0]).toMatchObject({
      client_id: "client.apps.googleusercontent.com",
      ux_mode: "popup",
      use_fedcm_for_prompt: false,
    });
    initialize.mock.calls[0]?.[0].callback({ credential: "token.jwt" });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith("token.jwt");
  });
});
