import { useState } from "react";
import {
  PlatformConfigWorkspace,
  platformConfigChangeLogFixture,
  platformConfigDocumentFixture,
  platformConfigVersionsFixture,
  type PlatformConfigDocument,
} from "@hamd/ui/platform-config";

import { useAuth } from "../auth/session/AuthProvider.js";
import { OpsAlert, OpsPage, OpsStatus } from "../components/OpsChrome.js";
import { OpsApiError } from "../lib/ops-fetch.js";

export function SettingsPage() {
  const auth = useAuth();
  const [document, setDocument] = useState<PlatformConfigDocument>(
    platformConfigDocumentFixture,
  );
  const [message, setMessage] = useState<string | null>(null);

  const canSave =
    auth.permissions.includes("platform:config") ||
    auth.permissions.includes("ops:access") ||
    auth.permissions.includes("guidance:manage");

  return (
    <OpsPage className="hamd-ops-settings">
      <OpsAlert tone="info">
        Platform settings use fixtures until a config API is wired.
      </OpsAlert>
      {message ? <OpsStatus tone="success">{message}</OpsStatus> : null}
      <PlatformConfigWorkspace
        document={document}
        versions={platformConfigVersionsFixture}
        changeLog={platformConfigChangeLogFixture}
        canSave={canSave}
        canRollback={canSave}
        onSave={async (input) => {
          if (!canSave) {
            throw new OpsApiError("Missing platform config permission.", 403, "FORBIDDEN");
          }
          setDocument((prev) => ({
            ...prev,
            values: input.values,
            rowVersion: prev.rowVersion + 1,
            updatedAt: new Date().toISOString(),
          }));
          setMessage("Configuration saved locally (fixture mode).");
        }}
        onRollback={async () => {
          throw new OpsApiError(
            "Config rollback requires a platform-config API.",
            501,
            "NOT_IMPLEMENTED",
          );
        }}
      />
    </OpsPage>
  );
}
