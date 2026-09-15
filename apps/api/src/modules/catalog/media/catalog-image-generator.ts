export type CatalogImageGenerationResult = { bytes: Buffer; mimeType: string; provider: string; model: string; size?: string; quality?: string; width?: number; height?: number };
export interface CatalogImageGenerator { generate(input: { prompt: string; productSlug: string }): Promise<CatalogImageGenerationResult>; }
