import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type FieldProps = {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

export function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className,
}: FieldProps) {
  const hintId = hint && !error ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;

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
      {hint && !error ? (
        <p id={hintId} className="hamd-field__hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="hamd-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <section className={cx("hamd-form-section", className)}>
      <header className="hamd-form-section__header">
        <h2 className="hamd-form-section__title">{title}</h2>
        {description ? <p className="hamd-form-section__description">{description}</p> : null}
      </header>
      <div className="hamd-form-section__body">{children}</div>
    </section>
  );
}
