import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { IE_BASE_PATH, resolveIeHashPath } from "./ie-paths.js";

/**
 * Migrates legacy hash destinations on the IE portal root to real routes.
 * Example: /businesses/almahbub-integrated-export#commodities → …/commodities
 */
export function IeHashRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname !== IE_BASE_PATH && location.pathname !== `${IE_BASE_PATH}/`) {
      return;
    }
    const next = resolveIeHashPath(location.hash);
    if (!next || next === IE_BASE_PATH) return;
    navigate(next, { replace: true });
  }, [location.hash, location.pathname, navigate]);

  return null;
}
