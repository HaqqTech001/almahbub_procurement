import { apiServiceName, apiVersion } from "@hamd/contracts";
import { Router } from "express";

import type { Environment } from "../config/env.js";
import type { ReadinessDependencies } from "../composition/dependencies.js";

export function createHealthRouter(
  environment: Environment,
  dependencies: ReadinessDependencies = {},
): Router {
  const router = Router();

  router.get("/live", (_request, response) => {
    response.status(200).json({
      data: {
        status: "ok",
        service: apiServiceName,
        version: apiVersion,
      },
    });
  });

  router.get("/ready", async (_request, response) => {
    const [database, redis] = await Promise.all([
      probeDependency(dependencies.database),
      probeDependency(dependencies.redis),
    ]);
    const isReady = database !== "unavailable" && redis !== "unavailable";

    response.status(isReady ? 200 : 503).json({
      data: {
        status: isReady ? "ready" : "not-ready",
        service: apiServiceName,
        environment: environment.NODE_ENV,
        dependencies: { database, redis },
      },
    });
  });

  return router;
}

async function probeDependency(
  probe: (() => Promise<void>) | undefined,
): Promise<"ready" | "not-configured" | "unavailable"> {
  if (!probe) {
    return "not-configured";
  }

  try {
    await probe();
    return "ready";
  } catch {
    return "unavailable";
  }
}
