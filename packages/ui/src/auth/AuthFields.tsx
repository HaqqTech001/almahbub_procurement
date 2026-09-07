import {
  useEffect,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cx } from "../utils/cx.js";

export type AuthFloatingFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "placeholder"
> & {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  id?: string | undefined;
};

/** Floating-label text field with ARIA error wiring. */
export function AuthFloatingField({
  label,
  error,
  hint,
  id,
  className,
  value,
  defaultValue,
  onChange,
  ...rest
}: AuthFloatingFieldProps) {
  const reactId = useId();
  const fieldId = id ?? reactId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const [filled, setFilled] = useState(Boolean(value ?? defaultValue));

  useEffect(() => {
    if (value !== undefined) {
      setFilled(String(value).length > 0);
    }
  }, [value]);

  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cx("hamd-auth-field", error && "is-invalid", className)}>
      <div className={cx("hamd-auth-field__control", filled && "is-filled")}>
        <input
          {...rest}
          id={fieldId}
          className="hamd-auth-field__input"
          value={value}
          defaultValue={defaultValue}
          placeholder=" "
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...(error ? { "aria-errormessage": errorId } : {})}
          onChange={(event) => {
            setFilled(event.target.value.length > 0);
            onChange?.(event);
          }}
        />
        <label className="hamd-auth-field__label" htmlFor={fieldId}>
          {label}
        </label>
      </div>
      {hint && !error ? (
        <p id={hintId} className="hamd-auth-field__hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="hamd-auth-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function scorePassword(password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
} {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  const clamped = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  const labels = ["Too weak", "Weak", "Fair", "Strong", "Excellent"] as const;
  return { score: clamped, label: labels[clamped] };
}

export type AuthPasswordFieldProps = AuthFloatingFieldProps & {
  showStrength?: boolean;
};

export function AuthPasswordField({
  showStrength = false,
  value,
  onChange,
  ...rest
}: AuthPasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const password = typeof value === "string" ? value : "";
  const strength = showStrength ? scorePassword(password) : null;

  return (
    <div className="hamd-auth-password">
      <div className="hamd-auth-password__row">
        <AuthFloatingField
          {...rest}
          type={visible ? "text" : "password"}
          value={value}
          autoComplete={rest.autoComplete ?? "current-password"}
          onChange={(event) => {
            onChange?.(event);
          }}
          onKeyUp={(event) => {
            setCapsOn(event.getModifierState("CapsLock"));
            rest.onKeyUp?.(event);
          }}
          onKeyDown={(event) => {
            setCapsOn(event.getModifierState("CapsLock"));
            rest.onKeyDown?.(event);
          }}
        />
        <button
          type="button"
          className="hamd-auth-password__toggle"
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {capsOn ? (
        <p className="hamd-auth-password__caps" role="status">
          Caps Lock is on
        </p>
      ) : null}
      {strength && password ? (
        <div
          className="hamd-auth-password__strength"
          data-score={strength.score}
          aria-live="polite"
        >
          <div className="hamd-auth-password__strength-bars" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cx(
                  "hamd-auth-password__bar",
                  i < strength.score && "is-on",
                )}
              />
            ))}
          </div>
          <span className="hamd-auth-password__strength-label">{strength.label}</span>
        </div>
      ) : null}
    </div>
  );
}

export type AuthAlertProps = {
  tone?: "error" | "success" | "info" | "warning";
  title?: string;
  children: ReactNode;
};

export function AuthAlert({ tone = "info", title, children }: AuthAlertProps) {
  return (
    <div
      className={cx("hamd-auth-alert", `hamd-auth-alert--${tone}`)}
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
    >
      {title ? <p className="hamd-auth-alert__title">{title}</p> : null}
      <div className="hamd-auth-alert__body">{children}</div>
    </div>
  );
}

export function AuthSubmitButton({
  children,
  loading,
  disabled,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      type="submit"
      className={cx("hamd-auth-submit", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}

export function AuthCheckbox({
  id,
  label,
  checked,
  onChange,
}: {
  id?: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const reactId = useId();
  const fieldId = id ?? reactId;
  return (
    <label className="hamd-auth-check" htmlFor={fieldId}>
      <input
        id={fieldId}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
