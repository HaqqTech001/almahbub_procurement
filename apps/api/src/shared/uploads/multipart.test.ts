import { Readable } from "node:stream";

import type { Request } from "express";
import { describe, expect, it } from "vitest";

import { AppError } from "../../lib/app-error.js";
import { parseMultipartFiles } from "./multipart.js";

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

  it("rejects non-multipart content types", async () => {
    const request = Readable.from([Buffer.from("x")]) as unknown as Request;
    request.headers = { "content-type": "application/json" };
    await expect(parseMultipartFiles(request)).rejects.toBeInstanceOf(AppError);
  });
});
