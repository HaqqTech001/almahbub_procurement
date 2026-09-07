export type StoppableTrack = { stop: () => void };

export type DisconnectableRoom = {
  disconnect: (stopTracks?: boolean) => void | Promise<void>;
};

export function stopMediaStream(stream: MediaStream | null | undefined): void {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

export function stopOwnedTracks(tracks: readonly StoppableTrack[]): void {
  for (const track of tracks) {
    track.stop();
  }
}

export async function disconnectWeddingHostRoom(
  room: DisconnectableRoom | null,
): Promise<void> {
  if (!room) return;
  await room.disconnect(true);
}

export function clearPreviewElement(node: HTMLVideoElement | null): void {
  if (!node) return;
  const stream = node.srcObject;
  if (stream && typeof stream === "object" && "getTracks" in stream) {
    stopMediaStream(stream as MediaStream);
  }
  node.srcObject = null;
}
