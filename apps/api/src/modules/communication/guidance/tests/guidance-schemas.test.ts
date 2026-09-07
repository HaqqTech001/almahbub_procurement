import { describe, expect, it } from "vitest";
import {
  createTourSchema,
  updatePreferenceSchema,
  upsertProgressSchema,
} from "../api/guidance-schemas.js";

describe("guidance schemas", () => {
  it("accepts preference updates", () => {
    expect(updatePreferenceSchema.parse({ mode: "training" })).toEqual({
      mode: "training",
    });
    expect(() => updatePreferenceSchema.parse({})).toThrow();
  });

  it("validates progress upserts", () => {
    const tourId = "0193e0a0-0000-7000-8000-000000000001";
    expect(
      upsertProgressSchema.parse({
        tourId,
        status: "completed",
        completedSteps: 3,
        totalSteps: 3,
      }),
    ).toMatchObject({ status: "completed" });
  });

  it("requires steps for tour creation", () => {
    expect(() =>
      createTourSchema.parse({
        key: "dashboard",
        title: "Dashboard",
        audience: "client_workspace",
        pageKey: "dashboard",
        steps: [],
      }),
    ).toThrow();
    expect(
      createTourSchema.parse({
        key: "dashboard",
        title: "Dashboard",
        audience: "client_workspace",
        pageKey: "dashboard",
        steps: [{ stepKey: "intro", title: "Hi", body: "Welcome" }],
      }).steps,
    ).toHaveLength(1);
  });
});
