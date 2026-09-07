import type { Meta, StoryObj } from "@storybook/react";
import { LoginScreen } from "../src/auth/screens/LoginScreen";
import { RegisterScreen } from "../src/auth/screens/RegisterScreen";
import {
  EmailVerificationScreen,
  ForgotPasswordScreen,
  PasswordChangedScreen,
  ResetPasswordScreen,
} from "../src/auth/screens/PasswordScreens";
import {
  OtpVerificationScreen,
  ResendVerificationScreen,
} from "../src/auth/screens/OtpAndResendScreens";
import {
  AccountLockedScreen,
  ForbiddenScreen,
  InvitationAcceptanceScreen,
  MfaPlaceholderScreen,
  SessionExpiredScreen,
  UnauthorizedScreen,
} from "../src/auth/screens/StatusScreens";
import { AuthShellSkeleton } from "../src/auth/AuthShell";
import "../src/styles/auth.css";

const meta: Meta = {
  title: "Auth/Screens",
  parameters: {
    layout: "fullscreen",
    a11y: { test: "todo" },
  },
};
export default meta;

type Story = StoryObj;

const asyncOk = async () => undefined;

export const Login: Story = {
  render: () => <LoginScreen onSubmit={asyncOk} />,
};

export const Register: Story = {
  render: () => <RegisterScreen onSubmit={asyncOk} />,
};

export const ForgotPassword: Story = {
  render: () => <ForgotPasswordScreen onSubmit={asyncOk} />,
};

export const ResetPassword: Story = {
  render: () => <ResetPasswordScreen onSubmit={asyncOk} />,
};

export const PasswordChanged: Story = {
  render: () => <PasswordChangedScreen />,
};

export const EmailVerification: Story = {
  render: () => <EmailVerificationScreen status="pending" />,
};

export const OtpVerification: Story = {
  render: () => (
    <OtpVerificationScreen
      onSubmit={asyncOk}
      onResend={asyncOk}
      emailHint="ops@almahbub.com"
    />
  ),
};

export const ResendVerification: Story = {
  render: () => <ResendVerificationScreen onSubmit={asyncOk} />,
};

export const SessionExpired: Story = {
  render: () => <SessionExpiredScreen />,
};

export const Unauthorized: Story = {
  render: () => <UnauthorizedScreen />,
};

export const Forbidden: Story = {
  render: () => <ForbiddenScreen />,
};

export const AccountLocked: Story = {
  render: () => <AccountLockedScreen />,
};

export const InvitationAcceptance: Story = {
  render: () => (
    <InvitationAcceptanceScreen
      organizationName="Almahbub International"
      inviterName="Ops Admin"
      email="invitee@example.com"
      onAccept={asyncOk}
      onDecline={asyncOk}
    />
  ),
};

export const MfaPlaceholder: Story = {
  render: () => <MfaPlaceholderScreen />,
};

export const LoadingSkeleton: Story = {
  render: () => <AuthShellSkeleton />,
};
