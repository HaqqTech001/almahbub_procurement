import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GoogleSignInButton } from "./GoogleSignInButton.js";

const renderButton = vi.fn();

vi.mock("../../app/providers/ThemeProvider.js", () => ({
  useOptionalTheme: () => ({ resolved: "light" }),
}));

vi.mock("../session/AuthProvider.js", () => ({
  useAuth: () => ({
    googleSignInReady: true,
    registerGoogleCredentialHandler: () => () => undefined,
  }),
}));

describe("GoogleSignInButton", () => {
  beforeEach(() => {
    renderButton.mockReset();
    window.google = {
      accounts: {
        id: {
          initialize: vi.fn(),
          renderButton: (parent, options) => {
            renderButton(parent, options);
            const button = document.createElement("button");
            button.type = "button";
            button.textContent =
              options.text === "signup_with"
                ? "Sign up with Google"
                : "Sign in with Google";
            parent.appendChild(button);
          },
        },
      },
    };
  });

  it("renders the official GIS standard button, not an icon tile", async () => {
    const { getByTestId } = render(
      <GoogleSignInButton text="signin_with" onCredential={vi.fn()} />,
    );
    await waitFor(() => {
      expect(renderButton).toHaveBeenCalled();
    });
    const [, options] = renderButton.mock.calls[0] as [
      HTMLElement,
      { type: string; shape: string; theme: string; size: string },
    ];
    expect(options.type).toBe("standard");
    expect(options.shape).toBe("rectangular");
    expect(options.theme).toBe("outline");
    expect(options.size).toBe("large");
    expect(options.type).not.toBe("icon");
    expect(options.shape).not.toBe("square");
    expect(getByTestId("google-sign-in").className).toBe("hamd-auth-gis");
    expect(getByTestId("google-sign-in").className).not.toMatch(/hamd-auth-google$/);
  });
});
