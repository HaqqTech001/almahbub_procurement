/**
 * UUIDv7 is the platform identifier format. It remains a string at runtime so
 * it can cross JSON, database, and API boundaries without transformation.
 */
export type UUID = string & { readonly __brand: "UUID" };

export interface PaginationMeta {
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export interface ApiErrorDetail {
  readonly field?: string;
  readonly code: string;
  readonly message: string;
}

export interface ApiErrorEnvelope {
  readonly success: false;
  readonly message: string;
  readonly data: null;
  readonly meta: Record<string, never>;
  readonly errors: readonly ApiErrorDetail[];
  readonly requestId: string;
  readonly timestamp: string;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly requestId: string;
    readonly details?: readonly ApiErrorDetail[];
  };
}

export interface ApiSuccessEnvelope<TData, TMeta = Record<string, never>> {
  readonly success: true;
  readonly message: string;
  readonly data: TData;
  readonly meta: TMeta;
  readonly errors: readonly [];
  readonly requestId: string;
  readonly timestamp: string;
}
