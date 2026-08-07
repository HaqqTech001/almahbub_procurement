import { randomUUID } from "node:crypto";

import type { Request } from "express";

import { AppError } from "../../lib/app-error.js";
import type { UploadedFileInput } from "../../modules/media/document/application/document-service.js";
import { uploadSecurityPolicy } from "./upload-policy.js";

/**
 * Minimal multipart/form-data parser for authenticated document uploads.
 * Supports repeated `files` parts only (V1 create-request parity).
 */
export async function parseMultipartFiles(
  request: Request,
): Promise<UploadedFileInput[]> {
  const contentType = String(request.headers["content-type"] ?? "");
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    throw new AppError({
      statusCode: 415,
      code: "UNSUPPORTED_MEDIA_TYPE",
      message: "Expected multipart/form-data uploads.",
    });
  }
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  const boundary = boundaryMatch?.[1] ?? boundaryMatch?.[2];
  if (!boundary) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Missing multipart boundary.",
    });
  }

  const body = await readRequestBody(
    request,
    uploadSecurityPolicy.maxBytes * uploadSecurityPolicy.maxFilesPerRequest +
      1024 * 1024,
  );
  const parts = splitMultipart(body, boundary);
  const files: UploadedFileInput[] = [];

  for (const part of parts) {
    const headerEnd = indexOfSequence(part, Buffer.from("\r\n\r\n"));
    if (headerEnd < 0) continue;
    const headerText = part.subarray(0, headerEnd).toString("utf8");
    const disposition = /content-disposition:\s*(.+)/i.exec(headerText)?.[1] ?? "";
    const nameMatch = /name="([^"]+)"/i.exec(disposition);
    const filenameMatch = /filename="([^"]*)"/i.exec(disposition);
    if (nameMatch?.[1] !== "files" || !filenameMatch?.[1]) continue;
    const mimeType =
      /content-type:\s*([^\r\n]+)/i.exec(headerText)?.[1]?.trim() ??
      "application/octet-stream";
    let content = part.subarray(headerEnd + 4);
    if (content.length >= 2 && content[content.length - 2] === 13 && content[content.length - 1] === 10) {
      content = content.subarray(0, content.length - 2);
    }
    files.push({
      originalFilename: filenameMatch[1] || `upload-${randomUUID()}`,
      mimeType,
      sizeBytes: content.length,
      buffer: Buffer.from(content),
    });
  }

  return files;
}

async function readRequestBody(request: Request, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > maxBytes) {
      throw new AppError({
        statusCode: 413,
        code: "UPLOAD_SIZE",
        message: "Upload payload is too large.",
      });
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks, total);
}

function splitMultipart(body: Buffer, boundary: string): Buffer[] {
  const delimiter = Buffer.from(`--${boundary}`);
  const parts: Buffer[] = [];
  let start = indexOfSequence(body, delimiter);
  while (start >= 0) {
    start += delimiter.length;
    if (body[start] === 45 && body[start + 1] === 45) break;
    if (body[start] === 13 && body[start + 1] === 10) start += 2;
    const next = indexOfSequence(body, delimiter, start);
    if (next < 0) break;
    parts.push(body.subarray(start, next - 2));
    start = next;
  }
  return parts;
}

function indexOfSequence(haystack: Buffer, needle: Buffer, from = 0): number {
  return haystack.indexOf(needle, from);
}
