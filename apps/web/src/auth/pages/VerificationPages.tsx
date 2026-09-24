import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { safeInternalPath } from "@hamd/ui/auth";
import {
  EmailVerificationScreen,
  OtpVerificationScreen,
  ResendVerificationScreen,
} from "@hamd/ui/auth";
import { formatAuthError } from "../api/auth-errors.js";
import {
  resendOtpRequest,
  verifyEmailRequest,
  verifyOtpRequest,
} from "../api/auth-client.js";
import { peekPendingGoogleCredential } from "../google/pending-credential.js";
import { useAuth } from "../session/AuthProvider.js";

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
  const googleLink = params.get("googleLink") === "1";
  const returnTo = safeInternalPath(params.get("returnTo"), "/app");
  const navigate = useNavigate();
  const auth = useAuth();

  return (
    <OtpVerificationScreen
      {...(email ? { emailHint: email } : {})}
      {...(googleLink
        ? {
            description:
              "An Almahbub account already uses this email. Verify your account to connect Google and continue.",
          }
        : {})}
      onSubmit={async (code) => {
        try {
          if (googleLink) {
            const credential = peekPendingGoogleCredential();
            if (credential && email) {
              await auth.loginWithGoogle(credential, { code, email });
              navigate(returnTo, { replace: true });
              return;
            }
          }
          await verifyOtpRequest({
            code,
            ...(email ? { email } : {}),
          });
        } catch (err) {
          throw new Error(formatAuthError(err, "Invalid or expired code."));
        }
        navigate(
          email
            ? `/login?verified=1&email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(returnTo)}`
            : `/login?verified=1&returnTo=${encodeURIComponent(returnTo)}`,
          { replace: true },
        );
      }}
      {...(email
        ? {
            onResend: async () => {
              try {
                await resendOtpRequest(email);
              } catch (err) {
                throw new Error(formatAuthError(err, "Unable to resend code."));
              }
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
