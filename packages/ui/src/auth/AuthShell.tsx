import { type ReactNode } from "react";
import { cx } from "../utils/cx.js";
import {
  AuthIllustration,
  type AuthIllustrationVariant,
} from "./AuthIllustration.js";
import { AuthMotion } from "./AuthMotion.js";

export type AuthShellProps = {
  variant: AuthIllustrationVariant;
  title: string;
  description?: string | undefined;
  children: ReactNode;
  footer?: ReactNode | undefined;
  brandHref?: string | undefined;
  brandLabel?: string | undefined;
  className?: string | undefined;
  /** Document title hint for hosts / Storybook (SEO). */
  documentTitle?: string | undefined;
  loading?: boolean | undefined;
};

export function AuthShellSkeleton() {
  return (
    <div className="hamd-auth-shell hamd-auth-shell--skeleton" aria-busy="true" aria-live="polite">
      <div className="hamd-auth-shell__panel">
        <div className="hamd-auth-skel hamd-auth-skel--brand" />
        <div className="hamd-auth-skel hamd-auth-skel--title" />
        <div className="hamd-auth-skel hamd-auth-skel--line" />
        <div className="hamd-auth-skel hamd-auth-skel--field" />
        <div className="hamd-auth-skel hamd-auth-skel--field" />
        <div className="hamd-auth-skel hamd-auth-skel--button" />
      </div>
      <div className="hamd-auth-shell__visual hamd-auth-skel hamd-auth-skel--visual" />
    </div>
  );
}

/**
 * Premium split auth layout: form column + professional illustration.
 * Skip link targets #main-content for keyboard users.
 */
export function AuthShell({
  variant,
  title,
  description,
  children,
  footer,
  brandHref = "/",
  brandLabel = "Almahbub International",
  className,
  documentTitle,
  loading,
}: AuthShellProps) {
  if (loading) {
    return <AuthShellSkeleton />;
  }

  return (
    <div className={cx("hamd-auth-shell", className)} data-auth-variant={variant}>
      {documentTitle ? (
        <span className="hamd-auth-shell__seo" hidden>
          {documentTitle}
        </span>
      ) : null}
      <a className="hamd-auth-shell__skip" href="#main-content">
        Skip to main content
      </a>
      <div className="hamd-auth-shell__panel">
        <header className="hamd-auth-shell__brand">
          <a href={brandHref} className="hamd-auth-shell__brand-link" aria-label={brandLabel}>
            <img
              className="hamd-auth-shell__brand-logo"
              src="/almahbub.svg"
              alt=""
              width={36}
              height={36}
              decoding="async"
            />
            <span className="hamd-auth-shell__brand-text">
              <strong className="hamd-auth-shell__brand-name">
                {brandLabel.split(" ")[0] ?? brandLabel}
              </strong>
              {brandLabel.includes(" ") ? (
                <span className="hamd-auth-shell__brand-sub">
                  {brandLabel.slice(brandLabel.indexOf(" ") + 1)}
                </span>
              ) : null}
            </span>
          </a>
        </header>
        <AuthMotion className="hamd-auth-shell__content">
          <main id="main-content" className="hamd-auth-shell__main" tabIndex={-1}>
            <h1 className="hamd-auth-shell__title">{title}</h1>
            {description ? (
              <p className="hamd-auth-shell__desc">{description}</p>
            ) : null}
            {children}
          </main>
          {footer ? <footer className="hamd-auth-shell__footer">{footer}</footer> : null}
        </AuthMotion>
      </div>
      <AuthIllustration variant={variant} className="hamd-auth-shell__visual" />
    </div>
  );
}
