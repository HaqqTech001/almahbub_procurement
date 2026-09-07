import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { StoredDocument } from "@hamd/database";

import { AppError } from "../../../../lib/app-error.js";
import type { AuthContext } from "../../../../shared/auth/auth-context.js";
import type { DatabaseClient } from "../../../../shared/database/database-client.js";
import {
  formatSizeLabel,
  sanitizeUploadFilename,
  uploadSecurityPolicy,
  validateUploadCandidate,
  type UploadSecurityPolicy,
} from "../../../../shared/uploads/upload-policy.js";

export type UploadedFileInput = {
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  buffer: Buffer;
};

export class DocumentService {
  public constructor(
    private readonly database: DatabaseClient,
    private readonly uploadRoot: string,
  ) {}

  public async uploadMany(
    context: AuthContext,
    files: readonly UploadedFileInput[],
    requestId: string,
    policy: UploadSecurityPolicy = uploadSecurityPolicy,
  ): Promise<StoredDocument[]> {
    assertUploadPermission(context);
    if (files.length === 0) {
      throw new AppError({
        statusCode: 422,
        code: "VALIDATION_ERROR",
        message: "At least one file is required.",
      });
    }
    if (files.length > policy.maxFilesPerRequest) {
      throw new AppError({
        statusCode: 422,
        code: "VALIDATION_ERROR",
        message: `At most ${policy.maxFilesPerRequest} files may be uploaded at once.`,
      });
    }

    const saved: StoredDocument[] = [];
    for (const file of files) {
      const issues = validateUploadCandidate(
        {
          filename: file.originalFilename,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
        },
        policy,
      );
      if (issues.length > 0) {
        throw new AppError({
          statusCode: 422,
          code: issues[0]!.code,
          message: issues[0]!.message,
        });
      }
      saved.push(await this.persistOne(context, file, requestId));
    }
    return saved;
  }

  public async getAccessible(
    context: AuthContext,
    documentId: string,
  ): Promise<StoredDocument> {
    assertDownloadPermission(context);
    const document = await this.database.storedDocument.findFirst({
      where: {
        id: documentId,
        organizationId: context.organizationId,
        deletedAt: null,
      },
    });
    if (!document) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Document not found.",
      });
    }
    return document;
  }

  public openReadStream(document: StoredDocument) {
    return createReadStream(join(this.uploadRoot, document.storagePath));
  }

  public serialize(document: StoredDocument) {
    return {
      id: document.id,
      name: document.originalFilename,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      sizeLabel: formatSizeLabel(document.sizeBytes),
      href: `/api/v1/documents/${document.id}`,
      kind: mimeKind(document.mimeType),
      uploadedAt: document.createdAt,
    };
  }

  private async persistOne(
    context: AuthContext,
    file: UploadedFileInput,
    requestId: string,
  ): Promise<StoredDocument> {
    const id = randomUUID();
    const safeName = sanitizeUploadFilename(file.originalFilename);
    const storedFilename = `${id}-${safeName}`;
    const relativeDir = join("documents", context.organizationId);
    const absoluteDir = join(this.uploadRoot, relativeDir);
    await mkdir(absoluteDir, { recursive: true });
    const storagePath = join(relativeDir, storedFilename).replace(/\\/g, "/");
    const absolutePath = join(this.uploadRoot, storagePath);
    await writeFile(absolutePath, file.buffer);
    const checksum = createHash("sha256").update(file.buffer).digest("hex");

    const created = await this.database.$transaction(async (tx) => {
      const document = await tx.storedDocument.create({
        data: {
          id,
          organizationId: context.organizationId,
          uploadedById: context.userId,
          originalFilename: safeName,
          storedFilename,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
          storageProvider: "local",
          storagePath,
          checksumSha256: checksum,
        },
      });
      await tx.auditEvent.create({
        data: {
          organizationId: context.organizationId,
          actorId: context.userId,
          action: "document.uploaded",
          resourceType: "document",
          resourceId: document.id,
          requestId,
          metadata: {
            mimeType: file.mimeType,
            sizeBytes: file.sizeBytes,
            filename: safeName,
          },
        },
      });
      return document;
    });
    return created;
  }
}

function assertUploadPermission(context: AuthContext): void {
  if (
    !context.permissionKeys.has("request:create") &&
    !context.permissionKeys.has("request:update") &&
    !context.permissionKeys.has("request:manage") &&
    !context.permissionKeys.has("ops:access") &&
    !context.permissionKeys.has("cms:manage") &&
    !context.permissionKeys.has("communication:publish")
  ) {
    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "You do not have permission to upload documents.",
    });
  }
}

function assertDownloadPermission(context: AuthContext): void {
  if (
    !context.permissionKeys.has("request:read") &&
    !context.permissionKeys.has("request:create") &&
    !context.permissionKeys.has("request:update") &&
    !context.permissionKeys.has("request:manage") &&
    !context.permissionKeys.has("ops:access")
  ) {
    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "You do not have permission to download documents.",
    });
  }
}

function mimeKind(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("word") || mimeType === "text/plain") return "document";
  return "file";
}
