import { CollectionSkeleton } from "@hamd/ui/primitives";
import { ModuleSkeleton } from "@hamd/ui/module-layout";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CelebrationExperienceModal } from "@hamd/ui/marketing";
import {
  DEFAULT_WEDDING_CAMPAIGN,
  formatWeddingWhen,
  weddingModalDismissKey,
  type WeddingCampaignRecord,
} from "@hamd/constants";

import { useAuth } from "../auth/session/auth-context.js";
import { getAccessToken } from "../auth/session/token-store.js";
import { OpsAlert, OpsPage, OpsStatus } from "../components/OpsChrome.js";
import { opsFetch, requireOpsToken } from "../lib/ops-fetch.js";
import { WeddingGalleryPanel, type WeddingOpsGalleryItem } from "./wedding/WeddingGalleryPanel.js";
import { WeddingWaitingAudioPanel } from "./wedding/WeddingWaitingAudioPanel.js";
import { WeddingParticipantsPanel } from "./wedding/WeddingParticipantsPanel.js";
import type { WeddingWaitingTrack } from "@hamd/constants";

type Tab = "overview" | "live" | "waiting-music" | "gallery" | "comments" | "invitation" | "waiting" | "subscription";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "live", label: "Live Broadcast" },
  { id: "waiting-music", label: "Waiting Music" },
  { id: "gallery", label: "Gallery" },
  { id: "comments", label: "Comments" },
  { id: "invitation", label: "Invitation" },
  { id: "waiting", label: "Waiting Room" },
  { id: "subscription", label: "Update subscriptions" },
];

export function WeddingCampaignPage() {
  const auth = useAuth();
  const [tab, setTab] = useState<Tab>("live");
  const [campaign, setCampaign] = useState<WeddingCampaignRecord>(DEFAULT_WEDDING_CAMPAIGN);
  const [configured, setConfigured] = useState(false);
  const [testControls, setTestControls] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [viewers, setViewers] = useState(0);
  const [comments, setComments] = useState<Array<{ id: string; displayName: string; message: string; createdAt?: string }>>([]);
  const [commentQuery, setCommentQuery] = useState("");
  const [gallery, setGallery] = useState<WeddingOpsGalleryItem[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [collectionErrors, setCollectionErrors] = useState<Record<string, boolean>>({});
  const [waitingTracks, setWaitingTracks] = useState<WeddingWaitingTrack[]>([]);

  const token = () => requireOpsToken(auth.ensureSession, getAccessToken);

  const refresh = async () => {
    setCollectionsLoading(true); setCollectionErrors({});
    const access = await token();
    const row = await opsFetch<
      WeddingCampaignRecord & { testControlsEnabled?: boolean; livekitConfigured?: boolean }
    >("/wedding/campaign", { accessToken: access });
    setCampaign({ ...DEFAULT_WEDDING_CAMPAIGN, ...row });
    setTestControls(Boolean(row.testControlsEnabled));
    setConfigured(Boolean(row.livekitConfigured));
    try {
      const summary = await opsFetch<{ viewerCount: number }>("/wedding/live/viewers", {
        accessToken: access,
      });
      setViewers(summary.viewerCount ?? 0);
    } catch {
      setViewers(0);
    }
    try {
      const list = await opsFetch<{ items: Array<{ id: string; displayName: string; message: string; createdAt?: string }> }>(
        "/wedding/comments",
        { accessToken: access },
      );
      setComments(list.items ?? []);
    } catch {
      setCollectionErrors(current => ({...current, comments: true}));
    }
    try {
      const media = await opsFetch<{ items: WeddingOpsGalleryItem[] }>(
        "/wedding/gallery",
        { accessToken: access },
      );
      setGallery(media.items ?? []);
    } catch {
      setCollectionErrors(current => ({...current, gallery: true}));
    }
    try {
      const audio = await opsFetch<{ items: WeddingWaitingTrack[] }>("/wedding/waiting-audio", {
        accessToken: access,
      });
      setWaitingTracks(audio.items ?? []);
    } catch {
      setCollectionErrors(current => ({...current, "waiting-music": true}));
    }
    setCollectionsLoading(false);
  };

  useEffect(() => {
    void refresh().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Unable to load campaign.");
      setCollectionsLoading(false);
    });
  }, []);

  const saveInvitation = async () => {
    setError(null);
    const access = await token();
    const row = await opsFetch<WeddingCampaignRecord>("/wedding/campaign", {
      method: "PATCH",
      accessToken: access,
      body: {
        coupleNames: campaign.coupleNames,
        invitationHeading: campaign.invitationHeading,
        invitationBody: campaign.invitationBody,
        familyLine: campaign.familyLine,
        eventAt: campaign.eventAt,
        streamAt: campaign.streamAt,
        venue: campaign.venue,
        venueAddress: campaign.venueAddress,
        modalEnabled: campaign.modalEnabled,
        recordingDownloadEnabled: campaign.recordingDownloadEnabled,
        commentsEnabled: campaign.commentsEnabled,
      },
    });
    setCampaign({ ...DEFAULT_WEDDING_CAMPAIGN, ...row });
    setStatus("Invitation saved.");
  };

  return (
    <OpsPage className="hamd-wedding-ops">
      <header className="hamd-wedding-ops__header">
        <div>
          <p className="hamd-wedding-ops__eyebrow">Wedding Campaign</p>
          <h1>{campaign.title}</h1>
          <p>{formatWeddingWhen(campaign.eventAt)}</p>
        </div>
        <p className="hamd-wedding-ops__chip" data-state={campaign.streamStatus}>
          {campaign.streamStatus}
        </p>
      </header>
      {error ? <OpsAlert>{error}</OpsAlert> : null}
      {status ? <OpsStatus tone="success">{status}</OpsStatus> : null}
      <nav className="hamd-wedding-ops__tabs" aria-label="Wedding campaign sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? "is-active" : undefined}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "waiting" || tab === "subscription" ? <WeddingParticipantsPanel key={tab} kind={tab} /> : null}
      {tab === "overview" ? (
        <dl className="hamd-wedding-ops__overview">
          <div>
            <dt>Campaign status</dt>
            <dd>{campaign.streamStatus}</dd>
          </div>
          <div>
            <dt>Event date</dt>
            <dd>{formatWeddingWhen(campaign.eventAt)}</dd>
          </div>
          <div>
            <dt>Invitation modal</dt>
            <dd>
              {campaign.modalEnabled ? "Active" : "Disabled"} · ends {formatWeddingWhen(campaign.modalEndsAt)}
            </dd>
          </div>
          <div>
            <dt>Live stream</dt>
            <dd>
              {!configured
                ? "Not configured"
                : campaign.streamStatus === "live"
                  ? `Live . ${viewers} ${viewers === 1 ? "viewer" : "viewers"}`
                  : campaign.streamStatus === "ended"
                    ? "Ended"
                    : "Ready"}
            </dd>
          </div>
          <div>
            <dt>Waiting Music</dt>
            <dd>
              {waitingTracks.length} {waitingTracks.length === 1 ? "track" : "tracks"}
              {campaign.waitingMusicEnabled ? " · enabled" : " · disabled"}
            </dd>
          </div>
          <div>
            <dt>Gallery</dt>
            <dd>{gallery.length} items</dd>
          </div>
          <div>
            <dt>Comments</dt>
            <dd>{comments.length} guest messages</dd>
          </div>
          <div>
            <dt>Recording</dt>
            <dd>Unavailable</dd>
          </div>
        </dl>
      ) : null}

      {tab === "live" ? (
        <section className="hamd-wedding-ops-panel">
          {!configured ? (
            <OpsAlert tone="warning">
              Live streaming setup required. Configure the LiveKit connection before starting a
              broadcast. Invitation, gallery, and comments remain available.
            </OpsAlert>
          ) : null}
          <p>
            {campaign.streamStatus === "live"
              ? campaign.liveMode === "test"
                ? "A test broadcast is live."
                : "The celebration is live."
              : "Open Broadcast Studio to preview cameras and start the live celebration."}
          </p>
          <div className="hamd-entity-form__actions">
            <Link className="hamd-btn hamd-btn--primary" to="/wedding/studio">
              Open Broadcast Studio
            </Link>
          </div>
        </section>
      ) : null}

      {["gallery", "comments", "waiting-music"].includes(tab) && collectionsLoading ? (tab === "gallery" ? <CollectionSkeleton label="Loading wedding media" gridClassName="hamd-wedding-gallery" aspectRatio="1" /> : <ModuleSkeleton variant="list" count={4} />) : null}
      {collectionErrors[tab] && !collectionsLoading ? <OpsAlert>Unable to load {tab}. <button onClick={() => void refresh().catch(() => { setCollectionsLoading(false); setError("Unable to refresh wedding content."); })}>Retry</button></OpsAlert> : null}
      {tab === "waiting-music" && !collectionsLoading && !collectionErrors[tab] ? (
        <WeddingWaitingAudioPanel
          tracks={waitingTracks}
          enabled={Boolean(campaign.waitingMusicEnabled)}
          loop={campaign.waitingMusicLoop !== false}
          accessToken={token}
          onTracks={setWaitingTracks}
          onEnabled={(value) => setCampaign(current => ({ ...current, waitingMusicEnabled: value }))}
          onLoop={(value) => setCampaign(current => ({ ...current, waitingMusicLoop: value }))}
        />
      ) : null}

      {tab === "gallery" && !collectionsLoading && !collectionErrors[tab] ? (
        <WeddingGalleryPanel items={gallery} accessToken={token} onItems={setGallery} />
      ) : null}

      {tab === "comments" && !collectionsLoading && !collectionErrors[tab] ? (
        <section className="hamd-wedding-ops-comments">
          <header>
            <h2>Guest messages</h2>
            <label>
              Search
              <input
                value={commentQuery}
                onChange={(event) => setCommentQuery(event.target.value)}
                placeholder="Filter by guest or message"
              />
            </label>
          </header>
          <ul>
            {comments
              .filter((row) => {
                const q = commentQuery.trim().toLowerCase();
                if (!q) return true;
                return (
                  row.displayName.toLowerCase().includes(q) || row.message.toLowerCase().includes(q)
                );
              })
              .map((row) => (
              <li key={row.id}>
                <span aria-hidden="true">{row.displayName.slice(0, 1).toUpperCase()}</span>
                <div>
                  <strong>{row.displayName}</strong>
                  <p>{row.message}</p>
                  {row.createdAt ? <time dateTime={row.createdAt}>{formatWeddingWhen(row.createdAt)}</time> : null}
                </div>
                <button
                  type="button"
                  className="hamd-btn hamd-btn--ghost"
                  onClick={() => {
                    void (async () => {
                      const access = await token();
                      await opsFetch(`/wedding/comments/${row.id}/hide`, {
                        method: "POST",
                        accessToken: access,
                        body: {},
                      });
                      setComments((current) => current.filter((item) => item.id !== row.id));
                    })();
                  }}
                >
                  Hide
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "invitation" ? (
        <section className="hamd-wedding-ops-panel">
          <form
            className="hamd-entity-form hamd-entity-form--simple"
            onSubmit={(event) => {
              event.preventDefault();
              void saveInvitation().catch((err: unknown) => {
                setError(err instanceof Error ? err.message : "Save failed.");
              });
            }}
          >
            <label className="hamd-entity-field">
              Couple names
              <input value={campaign.coupleNames} onChange={(e) => setCampaign({ ...campaign, coupleNames: e.target.value })} />
            </label>
            <label className="hamd-entity-field">
              Family line
              <input value={campaign.familyLine} onChange={(e) => setCampaign({ ...campaign, familyLine: e.target.value })} />
            </label>
            <label className="hamd-entity-field">
              Invitation heading
              <input value={campaign.invitationHeading} onChange={(e) => setCampaign({ ...campaign, invitationHeading: e.target.value })} />
            </label>
            <label className="hamd-entity-field">
              Invitation line
              <input value={campaign.invitationBody} onChange={(e) => setCampaign({ ...campaign, invitationBody: e.target.value })} />
            </label>
            <label className="hamd-entity-field">
              Event date
              <input value={campaign.eventAt} onChange={(e) => setCampaign({ ...campaign, eventAt: e.target.value })} />
            </label>
            <label className="hamd-entity-field">
              Stream date/time
              <input value={campaign.streamAt} onChange={(e) => setCampaign({ ...campaign, streamAt: e.target.value })} />
            </label>
            <label className="hamd-entity-field">
              Venue
              <input value={campaign.venue} onChange={(e) => setCampaign({ ...campaign, venue: e.target.value })} />
            </label>
            <label className="hamd-entity-field">
              Venue address
              <input value={campaign.venueAddress} onChange={(e) => setCampaign({ ...campaign, venueAddress: e.target.value })} />
            </label>
            <label className="hamd-entity-field">
              <span>
                <input
                  type="checkbox"
                  checked={campaign.modalEnabled}
                  onChange={(e) => setCampaign({ ...campaign, modalEnabled: e.target.checked })}
                />{" "}
                Wedding promotion: {campaign.modalEnabled ? "Enabled" : "Disabled"}
                <small> Controls the public wedding invitation and floating wedding entry. Save invitation to apply.</small>
              </span>
            </label>
            <div className="hamd-entity-form__actions">
              <button type="submit" className="hamd-btn hamd-btn--primary">
                Save invitation
              </button>
              <button type="button" className="hamd-btn hamd-btn--secondary" onClick={() => setPreviewOpen(true)}>
                Preview Invitation
              </button>
              <button
                type="button"
                className="hamd-btn hamd-btn--ghost"
                onClick={() => {
                  try {
                    window.sessionStorage.removeItem(weddingModalDismissKey(campaign.id));
                  } catch {
                    /* ignore */
                  }
                  setStatus("Invitation dismissal reset for this campaign.");
                }}
              >
                Reset Invitation Dismissal
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {testControls ? (
        <section className="hamd-wedding-ops-panel" aria-label="Wedding Test Controls">
          <h2>Wedding Test Controls</h2>
          <div className="hamd-entity-form__actions">
            {(["upcoming", "live", "ended", "enable-modal", "disable-modal"] as const).map((action) => (
              <button
                key={action}
                type="button"
                className="hamd-btn hamd-btn--ghost"
                onClick={() => {
                  void (async () => {
                    const access = await token();
                    const row = await opsFetch<WeddingCampaignRecord>("/wedding/test", {
                      method: "POST",
                      accessToken: access,
                      body: { action },
                    });
                    setCampaign({ ...DEFAULT_WEDDING_CAMPAIGN, ...row });
                    setStatus(`Test action: ${action}`);
                  })().catch((err: unknown) => {
                    setError(err instanceof Error ? err.message : "Test control rejected.");
                  });
                }}
              >
                {action}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <CelebrationExperienceModal
        open={previewOpen}
        campaign={campaign}
        closeLabel="Close preview"
        backLabel="Back to Broadcast"
        className="hamd-wedding-modal--preview"
        onDismiss={() => setPreviewOpen(false)}
      />
    </OpsPage>
  );
}
