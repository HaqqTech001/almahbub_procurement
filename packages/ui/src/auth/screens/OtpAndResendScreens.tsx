import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AuthShell } from "../AuthShell.js";
import {
  AuthAlert,
  AuthFloatingField,
  AuthSubmitButton,
} from "../AuthFields.js";
import { AuthOtpInput } from "../AuthOtpInput.js";
import { isValidEmail } from "../validation.js";

export type OtpVerificationScreenProps = {
  length?: number;
  onSubmit: (code: string) => void | Promise<void>;
  onResend?: () => void | Promise<void>;
  resendCooldownSeconds?: number;
  emailHint?: string;
  description?: string;
  loginHref?: string;
  loading?: boolean | undefined;
};

export function OtpVerificationScreen({
  length = 6,
  onSubmit,
  onResend,
  resendCooldownSeconds = 60,
  emailHint,
  description,
  loginHref = "/login",
  loading,
}: OtpVerificationScreenProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(resendCooldownSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [secondsLeft]);

  const handleResend = useCallback(async () => {
    if (!onResend || secondsLeft > 0) return;
    try {
      await onResend();
      setSecondsLeft(resendCooldownSeconds);
      setFormError(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to resend code.");
    }
  }, [onResend, resendCooldownSeconds, secondsLeft]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (code.length !== length) {
      setError(`Enter the ${length}-digit code.`);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await onSubmit(code);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Invalid code.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      variant="otp"
      title="Enter verification code"
      description={
        description ??
        (emailHint
          ? `We sent a code to ${emailHint}.`
          : "Enter the one-time code from your email or authenticator.")
      }
      documentTitle="OTP verification · Almahbub International"
      loading={loading}
      footer={
        <p>
          <a href={loginHref} className="hamd-auth-link">
            Back to sign in
          </a>
        </p>
      }
    >
      <form className="hamd-auth-form" onSubmit={handleSubmit} noValidate>
        {formError ? (
          <AuthAlert tone="error" title="Verification failed">
            {formError}
          </AuthAlert>
        ) : null}
        <AuthOtpInput
          length={length}
          value={code}
          onChange={(v) => {
            setCode(v);
            if (error && v.length === length) setError(undefined);
          }}
          error={error}
          disabled={Boolean(submitting || loading)}
          autoFocus
        />
        <AuthSubmitButton loading={submitting}>Verify code</AuthSubmitButton>
        <div className="hamd-auth-resend">
          {secondsLeft > 0 ? (
            <p role="status" aria-live="polite">
              Resend available in {secondsLeft}s
            </p>
          ) : (
            <button
              type="button"
              className="hamd-auth-link hamd-auth-link--button"
              onClick={handleResend}
              disabled={!onResend}
            >
              Resend code
            </button>
          )}
        </div>
      </form>
    </AuthShell>
  );
}

export type ResendVerificationScreenProps = {
  onSubmit: (email: string) => void | Promise<void>;
  cooldownSeconds?: number;
  loginHref?: string;
  loading?: boolean | undefined;
};

export function ResendVerificationScreen({
  onSubmit,
  cooldownSeconds = 60,
  loginHref = "/login",
  loading,
}: ResendVerificationScreenProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [secondsLeft]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (secondsLeft > 0) return;
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await onSubmit(email.trim());
      setSuccess(true);
      setSecondsLeft(cooldownSeconds);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to resend.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      variant="resend"
      title="Resend verification"
      description="Request another verification email after the cooldown."
      documentTitle="Resend verification · Almahbub International"
      loading={loading}
      footer={
        <p>
          <a href={loginHref} className="hamd-auth-link">
            Back to sign in
          </a>
        </p>
      }
    >
      <form className="hamd-auth-form" onSubmit={handleSubmit} noValidate>
        {success ? (
          <AuthAlert tone="success" title="Email queued">
            If an unverified account exists, another message is on the way.
          </AuthAlert>
        ) : null}
        {formError ? (
          <AuthAlert tone="error" title="Request failed">
            {formError}
          </AuthAlert>
        ) : null}
        <AuthFloatingField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          error={error}
          autoFocus
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthSubmitButton loading={submitting} disabled={secondsLeft > 0}>
          {secondsLeft > 0 ? `Wait ${secondsLeft}s` : "Resend email"}
        </AuthSubmitButton>
      </form>
    </AuthShell>
  );
}
