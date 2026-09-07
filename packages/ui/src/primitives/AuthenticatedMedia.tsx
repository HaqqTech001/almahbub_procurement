import { useEffect, useState } from "react";
import { cx } from "../utils/cx.js";

export type AuthenticatedMediaProps = {
  src: string;
  alt?: string | undefined;
  className?: string | undefined;
  getAccessToken?: (() => Promise<string | null>) | undefined;
  onOpen?: (() => void) | undefined;
};

/**
 * Loads private media with an access token. Plain img tags cannot send Authorization.
 */
export function AuthenticatedMedia({
  src,
  alt = "",
  className,
  getAccessToken,
  onOpen,
}: AuthenticatedMediaProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;
    setFailed(false);
    if (!getAccessToken) {
      setObjectUrl(src);
      return;
    }
    void (async () => {
      try {
        const token = await getAccessToken();
        const response = await fetch(src, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        });
        if (!response.ok) throw new Error("media");
        const blob = await response.blob();
        if (cancelled) return;
        revoked = URL.createObjectURL(blob);
        setObjectUrl(revoked);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [getAccessToken, src]);

  if (failed || !objectUrl) {
    return (
      <button
        type="button"
        className={cx("hamd-auth-media", "hamd-auth-media--empty", className)}
        onClick={onOpen}
        disabled={!onOpen}
      >
        Media unavailable
      </button>
    );
  }

  if (onOpen) {
    return (
      <button type="button" className={cx("hamd-auth-media", className)} onClick={onOpen}>
        <img src={objectUrl} alt={alt} />
      </button>
    );
  }

  return <img className={className} src={objectUrl} alt={alt} />;
}

export type AttachmentBoardFile = {
  id: string;
  name: string;
  href?: string | undefined;
  previewUrl?: string | undefined;
  mimeType?: string | null | undefined;
  kind?: string | null | undefined;
  sizeBytes?: number | null | undefined;
  sizeLabel?: string | null | undefined;
  uploadedAt?: string | null | undefined;
};

export type AttachmentBoardProps = {
  files: readonly AttachmentBoardFile[];
  mediaTitle?: string | undefined;
  documentsTitle?: string | undefined;
  emptyLabel?: string | undefined;
  compact?: boolean | undefined;
  onRemove?: ((id: string) => void) | undefined;
  getAccessToken?: (() => Promise<string | null>) | undefined;
};

export function AttachmentBoard({
  files,
  emptyLabel = "No attachments.",
  onRemove,
}: AttachmentBoardProps) {
  if (files.length === 0) {
    return emptyLabel ? <p className="hamd-attachment-board__empty">{emptyLabel}</p> : null;
  }
  return (
    <ul className="hamd-attachment-board">
      {files.map((file) => {
        const href = file.previewUrl || file.href;
        return (
          <li key={file.id}>
            {href ? (
              <a href={href} target="_blank" rel="noreferrer">
                {file.name}
              </a>
            ) : (
              <span>{file.name}</span>
            )}
            {onRemove ? (
              <button type="button" onClick={() => onRemove(file.id)}>
                Remove
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
