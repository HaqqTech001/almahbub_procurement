import { createHash, createHmac } from "node:crypto";
import { randomUUID } from "node:crypto";

import { AppError } from "../../../lib/app-error.js";
import { sanitizeUploadFilename } from "../../../shared/uploads/upload-policy.js";
import type { CatalogMediaObject, CatalogMediaStore } from "./catalog-media-store.js";
import {
  assertCatalogMediaPath,
  catalogObjectKey,
  mimeFromFilename,
} from "./catalog-media-path.js";

export class S3CatalogMediaStore implements CatalogMediaStore {
  public constructor(
    private readonly bucket: string,
    private readonly region: string,
    private readonly accessKeyId: string,
    private readonly secretAccessKey: string,
    private readonly publicBaseUrl?: string,
  ) {}

  public async put(input: {
    productId: string;
    originalFilename: string;
    bytes: Buffer;
  }): Promise<CatalogMediaObject> {
    const filename = `${randomUUID()}-${sanitizeUploadFilename(input.originalFilename)}`;
    const key = catalogObjectKey({ productId: input.productId, filename });
    const response = await this.signedRequest("PUT", key, input.bytes, mimeFromFilename(filename));
    if (!response.ok) {
      throw new AppError({
        statusCode: 502,
        code: "STORAGE_UNAVAILABLE",
        message: `S3 catalog upload failed (${response.status}).`,
      });
    }
    return { filename, publicUrl: this.publicUrl(key) };
  }

  public async remove(input: { productId: string; filename: string }): Promise<void> {
    const safe = assertCatalogMediaPath(input);
    const key = catalogObjectKey(safe);
    try {
      await this.signedRequest("DELETE", key);
    } catch {
      /* object may already be absent */
    }
  }

  private publicUrl(key: string): string {
    const base = this.publicBaseUrl?.replace(/\/$/, "");
    if (base) return `${base}/${key}`;
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  private async signedRequest(
    method: "PUT" | "DELETE",
    key: string,
    body?: Buffer,
    contentType?: string,
  ): Promise<Response> {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = sha256Hex(body ?? Buffer.alloc(0));
    const host = `${this.bucket}.s3.${this.region}.amazonaws.com`;
    const canonicalUri = `/${key.split("/").map(encodeURIComponent).join("/")}`;
    const headers: Record<string, string> = {
      host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    };
    if (contentType) headers["content-type"] = contentType;
    const signedHeaderNames = Object.keys(headers).sort();
    const canonicalHeaders = signedHeaderNames
      .map((name) => `${name}:${headers[name]}\n`)
      .join("");
    const signedHeaders = signedHeaderNames.join(";");
    const canonicalRequest = [
      method,
      canonicalUri,
      "",
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");
    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join("\n");
    const signingKey = hmac(
      hmac(hmac(hmac(`AWS4${this.secretAccessKey}`, dateStamp), this.region), "s3"),
      "aws4_request",
    );
    const signature = createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");
    headers.authorization = `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return fetch(`https://${host}${canonicalUri}`, {
      method,
      headers,
      ...(body ? { body: new Uint8Array(body) } : {}),
    });
  }
}

function sha256Hex(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value, "utf8").digest();
}
