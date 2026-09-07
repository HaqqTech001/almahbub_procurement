import { describe, expect, it } from "vitest";

import {
  DEFAULT_WEDDING_CAMPAIGN,
  deriveWeddingModalEndsAt,
  formatWeddingFileSize,
  formatWeddingWhen,
  isUsableTermiiSenderId,
  isWeddingModalEligible,
  normalizeWeddingSmsPhone,
  shouldRequestWeddingLiveToken,
  validateWeddingGalleryFile,
  validateWeddingWaitingAudioFile,
  nextWeddingWaitingTrackIndex,
  recoverWeddingWaitingTrackIndex,
  shouldPlayWeddingWaitingMusic,
  formatWeddingAudioDuration,
  WEDDING_WAITING_AUDIO_MAX_BYTES,
  weddingModalActions,
  weddingModalDismissKey,
} from "./wedding-campaign.js";

describe("wedding campaign eligibility", () => {
  it("shows the modal inside the configured window", () => {
    expect(
      isWeddingModalEligible(
        DEFAULT_WEDDING_CAMPAIGN,
        new Date("2026-09-15T12:00:00+01:00"),
      ),
    ).toBe(true);
  });

  it("stops the modal after modalEndsAt (three days after eventAt)", () => {
    const ends = Date.parse(DEFAULT_WEDDING_CAMPAIGN.modalEndsAt);
    const event = Date.parse(DEFAULT_WEDDING_CAMPAIGN.eventAt);
    expect(ends - event).toBe(3 * 24 * 60 * 60 * 1000);
    expect(
      isWeddingModalEligible(
        DEFAULT_WEDDING_CAMPAIGN,
        new Date(ends + 1000),
      ),
    ).toBe(false);
  });

  it("does not show when ops disables the modal", () => {
    expect(
      isWeddingModalEligible(
        { ...DEFAULT_WEDDING_CAMPAIGN, modalEnabled: false },
        new Date("2026-09-15T12:00:00+01:00"),
      ),
    ).toBe(false);
  });

  it("uses Join Live before live and Join Live Now when live", () => {
    const upcoming = weddingModalActions(DEFAULT_WEDDING_CAMPAIGN);
    expect(upcoming.primary.label).toBe("View Wedding");
    expect(upcoming.primary.href).toBe("/rowdotul-hamd-26");
    expect(upcoming.secondary?.label).toBe("Join Live");
    const live = weddingModalActions({
      ...DEFAULT_WEDDING_CAMPAIGN,
      streamStatus: "live",
    });
    expect(live.primary.label).toBe("Join Live Now");
    expect(live.secondary).toBeUndefined();
    const testLive = weddingModalActions({
      ...DEFAULT_WEDDING_CAMPAIGN,
      streamStatus: "live",
      liveMode: "test",
    });
    expect(testLive.primary.label).toBe("View Wedding");
  });

  it("uses gallery CTA after the stream ends", () => {
    const ended = weddingModalActions({
      ...DEFAULT_WEDDING_CAMPAIGN,
      streamStatus: "ended",
    });
    expect(ended.primary.label).toBe("View Gallery");
  });

  it("normalizes Nigerian SMS numbers and validates Termii sender length", () => {
    expect(normalizeWeddingSmsPhone("08012345678")).toBe("+2348012345678");
    expect(normalizeWeddingSmsPhone("+2348012345678")).toBe("+2348012345678");
    expect(isUsableTermiiSenderId("ALMAHBUB")).toBe(true);
    expect(isUsableTermiiSenderId("Wakasafe NG")).toBe(true);
    expect(isUsableTermiiSenderId("AB")).toBe(false);
    expect(weddingModalDismissKey(DEFAULT_WEDDING_CAMPAIGN.id)).toContain(
      DEFAULT_WEDDING_CAMPAIGN.id,
    );
  });

  it("derives modal expiry from the event date once", () => {
    expect(deriveWeddingModalEndsAt("2026-09-29")).toBe(
      DEFAULT_WEDDING_CAMPAIGN.modalEndsAt,
    );
  });

  it("formats a date-only event without inventing a time", () => {
    expect(DEFAULT_WEDDING_CAMPAIGN.eventAt).toBe("2026-09-29");
    expect(DEFAULT_WEDDING_CAMPAIGN.eventAt.includes("T")).toBe(false);
    expect(formatWeddingWhen(DEFAULT_WEDDING_CAMPAIGN.eventAt)).toBe("29 September 2026");
  });

  it("does not mint a live token on every render or after a known outage", () => {
    expect(
      shouldRequestWeddingLiveToken({
        streamIsLive: true,
        configured: true,
        requestInFlight: false,
        alreadyConnected: false,
        unavailable: false,
      }),
    ).toBe(true);
    expect(
      shouldRequestWeddingLiveToken({
        streamIsLive: true,
        configured: true,
        requestInFlight: true,
        alreadyConnected: false,
        unavailable: false,
      }),
    ).toBe(false);
    expect(
      shouldRequestWeddingLiveToken({
        streamIsLive: true,
        configured: true,
        requestInFlight: false,
        alreadyConnected: true,
        unavailable: false,
      }),
    ).toBe(false);
    expect(
      shouldRequestWeddingLiveToken({
        streamIsLive: true,
        configured: false,
        requestInFlight: false,
        alreadyConnected: false,
        unavailable: false,
      }),
    ).toBe(false);
    expect(
      shouldRequestWeddingLiveToken({
        streamIsLive: true,
        configured: true,
        requestInFlight: false,
        alreadyConnected: false,
        unavailable: true,
      }),
    ).toBe(false);
  });

  it("validates wedding gallery files and formats sizes for operators", () => {
    expect(formatWeddingFileSize(8_808_038)).toBe("8.4 MB");
    expect(
      validateWeddingGalleryFile({ size: 10 * 1024 * 1024 + 1, type: "image/jpeg" }),
    ).toBe("This file is larger than the 10 MB upload limit.");
    expect(validateWeddingGalleryFile({ size: 12, type: "application/pdf" })).toMatch(/JPEG/i);
    expect(validateWeddingGalleryFile({ size: 12, type: "image/jpeg" })).toBeNull();
    expect(validateWeddingGalleryFile({ size: 12, type: "video/mp4" })).toBeNull();
  });

  it("validates waiting-room audio as MP3 or M4A under 25 MB", () => {
    expect(
      validateWeddingWaitingAudioFile({ size: WEDDING_WAITING_AUDIO_MAX_BYTES + 1, type: "audio/mpeg" }),
    ).toMatch(/25 MB/);
    expect(validateWeddingWaitingAudioFile({ size: 12, type: "audio/wav" })).toMatch(/MP3 or M4A/i);
    expect(validateWeddingWaitingAudioFile({ size: 12, type: "audio/ogg" })).toMatch(/MP3 or M4A/i);
    expect(validateWeddingWaitingAudioFile({ size: 12, type: "audio/mpeg" })).toBeNull();
    expect(validateWeddingWaitingAudioFile({ size: 12, type: "audio/mp4", name: "dua.m4a" })).toBeNull();
    expect(validateWeddingWaitingAudioFile({ size: 12, type: "", name: "nasheed.mp3" })).toBeNull();
  });

  it("plays enabled tracks in order, loops, and skips failed or disabled rows", () => {
    const tracks = [
      { id: "a", isEnabled: true, position: 0 },
      { id: "b", isEnabled: false, position: 1 },
      { id: "c", isEnabled: true, position: 2 },
    ];
    expect(nextWeddingWaitingTrackIndex(tracks, 0, { loop: true })).toBe(2);
    expect(nextWeddingWaitingTrackIndex(tracks, 2, { loop: true })).toBe(0);
    expect(nextWeddingWaitingTrackIndex(tracks, 2, { loop: false })).toBe(-1);
    expect(nextWeddingWaitingTrackIndex(tracks, 0, { loop: true, failedIds: new Set(["c"]) })).toBe(0);
    expect(recoverWeddingWaitingTrackIndex(tracks, "missing", { previousPosition: 1 })).toBe(2);
    expect(shouldPlayWeddingWaitingMusic({ streamStatus: "upcoming" })).toBe(true);
    expect(shouldPlayWeddingWaitingMusic({ streamStatus: "live" })).toBe(false);
    expect(shouldPlayWeddingWaitingMusic({ streamStatus: "ended" })).toBe(false);
    expect(formatWeddingAudioDuration(125)).toBe("2:05");
  });
});
