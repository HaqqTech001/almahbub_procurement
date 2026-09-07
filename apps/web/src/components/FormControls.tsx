import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cx } from "./cx.js";

export type FieldProps = {
  label: string;
  htmlFor: string;
  required?: boolean | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  children: ReactNode;
  className?: string | undefined;
};

export function Field({ label, htmlFor, required, error, hint, children, className }: FieldProps) {
  return (
    <div className={cx("hamd-field", className)}>
      <label className="hamd-field__label" htmlFor={htmlFor}>
        {label}
        {required ? (
          <span className="hamd-field__required" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? <p className="hamd-field__hint">{hint}</p> : null}
      {error ? (
        <p className="hamd-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean | undefined;
};

export function TextInput({ className, invalid, ...rest }: TextInputProps) {
  return (
    <input
      className={cx("hamd-input", invalid && "hamd-input--invalid", className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean | undefined;
};

export function TextArea({ className, invalid, ...rest }: TextAreaProps) {
  return (
    <textarea
      className={cx("hamd-input hamd-textarea", invalid && "hamd-input--invalid", className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean | undefined;
};

export function Select({ className, invalid, children, ...rest }: SelectProps) {
  return (
    <select
      className={cx("hamd-input hamd-select", invalid && "hamd-input--invalid", className)}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {children}
    </select>
  );
}
