const GIS_SRC = "https://accounts.google.com/gsi/client";

export type GoogleIdCallback = (response: { credential?: string }) => void;

export type GoogleButtonOptions = {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number | string;
};

export type GoogleIdentityApi = {
  initialize: (config: {
    client_id: string;
    callback: GoogleIdCallback;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_prompt?: boolean;
    ux_mode?: "popup" | "redirect";
  }) => void;
  renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void;
};

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleIdentityApi } };
  }
}

let loadPromise: Promise<GoogleIdentityApi> | null = null;
let initializedClientId: string | null = null;
let credentialHandler: ((credential: string) => void) | null = null;

export function googleClientIdFromEnv(): string | undefined {
  const id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  return typeof id === "string" && id.trim().length > 0 ? id.trim() : undefined;
}

/**
 * GIS must be initialized once per client ID. React StrictMode remounts
 * AuthProvider; calling initialize repeatedly recreates Google iframes.
 * Origin is always window.location.origin — never a route path.
 */
export function initializeGoogleIdentity(
  api: GoogleIdentityApi,
  clientId: string,
  onCredential: (credential: string) => void,
): void {
  credentialHandler = onCredential;
  if (initializedClientId === clientId) return;
  api.initialize({
    client_id: clientId,
    callback: (response) => {
      if (typeof response.credential === "string" && response.credential) {
        credentialHandler?.(response.credential);
      }
    },
    auto_select: false,
    cancel_on_tap_outside: true,
    use_fedcm_for_prompt: false,
    ux_mode: "popup",
  });
  initializedClientId = clientId;
}

export function getGoogleIdentity(): GoogleIdentityApi | null {
  return window.google?.accounts?.id ?? null;
}

export function loadGoogleIdentityScript(): Promise<GoogleIdentityApi> {
  const existing = getGoogleIdentity();
  if (existing) {
    return Promise.resolve(existing);
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<GoogleIdentityApi>((resolve, reject) => {
    const finish = () => {
      const api = getGoogleIdentity();
      if (api) {
        resolve(api);
        return;
      }
      loadPromise = null;
      reject(new Error("Google Identity Services did not initialize."));
    };

    const prior = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SRC}"]`,
    );
    if (prior) {
      prior.addEventListener("load", finish, { once: true });
      prior.addEventListener(
        "error",
        () => {
          loadPromise = null;
          reject(new Error("Google Identity Services failed to load."));
        },
        { once: true },
      );
      if (getGoogleIdentity()) finish();
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", finish, { once: true });
    script.addEventListener(
      "error",
      () => {
        loadPromise = null;
        reject(new Error("Google Identity Services failed to load."));
      },
      { once: true },
    );
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function resetGoogleIdentityLoaderForTests(): void {
  loadPromise = null;
  initializedClientId = null;
  credentialHandler = null;
}
