import { AuthenticatedMedia } from "../primitives/AuthenticatedMedia.js";

type AttachmentFile = {
  id: string;
  name: string;
  href?: string | undefined;
  previewUrl?: string | undefined;
  mimeType?: string | null | undefined;
  kind?: string | null | undefined;
};

export function MediaTile({
  file,
  getAccessToken,
  onOpen,
}: {
  file: AttachmentFile;
  getAccessToken?: (() => Promise<string | null>) | undefined;
  onOpen: () => void;
}) {
  const src = file.previewUrl?.trim() || file.href?.trim();
  if (!src) {
    return (
      <button type="button" className="hamd-media-tile hamd-media-tile--empty" onClick={onOpen}>
        {file.name}
      </button>
    );
  }
  const mime = (file.mimeType ?? "").toLowerCase();
  const kind = (file.kind ?? "").toLowerCase();
  const isVideo =
    mime.startsWith("video/") || kind.includes("video") || /\.(mp4|webm|mov)(\?|$)/i.test(file.name);
  if (isVideo) {
    return (
      <button type="button" className="hamd-media-tile" onClick={onOpen} aria-label={`Open ${file.name}`}>
        <video src={src} muted playsInline preload="metadata" />
      </button>
    );
  }
  return (
    <AuthenticatedMedia
      src={src}
      alt={file.name}
      className="hamd-media-tile"
      getAccessToken={getAccessToken}
      onOpen={onOpen}
    />
  );
}
