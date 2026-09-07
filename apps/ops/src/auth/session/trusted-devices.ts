/** Trusted device registry - local preference mirror; server devices API is source of truth when signed in. */

export type TrustedDevice = {
  id: string;
  label: string;
  userAgent: string;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
};

const STORAGE_KEY = "hamd.web.auth.trustedDevices";

function readAll(): TrustedDevice[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as TrustedDevice[]) : [];
  } catch {
    return [];
  }
}

function writeAll(devices: TrustedDevice[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
  } catch {
    /* ignore */
  }
}

export function getCurrentDeviceFingerprint(): string {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
  const lang = typeof navigator !== "undefined" ? navigator.language : "en";
  const platform =
    typeof navigator !== "undefined" ? navigator.platform || "web" : "web";
  const raw = `${ua}|${lang}|${platform}`;
  /* Ensure >= 8 chars for API schema; pad if needed. */
  const encoded =
    typeof btoa === "function"
      ? btoa(unescape(encodeURIComponent(raw)))
      : raw;
  return encoded.slice(0, 64).padEnd(8, "0");
}

export function getCurrentDeviceLabel(): string {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "Browser";
  if (/Edg\//.test(ua)) return "Microsoft Edge";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua)) return "Safari";
  return "This browser";
}

export function getCurrentDevicePlatform(): string {
  return typeof navigator !== "undefined"
    ? navigator.platform || "web"
    : "web";
}

export function listTrustedDevices(): TrustedDevice[] {
  const id = getCurrentDeviceFingerprint();
  return readAll().map((device) => ({
    ...device,
    current: device.id === id,
  }));
}

export function trustCurrentDevice(): TrustedDevice {
  const id = getCurrentDeviceFingerprint();
  const now = new Date().toISOString();
  const devices = readAll().filter((device) => device.id !== id);
  const next: TrustedDevice = {
    id,
    label: getCurrentDeviceLabel(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    createdAt: now,
    lastSeenAt: now,
    current: true,
  };
  writeAll([next, ...devices].slice(0, 8));
  return next;
}

export function touchCurrentDevice(): void {
  const id = getCurrentDeviceFingerprint();
  const devices = readAll();
  const index = devices.findIndex((device) => device.id === id);
  if (index < 0) return;
  const current = devices[index]!;
  devices[index] = { ...current, lastSeenAt: new Date().toISOString() };
  writeAll(devices);
}

export function revokeTrustedDevice(id: string): void {
  writeAll(readAll().filter((device) => device.id !== id));
}

export function revokeOtherTrustedDevices(): void {
  const id = getCurrentDeviceFingerprint();
  writeAll(readAll().filter((device) => device.id === id));
}

export function clearTrustedDevices(): void {
  writeAll([]);
}
