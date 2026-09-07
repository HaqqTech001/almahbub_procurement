import { cx } from "../utils/cx.js";

export type AuthIllustrationVariant =
  | "login"
  | "register"
  | "verify"
  | "otp"
  | "forgot"
  | "reset"
  | "success"
  | "session"
  | "unauthorized"
  | "forbidden"
  | "locked"
  | "invite"
  | "mfa"
  | "resend";

const copy: Record<AuthIllustrationVariant, { title: string; body: string }> = {
  login: {
    title: "Accountable access",
    body: "Continue sourcing, quoting, and delivery on Almahbub International.",
  },
  register: {
    title: "Join the corridor",
    body: "Create a workspace from clarify through deliver.",
  },
  verify: {
    title: "Confirm your address",
    body: "Verification keeps accounts tied to real organizations.",
  },
  otp: {
    title: "One-time code",
    body: "Paste works, and digits advance automatically.",
  },
  forgot: {
    title: "Recover securely",
    body: "Reset links go only to the address on file.",
  },
  reset: {
    title: "Choose a strong password",
    body: "Protect quotes, invoices, and delivery records.",
  },
  success: {
    title: "Password updated",
    body: "Sign in again with your new credentials.",
  },
  session: {
    title: "Session ended",
    body: "Inactive sessions expire. Sign in to continue.",
  },
  unauthorized: {
    title: "Sign in required",
    body: "This area needs an authenticated session.",
  },
  forbidden: {
    title: "Access restricted",
    body: "Your role does not include this action.",
  },
  locked: {
    title: "Account locked",
    body: "Wait for the cooldown or contact support.",
  },
  invite: {
    title: "Accept invitation",
    body: "Join your organization with a secure invite.",
  },
  mfa: {
    title: "Multi-factor (coming)",
    body: "Placeholder only - no fake challenge.",
  },
  resend: {
    title: "Resend verification",
    body: "Request another link after the cooldown.",
  },
};

/** Professional SVG panel - replaces legacy AuthSlider collage. */
export function AuthIllustration({
  variant,
  className,
}: {
  variant: AuthIllustrationVariant;
  className?: string;
}) {
  const text = copy[variant];
  return (
    <aside
      className={cx("hamd-auth-illust", `hamd-auth-illust--${variant}`, className)}
      aria-hidden="true"
    >
      <div className="hamd-auth-illust__canvas">
        <svg viewBox="0 0 420 480" className="hamd-auth-illust__svg" role="presentation">
          <defs>
            <linearGradient id="hamd-auth-g1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0b3d6e" />
              <stop offset="55%" stopColor="#155aaf" />
              <stop offset="100%" stopColor="#3d8fd4" />
            </linearGradient>
            <linearGradient id="hamd-auth-g2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
            </linearGradient>
          </defs>
          <rect width="420" height="480" fill="url(#hamd-auth-g1)" />
          <path
            d="M0 320 C80 280 140 360 220 300 S360 240 420 280 L420 480 L0 480 Z"
            fill="url(#hamd-auth-g2)"
          />
          <g stroke="rgba(255,255,255,0.22)" fill="none" strokeWidth="1.5">
            <path d="M48 120 H180 V200 H48 Z" />
            <path d="M200 96 H372 V176 H200 Z" />
            <path d="M72 240 H348" />
            <circle cx="96" cy="240" r="8" fill="rgba(255,255,255,0.85)" stroke="none" />
            <circle cx="180" cy="240" r="8" fill="rgba(255,255,255,0.55)" stroke="none" />
            <circle cx="264" cy="240" r="8" fill="rgba(255,255,255,0.35)" stroke="none" />
            <path d="M96 240 L180 180 L264 210 L348 140" />
          </g>
          <rect
            x="56"
            y="300"
            width="308"
            height="120"
            rx="12"
            fill="rgba(15,23,42,0.28)"
            stroke="rgba(255,255,255,0.18)"
          />
          <text
            x="76"
            y="340"
            fill="#f8fafc"
            fontSize="18"
            fontFamily="Segoe UI, system-ui, sans-serif"
          >
            {text.title}
          </text>
          <text
            x="76"
            y="372"
            fill="rgba(248,250,252,0.82)"
            fontSize="13"
            fontFamily="Segoe UI, system-ui, sans-serif"
          >
            {text.body.length > 42 ? `${text.body.slice(0, 42)}…` : text.body}
          </text>
        </svg>
      </div>
    </aside>
  );
}
