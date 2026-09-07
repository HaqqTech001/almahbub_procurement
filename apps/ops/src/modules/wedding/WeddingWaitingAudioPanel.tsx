import { useEffect, useId, useRef, useState } from "react";
import { ConfirmationDialog } from "@hamd/ui/primitives";
import {
  WEDDING_WAITING_AUDIO_ACCEPT,
  WEDDING_WAITING_AUDIO_MAX_BYTES,
  formatWeddingAudioDuration,
  formatWeddingFileSize,
  validateWeddingWaitingAudioFile,
  type WeddingWaitingTrack,
} from "@hamd/constants";

import { OpsAlert } from "../../components/OpsChrome.js";
import { opsFetch } from "../../lib/ops-fetch.js";

type PendingTrack = {
  file: File;
  previewUrl: string;
  title: string;
  caption: string;
  durationSeconds: number | null;
};

type Props = {
  tracks: WeddingWaitingTrack[];
  enabled: boolean;
  loop: boolean;
  accessToken: () => Promise<string>;
  onTracks: (rows: WeddingWaitingTrack[]) => void;
  onEnabled: (value: boolean) => void;
  onLoop: (value: boolean) => void;
};

export function WeddingWaitingAudioPanel({
  tracks,
  enabled,
  loop,
  accessToken,
  onTracks,
  onEnabled,
  onLoop,
}: Props) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(null);
  const storedAudioRef = useRef<HTMLAudioElement>(null);
  const pendingRef = useRef<PendingTrack | null>(null);
  const [composer, setComposer] = useState(false);
  const [pending, setPending] = useState<PendingTrack | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [pendingPlaying, setPendingPlaying] = useState(false);

  pendingRef.current = pending;

  useEffect(() => {
    return () => {
      const current = pendingRef.current;
      if (current) URL.revokeObjectURL(current.previewUrl);
    };
  }, []);

  const revokePending = () => {
    setPending((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
    setPendingPlaying(false);
  };

  const closeComposer = () => {
    revokePending();
    setComposer(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const selectFile = (file: File | undefined) => {
    if (!file) return;
    const invalid = validateWeddingWaitingAudioFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setPending((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        title: file.name.replace(/\.[^.]+$/, ""),
        caption: "",
        durationSeconds: null,
      };
    });
  };

  const uploadPending = async () => {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      const token = await accessToken();
      const body = new FormData();
      body.append("files", pending.file);
      body.append("title", pending.title.trim() || pending.file.name.replace(/\.[^.]+$/, ""));
      body.append("caption", pending.caption.trim());
      if (pending.durationSeconds != null) {
        body.append("durationSeconds", String(pending.durationSeconds));
      }
      const row = await opsFetch<WeddingWaitingTrack>("/wedding/waiting-audio", {
        method: "POST",
        accessToken: token,
        form: body,
      });
      URL.revokeObjectURL(pending.previewUrl);
      setPending(null);
      setPendingPlaying(false);
      setComposer(false);
      onTracks([...tracks, row]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const patchTrack = async (id: string, body: Record<string, unknown>) => {
    const token = await accessToken();
    const row = await opsFetch<WeddingWaitingTrack>(`/wedding/waiting-audio/${id}`, {
      method: "PATCH",
      accessToken: token,
      body,
    });
    onTracks(tracks.map((item) => (item.id === id ? { ...item, ...row } : item)));
  };

  const moveTrack = async (id: string, direction: -1 | 1) => {
    const index = tracks.findIndex((row) => row.id === id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= tracks.length) return;
    const ids = tracks.map((row) => row.id);
    const [moved] = ids.splice(index, 1);
    if (!moved) return;
    ids.splice(next, 0, moved);
    const token = await accessToken();
    const result = await opsFetch<{ items: WeddingWaitingTrack[] }>("/wedding/waiting-audio/reorder", {
      method: "POST",
      accessToken: token,
      body: { ids },
    });
    onTracks(result.items ?? []);
  };

  const deleteTrack = async (id: string) => {
    setBusy(true);
    try {
      const token = await accessToken();
      await opsFetch(`/wedding/waiting-audio/${id}`, { method: "DELETE", accessToken: token });
      if (previewingId === id) {
        storedAudioRef.current?.pause();
        setPreviewingId(null);
      }
      onTracks(tracks.filter((row) => row.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to remove this track.");
    } finally {
      setBusy(false);
      setRemoveId(null);
    }
  };

  const setConfig = async (next: { enabled?: boolean; loop?: boolean }) => {
    if (next.enabled !== undefined) onEnabled(next.enabled);
    if (next.loop !== undefined) onLoop(next.loop);
    const token = await accessToken();
    await opsFetch("/wedding/waiting-audio/enabled", {
      method: "POST",
      accessToken: token,
      body: next,
    });
  };

  const toggleStoredPreview = (track: WeddingWaitingTrack) => {
    const node = storedAudioRef.current;
    if (!node || !track.src) return;
    if (previewingId === track.id && !node.paused) {
      node.pause();
      setPreviewingId(null);
      return;
    }
    node.src = track.src;
    node.volume = 0.6;
    void node.play().then(() => setPreviewingId(track.id)).catch(() => setPreviewingId(null));
  };

  return (
    <section className="hamd-wedding-waiting-music" aria-label="Waiting Music">
      <header className="hamd-wedding-waiting-music__header">
        <div>
          <h2>Waiting Music</h2>
          <p>Approved audio for the guest waiting room. Playback stops when the live celebration begins.</p>
        </div>
        <button
          type="button"
          className="hamd-btn hamd-btn--primary"
          onClick={() => {
            if (composer) closeComposer();
            else setComposer(true);
          }}
        >
          {composer ? "Close" : "Add Track"}
        </button>
      </header>

      {error ? <OpsAlert>{error}</OpsAlert> : null}

      {composer ? (
        <div className="hamd-wedding-waiting-music__composer">
          <label className="hamd-btn hamd-btn--secondary" htmlFor={inputId}>
            Choose audio file
          </label>
          <input
            id={inputId}
            ref={fileRef}
            className="hamd-sr-only"
            type="file"
            accept={WEDDING_WAITING_AUDIO_ACCEPT}
            onChange={(event) => {
              selectFile(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
          {pending ? (
            <div className="hamd-wedding-waiting-music__pending">
              <p>
                <strong>{pending.file.name}</strong>
                <span>
                  {formatWeddingFileSize(pending.file.size)}
                  {pending.durationSeconds != null
                    ? ` · ${formatWeddingAudioDuration(pending.durationSeconds)}`
                    : ""}
                </span>
              </p>
              <audio
                ref={previewAudioRef}
                src={pending.previewUrl}
                preload="metadata"
                onLoadedMetadata={(event) => {
                  const duration = event.currentTarget.duration;
                  if (Number.isFinite(duration)) {
                    setPending((current) =>
                      current ? { ...current, durationSeconds: duration } : current,
                    );
                  }
                }}
                onPlay={() => setPendingPlaying(true)}
                onPause={() => setPendingPlaying(false)}
              />
              <div className="hamd-wedding-waiting-music__preview-controls">
                <button
                  type="button"
                  className="hamd-btn hamd-btn--secondary"
                  onClick={() => {
                    const node = previewAudioRef.current;
                    if (!node) return;
                    if (node.paused) void node.play();
                    else node.pause();
                  }}
                >
                  {pendingPlaying ? "Pause" : "Play"}
                </button>
                <label>
                  Seek
                  <input
                    type="range"
                    min={0}
                    max={Math.max(pending.durationSeconds ?? 0, 1)}
                    step={0.1}
                    defaultValue={0}
                    aria-label="Seek preview"
                    onChange={(event) => {
                      const node = previewAudioRef.current;
                      if (node) node.currentTime = Number(event.target.value);
                    }}
                  />
                </label>
                <label>
                  Volume
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    defaultValue={0.6}
                    aria-label="Preview volume"
                    onChange={(event) => {
                      const node = previewAudioRef.current;
                      if (node) node.volume = Number(event.target.value);
                    }}
                  />
                </label>
              </div>
              <label className="hamd-entity-field">
                Title
                <input
                  value={pending.title}
                  onChange={(event) =>
                    setPending((current) =>
                      current ? { ...current, title: event.target.value } : current,
                    )
                  }
                />
              </label>
              <label className="hamd-entity-field">
                Caption
                <input
                  value={pending.caption}
                  onChange={(event) =>
                    setPending((current) =>
                      current ? { ...current, caption: event.target.value } : current,
                    )
                  }
                />
              </label>
              <div className="hamd-entity-form__actions">
                <button
                  type="button"
                  className="hamd-btn hamd-btn--primary"
                  disabled={busy}
                  onClick={() => void uploadPending()}
                >
                  Upload Track
                </button>
                <button type="button" className="hamd-btn hamd-btn--ghost" onClick={revokePending}>
                  Remove file
                </button>
              </div>
            </div>
          ) : (
            <p>Select an MP3 or M4A file to preview it before upload.</p>
          )}
        </div>
      ) : null}

      {tracks.length === 0 && !pending && !composer ? (
        <div className="hamd-wedding-waiting-music__empty">
          <p>No waiting music has been added. Add approved audio to create the pre-event atmosphere.</p>
          {!composer ? (
            <button type="button" className="hamd-btn hamd-btn--primary" onClick={() => setComposer(true)}>
              Add Track
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="hamd-wedding-waiting-music__list" aria-label="Waiting music playlist">
          {tracks.map((track, index) => (
            <li key={track.id} className="hamd-wedding-waiting-music__row">
              <div className="hamd-wedding-waiting-music__order">
                <button
                  type="button"
                  className="hamd-btn hamd-btn--ghost"
                  disabled={index === 0}
                  aria-label={`Move ${track.title} up`}
                  onClick={() => void moveTrack(track.id, -1)}
                >
                  Move Up
                </button>
                <button
                  type="button"
                  className="hamd-btn hamd-btn--ghost"
                  disabled={index === tracks.length - 1}
                  aria-label={`Move ${track.title} down`}
                  onClick={() => void moveTrack(track.id, 1)}
                >
                  Move Down
                </button>
              </div>
              <div className="hamd-wedding-waiting-music__meta">
                {editingId === track.id ? (
                  <>
                    <label className="hamd-entity-field">
                      Title
                      <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
                    </label>
                    <label className="hamd-entity-field">
                      Caption
                      <input value={editCaption} onChange={(event) => setEditCaption(event.target.value)} />
                    </label>
                  </>
                ) : (
                  <>
                    <strong>{track.title}</strong>
                    <p>
                      {formatWeddingAudioDuration(track.durationSeconds)} · {formatWeddingFileSize(track.fileSize)} ·{" "}
                      {track.isEnabled ? "Enabled" : "Disabled"}
                    </p>
                  </>
                )}
              </div>
              <div className="hamd-wedding-waiting-music__actions">
                <label>
                  <input
                    type="checkbox"
                    checked={track.isEnabled}
                    onChange={(event) => {
                      void patchTrack(track.id, { isEnabled: event.target.checked });
                    }}
                  />{" "}
                  Enabled
                </label>
                <button
                  type="button"
                  className="hamd-btn hamd-btn--ghost"
                  onClick={() => toggleStoredPreview(track)}
                >
                  {previewingId === track.id ? "Stop preview" : "Play"}
                </button>
                {editingId === track.id ? (
                  <button
                    type="button"
                    className="hamd-btn hamd-btn--secondary"
                    onClick={() => {
                      void patchTrack(track.id, { title: editTitle, caption: editCaption });
                      setEditingId(null);
                    }}
                  >
                    Save
                  </button>
                ) : (
                  <button
                    type="button"
                    className="hamd-btn hamd-btn--ghost"
                    onClick={() => {
                      setEditingId(track.id);
                      setEditTitle(track.title);
                      setEditCaption(track.caption ?? "");
                    }}
                  >
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  className="hamd-btn hamd-btn--ghost"
                  onClick={() => setRemoveId(track.id)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <audio
        ref={storedAudioRef}
        preload="none"
        onEnded={() => setPreviewingId(null)}
        aria-hidden="true"
      />

      <div className="hamd-wedding-waiting-music__config">
        <label>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => void setConfig({ enabled: event.target.checked })}
          />{" "}
          Enable waiting music
        </label>
        <label>
          <input
            type="checkbox"
            checked={loop}
            onChange={(event) => void setConfig({ loop: event.target.checked })}
          />{" "}
          Loop playlist
        </label>
        <p>MP3 and M4A/AAC · Maximum {formatWeddingFileSize(WEDDING_WAITING_AUDIO_MAX_BYTES)} per track.</p>
      </div>

      <ConfirmationDialog
        open={Boolean(removeId)}
        title="Remove waiting track?"
        tone="danger"
        confirmLabel="Remove"
        cancelLabel="Keep"
        busy={busy}
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId) void deleteTrack(removeId);
        }}
      >
        This deletes the audio file from storage and removes it from the waiting playlist.
      </ConfirmationDialog>
    </section>
  );
}
