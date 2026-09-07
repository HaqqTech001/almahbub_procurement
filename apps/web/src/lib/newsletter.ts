import { browserApiBase } from "./api-origin.js";

const WAITLIST_KEY = "hamd.web.newsletter.waitlist";

export type NewsletterSubscribeResult = {
  channel: "api" | "waitlist";
};

function readWaitlist(): Array<{ email: string; at: string }> {
  try {
    const raw = window.localStorage.getItem(WAITLIST_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Array<{ email: string; at: string }>) : [];
  } catch {
    return [];
  }
}

function writeWaitlist(entries: Array<{ email: string; at: string }>): void {
  try {
    window.localStorage.setItem(WAITLIST_KEY, JSON.stringify(entries));
  } catch {
    /* private mode / quota */
  }
}

/**
 * Newsletter subscribe for the public site.
 * Tries marketing API when configured; otherwise records a local waitlist entry
 * until the marketing endpoint ships (honest success copy in the UI).
 */
export async function subscribeNewsletter(
  email: string,
): Promise<NewsletterSubscribeResult> {
  const trimmed = email.trim().toLowerCase();
  const apiBase = browserApiBase();

  if (apiBase) {
    try {
      const response = await fetch(`${apiBase}/api/v1/marketing/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (response.ok) {
        return { channel: "api" };
      }
    } catch {
      /* fall through to waitlist */
    }
  }

  const existing = readWaitlist();
  if (!existing.some((entry) => entry.email === trimmed)) {
    writeWaitlist([...existing, { email: trimmed, at: new Date().toISOString() }]);
  }
  return { channel: "waitlist" };
}

export const newsletterSuccessMessage =
  "Thank you. You’re on our updates list we’ll only send occasional procurement insights.";
