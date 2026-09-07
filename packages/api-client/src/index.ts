export class ApiClientError extends Error {
  public constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`API request failed with status ${status}.`);
  }
}

export function createApiClient(
  baseUrl: string,
  fetcher: typeof fetch = fetch,
) {
  return {
    async get<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
      const response = await fetcher(new URL(path, baseUrl), {
        ...init,
        headers: { accept: "application/json", ...init?.headers },
      });
      const body: unknown = await response.json();
      if (!response.ok) throw new ApiClientError(response.status, body);
      return body as TResponse;
    },
  };
}
