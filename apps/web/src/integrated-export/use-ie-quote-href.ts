import { useOptionalAuth } from "../auth/session/AuthProvider.js";
import { ieQuoteActionHref } from "./ie-paths.js";

export function useIeQuoteHref(commoditySlug?: string): string {
  const auth = useOptionalAuth();
  return ieQuoteActionHref({
    commoditySlug,
    authenticated: auth?.status === "authenticated",
  });
}
