import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginScreen } from "./screens/LoginScreen.js";
import { RegisterScreen } from "./screens/RegisterScreen.js";
import { AuthOtpInput } from "./AuthOtpInput.js";
import { scorePassword, AuthPasswordField } from "./AuthFields.js";
import { isValidEmail, isStrongEnough, safeInternalPath } from "./validation.js";
import {
  SessionExpiredScreen,
  UnauthorizedScreen,
  ForbiddenScreen,
  AccountLockedScreen,
  MfaPlaceholderScreen,
  InvitationAcceptanceScreen,
} from "./screens/StatusScreens.js";
import {
  ForgotPasswordScreen,
  PasswordChangedScreen,
  EmailVerificationScreen,
  ResetPasswordScreen,
} from "./screens/PasswordScreens.js";
import {
  OtpVerificationScreen,
  ResendVerificationScreen,
} from "./screens/OtpAndResendScreens.js";
import { AuthShellSkeleton } from "./AuthShell.js";

function main() {
  return screen.getByRole("main");
}

describe("auth validation", () => {
  it("validates email and password strength", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("bad")).toBe(false);
    expect(isStrongEnough("Short1")).toBe(false);
    expect(isStrongEnough("LongerPass1")).toBe(true);
    expect(scorePassword("a").score).toBeLessThan(2);
    expect(scorePassword("Abcdefgh1!").score).toBeGreaterThanOrEqual(3);
    expect(safeInternalPath("//evil.example", "/app")).toBe("/app");
    expect(safeInternalPath("/app/requests", "/app")).toBe("/app/requests");
    expect(safeInternalPath("/rowdotul-hamd-26/live?mode=test", "/app")).toBe(
      "/rowdotul-hamd-26/live?mode=test",
    );
    expect(safeInternalPath("https://evil.example", "/app")).toBe("/app");
  });
});

describe("LoginScreen", () => {
  it("validates and submits credentials", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<LoginScreen onSubmit={onSubmit} />);

    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /skip to main content/i })).toHaveAttribute(
      "href",
      "#main-content",
    );

    await user.click(within(main()).getByRole("button", { name: "Sign in" }));
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(within(main()).getByRole("textbox", { name: "Email" }), "ops@almahbub.com");
    await user.type(within(main()).getByLabelText("Password", { selector: "input" }), "SecretPass1");
    await user.click(within(main()).getByLabelText("Remember me"));
    await user.click(within(main()).getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        email: "ops@almahbub.com",
        password: "SecretPass1",
        rememberMe: true,
      }),
    );
  });

  it("renders an official Google slot without restyling the host control", async () => {
    render(
      <LoginScreen
        onSubmit={vi.fn()}
        googleSlot={<button type="button">Sign in with Google</button>}
      />,
    );
    expect(screen.getByRole("separator", { name: /or/i })).toBeInTheDocument();
    const google = screen.getByRole("button", { name: "Sign in with Google" });
    expect(google).toBeInTheDocument();
    expect(google.className).not.toMatch(/hamd-auth-google/);
  });
});

describe("RegisterScreen", () => {
  it("shows Sign up with Google on step one", () => {
    render(
      <RegisterScreen
        onSubmit={vi.fn()}
        googleSlot={<button type="button">Sign up with Google</button>}
      />,
    );
    expect(screen.getByRole("separator", { name: /or/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign up with Google" })).toBeInTheDocument();
  });

  it("walks multi-step registration without dropping field model", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<RegisterScreen onSubmit={onSubmit} />);
    const root = main();

    await user.type(within(root).getByRole("textbox", { name: "First name" }), "Ada");
    await user.type(within(root).getByRole("textbox", { name: "Last name" }), "Okoro");
    await user.type(within(root).getByRole("textbox", { name: "Email" }), "ada@example.com");
    await user.type(within(root).getByRole("textbox", { name: /phone/i }), "+2348000000000");
    await user.click(within(root).getByRole("button", { name: /continue/i }));

    await user.type(within(main()).getByRole("textbox", { name: "Company name" }), "Okoro Imports");
    await user.selectOptions(within(main()).getByLabelText(/company type/i), "Importer");
    await user.type(within(main()).getByRole("textbox", { name: /address/i }), "12 Marina");
    await user.type(within(main()).getByRole("textbox", { name: /city/i }), "Lagos");
    await user.type(within(main()).getByRole("textbox", { name: /state/i }), "LA");
    await user.type(within(main()).getByRole("textbox", { name: /country/i }), "Nigeria");
    await user.click(within(main()).getByRole("button", { name: /continue/i }));

    await user.type(
      within(main()).getByLabelText("Password", { selector: "input" }),
      "SecurePass1",
    );
    await user.type(
      within(main()).getByLabelText("Confirm password", { selector: "input" }),
      "SecurePass1",
    );
    await user.click(within(main()).getByLabelText(/I agree to the terms/i));
    await user.click(within(main()).getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      firstName: "Ada",
      companyName: "Okoro Imports",
      companyType: "Importer",
      agreeToTerms: true,
    });
  });

  it("allows skipping optional contact and address fields", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<RegisterScreen onSubmit={onSubmit} />);
    const root = main();

    await user.type(within(root).getByRole("textbox", { name: "First name" }), "Ada");
    await user.type(within(root).getByRole("textbox", { name: "Last name" }), "Okoro");
    await user.type(within(root).getByRole("textbox", { name: "Email" }), "ada@example.com");
    await user.click(within(root).getByRole("button", { name: /continue/i }));

    await user.type(within(main()).getByRole("textbox", { name: "Company name" }), "Okoro Imports");
    await user.click(within(main()).getByRole("button", { name: /continue/i }));

    await user.type(
      within(main()).getByLabelText("Password", { selector: "input" }),
      "SecurePass1",
    );
    await user.type(
      within(main()).getByLabelText("Confirm password", { selector: "input" }),
      "SecurePass1",
    );
    await user.click(within(main()).getByLabelText(/I agree to the terms/i));
    await user.click(within(main()).getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      email: "ada@example.com",
      phone: "",
      companyName: "Okoro Imports",
      agreeToTerms: true,
    });
  });
});

describe("AuthOtpInput", () => {
  it("accepts paste and advances digits", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <AuthOtpInput value="" onChange={onChange} length={6} />,
    );

    const first = screen.getByLabelText("Digit 1 of 6");
    await user.click(first);
    await user.paste("123456");

    expect(onChange).toHaveBeenCalledWith("123456");

    rerender(<AuthOtpInput value="12" onChange={onChange} length={6} />);
    await user.type(screen.getByLabelText("Digit 3 of 6"), "3");
    expect(onChange).toHaveBeenCalled();
  });
});

describe("AuthPasswordField", () => {
  it("toggles visibility and reports strength", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AuthPasswordField
        label="Password"
        value="Abcdefgh1!"
        onChange={onChange}
        showStrength
      />,
    );
    const input = screen.getByLabelText("Password", { selector: "input" });
    expect(input).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByText(/excellent|strong/i)).toBeInTheDocument();
  });
});

describe("status and recovery screens", () => {
  it("renders enterprise status screens", () => {
    const { unmount } = render(<SessionExpiredScreen />);
    expect(screen.getByRole("heading", { name: /session expired/i })).toBeInTheDocument();
    unmount();

    const u2 = render(<UnauthorizedScreen />);
    expect(screen.getByRole("heading", { name: /unauthorized/i })).toBeInTheDocument();
    u2.unmount();

    const u3 = render(<ForbiddenScreen />);
    expect(screen.getByRole("heading", { name: /forbidden/i })).toBeInTheDocument();
    u3.unmount();

    const u4 = render(<AccountLockedScreen unlockAt="15:00 UTC" />);
    expect(within(main()).getByText(/15:00 UTC/)).toBeInTheDocument();
    u4.unmount();

    const u5 = render(<MfaPlaceholderScreen />);
    expect(within(main()).getByText(/Coming soon/i)).toBeInTheDocument();
    u5.unmount();

    const u6 = render(<PasswordChangedScreen />);
    expect(screen.getByRole("heading", { name: /password changed/i })).toBeInTheDocument();
    u6.unmount();

    render(<AuthShellSkeleton />);
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });

  it("submits forgot password and invitation flows", async () => {
    const user = userEvent.setup();
    const onForgot = vi.fn().mockResolvedValue(undefined);
    const { unmount } = render(<ForgotPasswordScreen onSubmit={onForgot} />);
    await user.type(within(main()).getByRole("textbox", { name: "Email" }), "ops@almahbub.com");
    await user.click(within(main()).getByRole("button", { name: /send reset link/i }));
    await waitFor(() => expect(onForgot).toHaveBeenCalledWith("ops@almahbub.com"));
    unmount();

    const onReset = vi.fn().mockResolvedValue(undefined);
    const reset = render(<ResetPasswordScreen onSubmit={onReset} />);
    await user.type(
      within(main()).getByLabelText("New password", { selector: "input" }),
      "weak",
    );
    await user.type(
      within(main()).getByLabelText("Confirm password", { selector: "input" }),
      "weak",
    );
    await user.click(within(main()).getByRole("button", { name: /update password/i }));
    expect(onReset).not.toHaveBeenCalled();
    await user.clear(within(main()).getByLabelText("New password", { selector: "input" }));
    await user.clear(within(main()).getByLabelText("Confirm password", { selector: "input" }));
    await user.type(
      within(main()).getByLabelText("New password", { selector: "input" }),
      "SecurePass1",
    );
    await user.type(
      within(main()).getByLabelText("Confirm password", { selector: "input" }),
      "SecurePass1",
    );
    await user.click(within(main()).getByRole("button", { name: /update password/i }));
    await waitFor(() => expect(onReset).toHaveBeenCalledWith("SecurePass1"));
    reset.unmount();

    const onAccept = vi.fn().mockResolvedValue(undefined);
    render(
      <InvitationAcceptanceScreen
        organizationName="Almahbub Ops"
        email="invitee@example.com"
        onAccept={onAccept}
      />,
    );
    await user.type(within(main()).getByRole("textbox", { name: "First name" }), "Ife");
    await user.type(
      within(main()).getByLabelText("Create password", { selector: "input" }),
      "InvitePass1",
    );
    await user.click(within(main()).getByRole("button", { name: /accept invitation/i }));
    await waitFor(() => expect(onAccept).toHaveBeenCalled());
  });

  it("handles OTP submit and email verification states", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { unmount } = render(
      <OtpVerificationScreen onSubmit={onSubmit} resendCooldownSeconds={0} />,
    );

    const first = within(main()).getByLabelText("Digit 1 of 6");
    await user.click(first);
    await user.paste("123456");
    await user.click(within(main()).getByRole("button", { name: /verify code/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("123456"));
    unmount();

    const onResend = vi.fn().mockResolvedValue(undefined);
    const r = render(
      <ResendVerificationScreen onSubmit={onResend} cooldownSeconds={0} />,
    );
    await user.type(within(main()).getByRole("textbox", { name: "Email" }), "ops@almahbub.com");
    await user.click(within(main()).getByRole("button", { name: /resend email/i }));
    await waitFor(() => expect(onResend).toHaveBeenCalled());
    r.unmount();

    render(<EmailVerificationScreen status="success" />);
    expect(within(main()).getByText(/email verified/i)).toBeInTheDocument();
  });
});

describe("accessibility contracts", () => {
  it("wires invalid fields with aria-invalid and alert errors", async () => {
    const user = userEvent.setup();
    render(<LoginScreen onSubmit={vi.fn()} />);
    await user.click(within(main()).getByRole("button", { name: "Sign in" }));
    const email = within(main()).getByRole("textbox", { name: "Email" });
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
  });
});

describe("responsive shell contract", () => {
  it("exposes main landmark and brand for all viewports", () => {
    render(<LoginScreen onSubmit={vi.fn()} />);
    expect(document.getElementById("main-content")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Almahbub International" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Almahbub")).toBeInTheDocument();
    expect(screen.getByText("International")).toBeInTheDocument();
  });
});
