import { useEffect, useRef, type ReactNode } from "react";

import { useOptionalTheme } from "../../app/providers/ThemeProvider.js";
import { useAuth } from "../session/AuthProvider.js";

export const GOOGLE_SIGN_IN_FAILURE =
  "We couldn't sign you in with Google right now.";

type GoogleSignInButtonProps = {
  text: "signin_with" | "signup_with";
  onCredential: (credential: string) => void | Promise<void>;
  disabled?: boolean;
  retryLabel?: string;
  showRetry?: boolean;
  onRetry?: () => void;
};

function gisTheme(resolved?: string): "outline" | "filled_black" {
  return resolved === "dark" ? "filled_black" : "outline";
}

function measureGisWidth(el: HTMLElement): number {
  const raw = Math.floor(el.clientWidth || el.getBoundingClientRect().width || 320);
  return Math.min(400, Math.max(200, raw));
}

export function GoogleSignInButton({
  text,
  onCredential,
  disabled = false,
  retryLabel = "Try Again",
  showRetry = false,
  onRetry,
}: GoogleSignInButtonProps) {
  const auth = useAuth();
  const theme = useOptionalTheme();
  const measureRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const paintKeyRef = useRef<string | null>(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;
  const registerHandler = auth.registerGoogleCredentialHandler;

  useEffect(() => {
    return registerHandler((credential) => {
      void onCredentialRef.current(credential);
    });
  }, [registerHandler]);

  useEffect(() => {
    const host = hostRef.current;
    const measureEl = measureRef.current;
    if (!host || !measureEl || !auth.googleSignInReady || disabled) return;

    const paint = () => {
      const width = measureGisWidth(measureEl);
      const themeName = gisTheme(theme?.resolved);
      const key = `${text}:${themeName}:${width}`;
      if (paintKeyRef.current === key && host.childElementCount > 0) return;
      paintKeyRef.current = key;
      host.replaceChildren();
      try {
        window.google?.accounts?.id?.renderButton(host, {
          type: "standard",
          theme: themeName,
          size: "large",
          text,
          shape: "rectangular",
          logo_alignment: "left",
          width,
        });
      } catch {
        /* Password sign-in remains available. */
      }
    };

    paint();
    if (typeof ResizeObserver !== "function") {
      return undefined;
    }
    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(paint);
    });
    observer.observe(measureEl);
    return () => observer.disconnect();
  }, [auth.googleSignInReady, disabled, text, theme?.resolved]);

  return (
    <>
      <div ref={measureRef} className="hamd-auth-gis-measure">
        <div
          ref={hostRef}
          className="hamd-auth-gis"
          data-testid="google-sign-in"
          data-gis-theme={gisTheme(theme?.resolved)}
        />
      </div>
      {showRetry && onRetry ? (
        <button type="button" className="hamd-auth-google-retry" onClick={onRetry}>
          {retryLabel}
        </button>
      ) : null}
    </>
  );
}

export function GoogleAuthErrorActions({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="hamd-auth-google-slot__actions">{children}</div>;
}
