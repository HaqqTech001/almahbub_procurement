import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { AuthShell } from "../AuthShell.js";
import {
  AuthAlert,
  AuthCheckbox,
  AuthFloatingField,
  AuthPasswordField,
  AuthSubmitButton,
} from "../AuthFields.js";
import { isValidEmail } from "../validation.js";

export type LoginFormValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type LoginScreenProps = {
  onSubmit: (values: LoginFormValues) => void | Promise<void>;
  registerHref?: string | null;
  forgotHref?: string;
  initialEmail?: string;
  loading?: boolean | undefined;
  errorMessage?: string | null;
  successMessage?: string | null;
  brandLabel?: string;
  description?: string;
  documentTitle?: string;
  /** Official GIS button slot. Prefer this over the legacy redirect link. */
  googleSlot?: ReactNode;
  /** Legacy OAuth start URL (ops redirect). Ignored when googleSlot is set. */
  googleSignInHref?: string | null;
  googleLoading?: boolean;
  requestCooldownMessage?: string | null;
};

export function LoginScreen({
  onSubmit,
  registerHref = "/register",
  forgotHref = "/forgot-password",
  initialEmail = "",
  loading: shellLoading,
  errorMessage = null,
  successMessage = null,
  brandLabel,
  description = "Access your Almahbub International workspace.",
  documentTitle = "Sign in · Almahbub International",
  googleSlot = null,
  googleSignInHref = null,
  googleLoading = false,
  requestCooldownMessage = null,
}: LoginScreenProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(errorMessage);

  useEffect(() => {
    setFormError(errorMessage);
  }, [errorMessage]);

  const validate = () => {
    const next: typeof errors = {};
    if (!isValidEmail(email)) next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting || requestCooldownMessage) return;
    if (!validate()) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await onSubmit({ email: email.trim(), password, rememberMe });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      variant="login"
      title="Sign in"
      description={description}
      documentTitle={documentTitle}
      {...(brandLabel ? { brandLabel } : {})}
      loading={shellLoading}
      footer={
        registerHref ? (
          <p>
            New here?{" "}
            <a href={registerHref} className="hamd-auth-link">
              Create an account
            </a>
          </p>
        ) : (
          <p>Internal Almahbub staff only. Buyer accounts use the public website.</p>
        )
      }
    >
      <form className="hamd-auth-form" onSubmit={handleSubmit} noValidate>
        {requestCooldownMessage ? <AuthAlert tone="info" title="Please wait">{requestCooldownMessage}</AuthAlert> : null}
        {successMessage ? (
          <AuthAlert tone="success" title="Ready">
            {successMessage}
          </AuthAlert>
        ) : null}
        {formError ? (
          <AuthAlert tone="error" title="Sign-in failed">
            {formError}
          </AuthAlert>
        ) : null}
        <AuthFloatingField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          error={errors.email}
          autoFocus
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email && isValidEmail(e.target.value)) {
              setErrors((prev) => {
                const next = { ...prev };
                delete next.email;
                return next;
              });
            }
          }}
          onBlur={() => {
            if (email && !isValidEmail(email)) {
              setErrors((prev) => ({
                ...prev,
                email: "Enter a valid email address.",
              }));
            }
          }}
        />
        <AuthPasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          value={password}
          error={errors.password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="hamd-auth-form__row">
          <AuthCheckbox label="Remember me" checked={rememberMe} onChange={setRememberMe} />
          <a href={forgotHref} className="hamd-auth-link">
            Forgot password?
          </a>
        </div>
        <AuthSubmitButton loading={submitting} disabled={Boolean(requestCooldownMessage)}>Sign in</AuthSubmitButton>
        {googleSlot || googleSignInHref ? (
          <>
            <div className="hamd-auth-divider" role="separator" aria-label="Or">
              <span>or</span>
            </div>
            {googleSlot ? (
              <div className="hamd-auth-google-slot">{googleSlot}</div>
            ) : googleSignInHref ? (
              <a
                className="hamd-auth-google"
                href={googleSignInHref}
                aria-busy={googleLoading || undefined}
                aria-disabled={googleLoading || undefined}
                onClick={(event) => {
                  if (googleLoading) event.preventDefault();
                }}
              >
                <GoogleGlyph />
                {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
              </a>
            ) : null}
          </>
        ) : null}
      </form>
    </AuthShell>
  );
}

function GoogleGlyph() {
  return (
    <svg
      className="hamd-auth-google__icon"
      width="18"
      height="18"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 16 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.9 26.8 37 24 37c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.5 5.5-6.5 6.9l.1.1 6.2 5.2C36.9 41.9 44 36 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
