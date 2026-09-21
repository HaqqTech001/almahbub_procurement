import { useEffect, useState } from "react";
import { cx } from "../utils/cx.js";
import { fetchAuthenticatedMedia, isPrivateDocument } from "../auth/media-request.js";
import { openAuthenticatedResource } from "../media/open-authenticated-resource.js";
import { safeErrorMessage } from "../auth/user-facing-error.js";

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
    if (!isPrivateDocument(src)) {
      setObjectUrl(src);
      return;
    }
    void (async () => {
      try {
        const response = await fetchAuthenticatedMedia(src);
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
      <button type="button" className={cx("hamd-auth-media", className)} onClick={onOpen} aria-label={alt}>
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
  onOpen?: ((file: AttachmentBoardFile) => void | Promise<void>) | undefined;
};

export function AttachmentBoard({
  files,
  emptyLabel = "No attachments.",
  onRemove,
  onOpen,
  getAccessToken,
}: AttachmentBoardProps) {
  const [error, setError] = useState<string | null>(null);
  const open = async (file: AttachmentBoardFile) => {
    setError(null);
    try {
      if (onOpen) await onOpen(file);
      else if (file.previewUrl || file.href) await openAuthenticatedResource(file.previewUrl || file.href!, getAccessToken);
    } catch (error) { setError(error instanceof Error ? safeErrorMessage(error.message) : "We couldn't open this file. Please try again."); }
  };
  if (files.length === 0) {
    return emptyLabel ? <p className="hamd-attachment-board__empty">{emptyLabel}</p> : null;
  }
  return (
    <div><ul className="hamd-attachment-board">
      {files.map((file) => {
        const href = file.previewUrl || file.href;
        return (
          <li key={file.id}>
            {href && (file.kind === "image" || file.mimeType?.startsWith("image/")) ? (
              <AuthenticatedMedia src={href} alt={`Image preview: ${file.name}`} onOpen={() => void open(file)} />
            ) : href ? (
              <button type="button" onClick={() => void open(file)}>
                {file.name}
              </button>
            ) : (
              <span aria-label={file.kind === "audio" ? "Audio placeholder" : file.kind === "video" ? "Video placeholder" : undefined}>{file.name}</span>
            )}
            {file.sizeLabel ? <small>{file.sizeLabel}</small> : file.sizeBytes ? <small>{Math.ceil(file.sizeBytes / 1024)} KB</small> : null}
            {onRemove ? (
              <button type="button" onClick={() => onRemove(file.id)}>
                Remove
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>{error ? <p role="alert">{error}</p> : null}</div>
  );
}
