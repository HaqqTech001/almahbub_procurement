import { useId, useState, type FormEvent } from "react";
import { cx } from "../utils/cx.js";

export type NewsletterCaptureProps = {
  id?: string;
  className?: string;
  privacyHref?: string;
  action?: string;
  onSubmit?: (email: string) => void | Promise<void>;
  submitLabel?: string;
  helpText?: string;
  /** Visual tone for embedding in light sections vs dark footer. */
  tone?: "default" | "inverse";
  /** Override success copy (default assumes inbox confirmation). */
  successMessage?: string;
};

/**
 * Shared newsletter capture - used by Homepage Newsletter section and GlobalFooter.
 */
export function NewsletterCapture({
  id,
  className,
  privacyHref = "/privacy",
  action = "/newsletter",
  onSubmit,
  submitLabel = "Subscribe",
  helpText = "Occasional updates on sourcing, logistics, and accountable delivery.",
  tone = "default",
  successMessage = "Subscribed. Check your inbox for confirmation.",
}: NewsletterCaptureProps) {
  const reactId = useId();
  const fieldId = id ?? `${reactId}-email`;
  const statusId = `${reactId}-status`;
  const errorId = `${reactId}-error`;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const describedBy =
    [status !== "idle" ? statusId : null, status === "error" ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus("error");
      setError("Enter a valid email address.");
      return;
    }

    setStatus("loading");
    setError(null);
    try {
      if (onSubmit) {
        await onSubmit(trimmed);
      } else {
        const response = await fetch(action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed }),
        });
        if (!response.ok) {
          throw new Error("Newsletter subscription failed.");
        }
      }
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setError("Unable to subscribe right now. Try again or use Contact.");
    }
  };

  return (
    <form
      className={cx("hamd-newsletter", `hamd-newsletter--${tone}`, className)}
      onSubmit={handleSubmit}
      noValidate
    >
      {helpText ? <p className="hamd-newsletter__help">{helpText}</p> : null}
      <label className="hamd-newsletter__label" htmlFor={fieldId}>
        Email address
      </label>
      <div className="hamd-newsletter__row">
        <input
          id={fieldId}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          className="hamd-newsletter__input"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status !== "idle") {
              setStatus("idle");
              setError(null);
            }
          }}
          aria-invalid={status === "error"}
          aria-describedby={describedBy}
          {...(status === "error" ? { "aria-errormessage": errorId } : {})}
        />
        <button
          type="submit"
          className="hamd-newsletter__submit"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Subscribing…" : submitLabel}
        </button>
      </div>
      {status === "error" && error ? (
        <p id={errorId} className="hamd-newsletter__status is-error" role="alert">
          {error}
        </p>
      ) : null}
      <p
        id={statusId}
        className={cx("hamd-newsletter__status", status === "success" && "is-success")}
        role="status"
        aria-live="polite"
      >
        {status === "success" ? successMessage : null}
      </p>
      <p className="hamd-newsletter__legal">
        By subscribing you agree to our <a href={privacyHref}>Privacy Policy</a>.
      </p>
    </form>
  );
}
