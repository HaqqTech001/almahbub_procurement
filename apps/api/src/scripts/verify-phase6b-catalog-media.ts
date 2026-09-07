/**
 * Phase 6B catalogue media persistence check.
 * Creates a temporary product, uploads an image, publishes, then serves the
 * same file from a new process. Archives the product afterwards.
 *
 * This proves local-disk process independence. It is NOT production durability.
 */
import "../load-env.js";

import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { join } from "node:path";

import express from "express";

import { parseEnvironment } from "../config/env.js";
import { createCatalogMediaRouter } from "../modules/catalog/api/catalog-media-routes.js";

const apiBase = (process.env.HAMD_API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");
const email = (process.env.HAMD_OPS_E2E_EMAIL ?? "").trim();
const password = process.env.HAMD_OPS_E2E_PASSWORD ?? "";
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

type Envelope<T> = { data?: T; error?: { code?: string; message?: string } };

async function requestJson<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<{ status: number; body: Envelope<T> }> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.token) headers.set("Authorization", `Bearer ${init.token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${apiBase}${path}`, { ...init, headers });
  const body = (await response.json()) as Envelope<T>;
  return { status: response.status, body };
}

async function main(): Promise<void> {
  if (!email || !password) {
    throw new Error("HAMD_OPS_E2E_EMAIL and HAMD_OPS_E2E_PASSWORD are required.");
  }
  const environment = parseEnvironment(process.env);
  const stamp = Date.now();
  const slug = `phase6b-media-${stamp}`;
  const name = `Phase6B Media ${stamp}`;

  const login = await requestJson<{ accessToken: string }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (login.status !== 200 || !login.body.data?.accessToken) {
    throw new Error(`Login failed (${login.status}) ${login.body.error?.message ?? ""}`);
  }
  const token = login.body.data.accessToken;

  const categories = await requestJson<Array<{ id: string; slug: string; status: string }>>(
    "/api/v1/ops/categories?pageSize=100",
    { token },
  );
  const categoryId =
    categories.body.data?.find((row) => row.slug === "medical-equipments" && row.status === "published")
      ?.id ?? categories.body.data?.find((row) => row.status === "published")?.id;
  if (!categoryId) throw new Error("No published category available.");

  const created = await requestJson<{ id: string; status: string }>("/api/v1/ops/products", {
    method: "POST",
    token,
    body: JSON.stringify({
      name,
      slug,
      status: "draft",
      categoryId,
      description: "Temporary Phase 6B media persistence check. Not a production SKU.",
    }),
  });
  const productId = created.body.data?.id;
  if ((created.status !== 201 && created.status !== 200) || !productId) {
    throw new Error(`Create failed (${created.status}) ${JSON.stringify(created.body)}`);
  }

  const form = new FormData();
  form.append("files", new Blob([PNG_1X1], { type: "image/png" }), "phase6b-hero.png");
  const uploaded = await requestJson<{ id: string; url: string }>(
    `/api/v1/ops/products/${productId}/images/upload`,
    { method: "POST", token, body: form },
  );
  const imageUrl = uploaded.body.data?.url;
  const imageId = uploaded.body.data?.id;
  if (uploaded.status !== 201 || !imageUrl || !imageId) {
    throw new Error(`Upload failed (${uploaded.status}) ${JSON.stringify(uploaded.body)}`);
  }

  await requestJson(`/api/v1/ops/products/${productId}/images/${imageId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ altText: "Phase 6B persistence test photo" }),
  });

  const published = await requestJson<{ status: string }>(`/api/v1/ops/products/${productId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ status: "published" }),
  });
  if (published.status !== 200 || published.body.data?.status !== "published") {
    throw new Error(`Publish failed (${published.status}) ${JSON.stringify(published.body)}`);
  }

  const publicProduct = await requestJson<{ slug: string; images?: Array<{ url: string }> }>(
    `/api/v1/products/${slug}`,
  );
  const liveImage = await fetch(`${apiBase}${imageUrl}`);
  const relative = imageUrl.match(
    /^\/api\/v1\/public\/catalog-media\/([0-9a-f-]{36})\/(.+)$/i,
  );
  const onDisk = relative
    ? existsSync(join(environment.UPLOAD_ROOT, "public", "catalog", relative[1]!, relative[2]!))
    : false;

  let secondProcessStatus = 0;
  if (relative) {
    const app = express();
    app.use("/api/v1/public/catalog-media", createCatalogMediaRouter(environment.UPLOAD_ROOT));
    const server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const second = await fetch(
      `http://127.0.0.1:${port}/api/v1/public/catalog-media/${relative[1]}/${relative[2]}`,
    );
    secondProcessStatus = second.status;
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }

  await requestJson(`/api/v1/ops/products/${productId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ status: "archived" }),
  });
  const afterArchive = await requestJson(`/api/v1/products/${slug}`);

  console.info(
    JSON.stringify(
      {
        driver: environment.CATALOG_MEDIA_DRIVER,
        nodeEnv: environment.NODE_ENV,
        productId,
        slug,
        imageUrl,
        publicProductStatus: publicProduct.status,
        liveImageStatus: liveImage.status,
        onDisk,
        secondProcessImageStatus: secondProcessStatus,
        archivedPublicStatus: afterArchive.status,
        productionDurable:
          environment.CATALOG_MEDIA_DRIVER === "s3" ||
          environment.CATALOG_MEDIA_DRIVER === "supabase",
        publicPhase6BLeft: afterArchive.status === 404 ? 0 : 1,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
