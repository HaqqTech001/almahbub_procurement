import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { ConfirmationDialog, MediaLightbox, type MediaLightboxItem } from "@hamd/ui/primitives";
import {
  WEDDING_GALLERY_ACCEPT,
  WEDDING_GALLERY_MAX_BYTES,
  formatWeddingFileSize,
  validateWeddingGalleryFile,
  weddingGalleryKindFromMime,
} from "@hamd/constants";

import { OpsAlert } from "../../components/OpsChrome.js";
import { opsFetch } from "../../lib/ops-fetch.js";

export type WeddingOpsGalleryItem = {
  id: string;
  kind: string;
  src?: string;
  title: string;
  caption: string;
  featured: boolean;
  downloadable: boolean;
};

type PendingItem = {
  id: string;
  file: File;
  previewUrl: string;
  kind: "image" | "video";
  caption: string;
  status: "ready" | "uploading" | "uploaded" | "failed";
  persisted?: WeddingOpsGalleryItem;
};

type Props = {
  items: WeddingOpsGalleryItem[];
  accessToken: () => Promise<string>;
  onItems: (items: WeddingOpsGalleryItem[]) => void;
};

function statusLabel(status: PendingItem["status"]): string {
  if (status === "uploading") return "Uploading";
  if (status === "uploaded") return "Uploaded";
  if (status === "failed") return "Failed";
  return "Ready";
}

export function WeddingGalleryPanel({ items, accessToken, onItems }: Props) {
  const inputId = useId();
  const [composer, setComposer] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ items: MediaLightboxItem[]; index: number } | null>(
    null,
  );
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [captions, setCaptions] = useState<Record<string, string>>({});

  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    return () => {
      for (const item of pendingRef.current) {
        if (!item.persisted) URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, []);

  const addFiles = (files: File[]) => {
    setNotice(null);
    const next: PendingItem[] = [];
    for (const file of files) {
      const invalid = validateWeddingGalleryFile(file);
      if (invalid) {
        setNotice(invalid);
        continue;
      }
      const kind = weddingGalleryKindFromMime(file.type);
      if (!kind) continue;
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        kind,
        caption: "",
        status: "ready",
      });
    }
    if (next.length) {
      setComposer(true);
      setPending((current) => [...current, ...next]);
    }
  };

  const removePending = (id: string) => {
    setPending((current) => {
      const row = current.find((item) => item.id === id);
      if (row && !row.persisted) URL.revokeObjectURL(row.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  };

  const uploadOne = async (item: PendingItem) => {
    setPending((current) =>
      current.map((row) => (row.id === item.id ? { ...row, status: "uploading" } : row)),
    );
    try {
      const access = await accessToken();
      const form = new FormData();
      form.append("files", item.file);
      const saved = await opsFetch<WeddingOpsGalleryItem>("/wedding/gallery", {
        method: "POST",
        accessToken: access,
        form,
      });
      if (item.caption.trim()) {
        await opsFetch<WeddingOpsGalleryItem>(`/wedding/gallery/${saved.id}`, {
          method: "PATCH",
          accessToken: access,
          body: { caption: item.caption.trim(), title: item.caption.trim() },
        });
        saved.caption = item.caption.trim();
        saved.title = item.caption.trim();
      }
      URL.revokeObjectURL(item.previewUrl);
      setPending((current) => current.filter((row) => row.id !== item.id));
      onItems([...itemsRef.current.filter((row) => row.id !== saved.id), { ...saved, src: saved.src }]);
    } catch {
      setPending((current) =>
        current.map((row) => (row.id === item.id ? { ...row, status: "failed" } : row)),
      );
    }
  };

  const uploadReady = async () => {
    const queue = pending.filter((item) => item.status === "ready" || item.status === "failed");
    for (const item of queue) {
      await uploadOne(item);
    }
  };

  const patchItem = async (id: string, body: Partial<WeddingOpsGalleryItem>) => {
    setBusyId(id);
    try {
      const access = await accessToken();
      const saved = await opsFetch<WeddingOpsGalleryItem>(`/wedding/gallery/${id}`, {
        method: "PATCH",
        accessToken: access,
        body,
      });
      onItems(items.map((row) => (row.id === id ? { ...row, ...saved } : row)));
    } finally {
      setBusyId(null);
    }
  };

  const deleteItem = async (id: string) => {
    setBusyId(id);
    try {
      const access = await accessToken();
      await opsFetch(`/wedding/gallery/${id}`, { method: "DELETE", accessToken: access });
      onItems(items.filter((row) => row.id !== id));
    } finally {
      setBusyId(null);
      setRemoveId(null);
    }
  };

  const persistedLightbox = items
    .filter((item) => item.src)
    .map((item) => ({
      src: item.src as string,
      kind: item.kind === "video" ? ("video" as const) : ("image" as const),
      caption: item.caption || item.title,
      alt: item.title,
    }));

  return (
    <section className="hamd-wedding-gallery">
      <header className="hamd-wedding-gallery__header">
        <div>
          <h2>Wedding Gallery</h2>
          <p>Guest-facing celebration media. Preview every file before it is uploaded.</p>
        </div>
        <button
          type="button"
          className="hamd-btn hamd-btn--primary"
          onClick={() => setComposer((open) => !open)}
        >
          {composer ? "Close" : "Add Media"}
        </button>
      </header>
      {notice ? <OpsAlert>{notice}</OpsAlert> : null}

      {composer ? (
        <div
          className={dragOver ? "hamd-entity-dropzone is-drag" : "hamd-entity-dropzone"}
          onDragOver={(event: DragEvent) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event: DragEvent) => {
            event.preventDefault();
            setDragOver(false);
            addFiles(Array.from(event.dataTransfer.files ?? []));
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 16V6m0 0l-4 4m4-4l4 4M5 18h14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <strong>Drag wedding photos or videos here</strong>
          <p>or</p>
          <label className="hamd-btn hamd-btn--secondary" htmlFor={inputId}>
            Browse files
          </label>
          <small>
            Images and MP4 videos · Maximum {formatWeddingFileSize(WEDDING_GALLERY_MAX_BYTES)} per
            file
          </small>
          <input
            id={inputId}
            className="hamd-sr-only"
            type="file"
            multiple
            accept={WEDDING_GALLERY_ACCEPT}
            onChange={(event) => {
              addFiles(Array.from(event.target.files ?? []));
              event.currentTarget.value = "";
            }}
          />
        </div>
      ) : null}

      {pending.length > 0 ? (
        <>
          <ul className="hamd-wedding-gallery-grid" aria-label="Selected media before upload">
            {pending.map((item) => (
              <li key={item.id} className="hamd-wedding-gallery-tile">
                <div className="hamd-wedding-gallery-tile__frame">
                  {item.kind === "video" ? (
                    <video src={item.previewUrl} controls playsInline preload="metadata" muted />
                  ) : (
                    <button
                      type="button"
                      className="hamd-wedding-gallery-tile__open"
                      aria-label="Preview image"
                      onClick={() =>
                        setLightbox({
                          items: [{ src: item.previewUrl, kind: "image", alt: item.file.name }],
                          index: 0,
                        })
                      }
                    >
                      <img src={item.previewUrl} alt="Selected image preview" />
                    </button>
                  )}
                </div>
                <div className="hamd-wedding-gallery-tile__meta">
                  <p>
                    {item.kind === "video" ? "Video" : "Image"} · {formatWeddingFileSize(item.file.size)}{" "}
                    · {statusLabel(item.status)}
                  </p>
                  <label>
                    Optional caption
                    <input
                      value={item.caption}
                      disabled={item.status === "uploading" || item.status === "uploaded"}
                      onChange={(event) =>
                        setPending((current) =>
                          current.map((row) =>
                            row.id === item.id ? { ...row, caption: event.target.value } : row,
                          ),
                        )
                      }
                    />
                  </label>
                  {item.status === "failed" ? (
                    <p className="hamd-wedding-gallery-tile__error" role="alert">
                      Upload failed. Try again.
                    </p>
                  ) : null}
                  <div className="hamd-wedding-gallery-tile__actions">
                    {item.status === "failed" ? (
                      <button
                        type="button"
                        className="hamd-btn hamd-btn--secondary"
                        onClick={() => void uploadOne(item)}
                      >
                        Retry
                      </button>
                    ) : null}
                    {item.status !== "uploaded" ? (
                      <button
                        type="button"
                        className="hamd-btn hamd-btn--ghost"
                        onClick={() => removePending(item.id)}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {pending.some((item) => item.status === "ready" || item.status === "failed") ? (
            <button type="button" className="hamd-btn hamd-btn--primary" onClick={() => void uploadReady()}>
              Upload selected media
            </button>
          ) : null}
        </>
      ) : null}

      <ul className="hamd-wedding-gallery-grid" aria-label="Uploaded wedding gallery">
        {items.map((item) => (
          <li key={item.id} className="hamd-wedding-gallery-tile">
            <div className="hamd-wedding-gallery-tile__frame">
              {item.kind === "video" && item.src ? (
                <video src={item.src} controls playsInline preload="metadata" muted />
              ) : item.src ? (
                <button
                  type="button"
                  className="hamd-wedding-gallery-tile__open"
                  aria-label={`Preview ${item.title}`}
                  onClick={() => {
                    const visible = items.filter((row) => row.src);
                    const nextIndex = Math.max(
                      0,
                      visible.findIndex((row) => row.id === item.id),
                    );
                    setLightbox({ items: persistedLightbox, index: nextIndex });
                  }}
                >
                  <img src={item.src} alt={item.title} />
                </button>
              ) : (
                <p>{item.kind}</p>
              )}
            </div>
            <div className="hamd-wedding-gallery-tile__meta">
              <strong>{item.title}</strong>
              <p>
                {item.kind === "video" ? "Video" : "Image"}
                {item.featured ? " · Featured" : ""}
                {item.downloadable ? " · downloadable" : " · not downloadable"}
              </p>
              <label>
                Caption
                <input
                  value={captions[item.id] ?? item.caption}
                  onChange={(event) =>
                    setCaptions((current) => ({ ...current, [item.id]: event.target.value }))
                  }
                />
              </label>
              <div className="hamd-wedding-gallery-tile__actions">
                <button
                  type="button"
                  className="hamd-btn hamd-btn--ghost"
                  onClick={() => {
                    const visible = items.filter((row) => row.src);
                    const nextIndex = Math.max(
                      0,
                      visible.findIndex((row) => row.id === item.id),
                    );
                    setLightbox({ items: persistedLightbox, index: nextIndex });
                  }}
                >
                  Preview
                </button>
                <button
                  type="button"
                  className="hamd-btn hamd-btn--ghost"
                  disabled={busyId === item.id}
                  onClick={() =>
                    void patchItem(item.id, { caption: captions[item.id] ?? item.caption })
                  }
                >
                  Save caption
                </button>
                <button
                  type="button"
                  className="hamd-btn hamd-btn--ghost"
                  disabled={busyId === item.id}
                  onClick={() => void patchItem(item.id, { featured: !item.featured })}
                >
                  {item.featured ? "Unfeature" : "Feature"}
                </button>
                <button
                  type="button"
                  className="hamd-btn hamd-btn--ghost"
                  disabled={busyId === item.id}
                  onClick={() => void patchItem(item.id, { downloadable: !item.downloadable })}
                >
                  {item.downloadable ? "Disable download" : "Allow download"}
                </button>
                <button
                  type="button"
                  className="hamd-btn hamd-btn--ghost"
                  disabled={busyId === item.id}
                  onClick={() => setRemoveId(item.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <MediaLightbox
        open={Boolean(lightbox)}
        items={lightbox?.items ?? []}
        index={lightbox?.index ?? 0}
        onClose={() => setLightbox(null)}
        onIndexChange={(next) =>
          setLightbox((current) => (current ? { ...current, index: next } : current))
        }
      />
      <ConfirmationDialog
        open={Boolean(removeId)}
        title="Remove gallery item?"
        tone="danger"
        confirmLabel="Remove"
        cancelLabel="Keep"
        busy={Boolean(busyId)}
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId) void deleteItem(removeId);
        }}
      >
        This removes the file from the wedding gallery.
      </ConfirmationDialog>
    </section>
  );
}
