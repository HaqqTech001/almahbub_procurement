import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
  EmailVerificationScreen,
  OtpVerificationScreen,
  ResendVerificationScreen,
} from "@hamd/ui/auth";
import {
  resendOtpRequest,
  verifyEmailRequest,
  verifyOtpRequest,
} from "../api/auth-client.js";

export function EmailVerificationPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  if (!token) {
    return (
      <ResendVerificationScreen
        onSubmit={async (value) => {
          await resendOtpRequest(value);
        }}
      />
    );
  }

  return (
    <EmailVerificationScreen
      token={token}
      onVerify={async (value) => {
        await verifyEmailRequest(value);
      }}
      loginHref="/login"
      resendHref="/verify-email"
    />
  );
}

export function OtpVerificationPage() {
  const [params] = useSearchParams();
  const email = params.get("email") ?? undefined;
  const navigate = useNavigate();

  return (
    <OtpVerificationScreen
      {...(email ? { emailHint: email } : {})}
      onSubmit={async (code) => {
        await verifyOtpRequest({
          code,
          ...(email ? { email } : {}),
        });
        navigate(
          email
            ? `/login?verified=1&email=${encodeURIComponent(email)}`
            : "/login?verified=1",
          { replace: true },
        );
      }}
      {...(email
        ? {
            onResend: async () => {
              await resendOtpRequest(email);
            },
          }
        : {})}
    />
  );
}

/** Convenience redirect used by register success path. */
export function VerifyEmailEntryPage() {
  const [params] = useSearchParams();
  const email = params.get("email");
  if (email) {
    return <Navigate to={`/otp?email=${encodeURIComponent(email)}`} replace />;
  }
  return <EmailVerificationPage />;
}
