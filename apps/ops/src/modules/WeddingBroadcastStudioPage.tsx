import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_WEDDING_CAMPAIGN, type WeddingCampaignRecord } from "@hamd/constants";

import { useAuth } from "../auth/session/auth-context.js";
import { getAccessToken } from "../auth/session/token-store.js";
import { ThemeToggle } from "../components/ThemeToggle.js";
import { OpsAlert } from "../components/OpsChrome.js";
import { opsFetch, requireOpsToken } from "../lib/ops-fetch.js";
import { WeddingBroadcastPanel } from "./wedding/WeddingBroadcastPanel.js";

export function WeddingBroadcastStudioPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<WeddingCampaignRecord>(DEFAULT_WEDDING_CAMPAIGN);
  const [configured, setConfigured] = useState(false);
  const [testEnabled, setTestEnabled] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [leaveSignal, setLeaveSignal] = useState(0);
  const live = campaign.streamStatus === "live";

  const token = () => requireOpsToken(auth.ensureSession, getAccessToken);

  useEffect(() => {
    void (async () => {
      const access = await token();
      const row = await opsFetch<
        WeddingCampaignRecord & { testControlsEnabled?: boolean; livekitConfigured?: boolean }
      >("/wedding/campaign", { accessToken: access });
      setCampaign({ ...DEFAULT_WEDDING_CAMPAIGN, ...row });
      setConfigured(Boolean(row.livekitConfigured));
      setTestEnabled(Boolean(row.testControlsEnabled) || import.meta.env.DEV);
      try {
        const summary = await opsFetch<{ viewerCount: number }>("/wedding/live/viewers", {
          accessToken: access,
        });
        setViewers(summary.viewerCount ?? 0);
      } catch {
        setViewers(0);
      }
    })().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Unable to open Broadcast Studio.");
    });
  }, []);

  return (
    <div className="hamd-wedding-studio-page">
      <div className="hamd-wedding-studio-page__theme">
        <ThemeToggle />
      </div>
      {error ? <OpsAlert>{error}</OpsAlert> : null}
      <WeddingBroadcastPanel
        studio
        testEnabled={testEnabled}
        leaveSignal={leaveSignal}
        accessToken={token}
        campaign={campaign}
        configured={configured}
        viewers={viewers}
        onCampaign={setCampaign}
        onStay={() => setLeaveSignal(0)}
        onExitStudio={() => {
          if (live) {
            setLeaveSignal((value) => value + 1);
            return;
          }
          navigate("/wedding");
        }}
      />
    </div>
  );
}
