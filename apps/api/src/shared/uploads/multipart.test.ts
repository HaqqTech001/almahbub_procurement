import { Readable } from "node:stream";

import type { Request } from "express";
import { describe, expect, it } from "vitest";

import { AppError } from "../../lib/app-error.js";
import { parseMultipartFiles, parseMultipartUpload } from "./multipart.js";

function multipartRequest(parts: {
  filename: string;
  mimeType: string;
  content: Buffer;
}[]): Request {
  const boundary = "----HamdBoundary7MA4YWxkTrZu0gW";
  const chunks: Buffer[] = [];
  for (const part of parts) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${part.filename}"\r\nContent-Type: ${part.mimeType}\r\n\r\n`,
      ),
      part.content,
      Buffer.from("\r\n"),
    );
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  const body = Buffer.concat(chunks);
  const stream = Readable.from([body]) as unknown as Request;
  stream.headers = {
    "content-type": `multipart/form-data; boundary=${boundary}`,
  };
  return stream;
}

describe("parseMultipartFiles", () => {
  it("parses repeated files parts", async () => {
    const files = await parseMultipartFiles(
      multipartRequest([
        {
          filename: "a.pdf",
          mimeType: "application/pdf",
          content: Buffer.from("%PDF-1.4"),
        },
        {
          filename: "b.png",
          mimeType: "image/png",
          content: Buffer.from([137, 80, 78, 71]),
        },
      ]),
    );
    expect(files).toHaveLength(2);
    expect(files[0]?.originalFilename).toBe("a.pdf");
    expect(files[0]?.mimeType).toBe("application/pdf");
    expect(files[1]?.originalFilename).toBe("b.png");
  });

  it("accepts V1 announcement media field parts", async () => {
    const boundary = "----HamdBoundaryMedia";
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="notice.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`,
      ),
      Buffer.from([255, 216, 255]),
      Buffer.from("\r\n"),
      Buffer.from(`--${boundary}--\r\n`),
    ]);
    const stream = Readable.from([body]) as unknown as Request;
    stream.headers = {
      "content-type": `multipart/form-data; boundary=${boundary}`,
    };
    const files = await parseMultipartFiles(stream);
    expect(files).toHaveLength(1);
    expect(files[0]?.originalFilename).toBe("notice.jpg");
    expect(files[0]?.mimeType).toBe("image/jpeg");
  });

  it("reads text fields and a single file part", async () => {
    const boundary = "----HamdBoundaryFields";
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nOpening Dua\r\n`,
      ),
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="a.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n`,
      ),
      Buffer.from([0x49, 0x44, 0x33]),
      Buffer.from("\r\n"),
      Buffer.from(`--${boundary}--\r\n`),
    ]);
    const stream = Readable.from([body]) as unknown as Request;
    stream.headers = {
      "content-type": `multipart/form-data; boundary=${boundary}`,
    };
    const parsed = await parseMultipartUpload(stream);
    expect(parsed.fields.title).toBe("Opening Dua");
    expect(parsed.files[0]?.originalFilename).toBe("a.mp3");
  });

  it("rejects non-multipart content types", async () => {
    const request = Readable.from([Buffer.from("x")]) as unknown as Request;
    request.headers = { "content-type": "application/json" };
    await expect(parseMultipartFiles(request)).rejects.toBeInstanceOf(AppError);
  });
});
