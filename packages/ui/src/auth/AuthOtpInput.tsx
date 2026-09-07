import {
  useCallback,
  useId,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { cx } from "../utils/cx.js";

export type AuthOtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string | undefined;
  autoFocus?: boolean;
  label?: string;
  id?: string | undefined;
};

/** Digit OTP with paste support and auto-advance focus. */
export function AuthOtpInput({
  length = 6,
  value,
  onChange,
  disabled,
  error,
  autoFocus = true,
  label = "One-time code",
  id,
}: AuthOtpInputProps) {
  const reactId = useId();
  const groupId = id ?? reactId;
  const errorId = `${groupId}-error`;
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const setDigit = useCallback(
    (index: number, char: string) => {
      const next = digits.slice();
      next[index] = char;
      onChange(next.join("").slice(0, length));
    },
    [digits, length, onChange],
  );

  const focusAt = (index: number) => {
    const el = inputsRef.current[index];
    el?.focus();
    el?.select();
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    focusAt(Math.min(pasted.length, length) - 1);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      if (digits[index]) {
        event.preventDefault();
        setDigit(index, "");
        return;
      }
      if (index > 0) {
        event.preventDefault();
        setDigit(index - 1, "");
        focusAt(index - 1);
      }
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusAt(index - 1);
    }
    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusAt(index + 1);
    }
  };

  return (
    <fieldset className={cx("hamd-auth-otp", error && "is-invalid")} disabled={disabled}>
      <legend className="hamd-auth-otp__legend" id={`${groupId}-label`}>
        {label}
      </legend>
      <div
        className="hamd-auth-otp__row"
        role="group"
        aria-labelledby={`${groupId}-label`}
        aria-describedby={error ? errorId : undefined}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            className="hamd-auth-otp__cell"
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            {...(index === 0 ? { name: "one-time-code" } : {})}
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            aria-label={`Digit ${index + 1} of ${length}`}
            autoFocus={autoFocus && index === 0}
            disabled={disabled}
            onPaste={handlePaste}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onChange={(event) => {
              const raw = event.target.value.replace(/\D/g, "");
              if (!raw) {
                setDigit(index, "");
                return;
              }
              const char = raw.slice(-1);
              setDigit(index, char);
              if (index < length - 1) {
                focusAt(index + 1);
              }
            }}
          />
        ))}
      </div>
      {error ? (
        <p id={errorId} className="hamd-auth-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
