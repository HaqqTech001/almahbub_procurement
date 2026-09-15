import type { CatalogImageGenerationResult, CatalogImageGenerator } from "./catalog-image-generator.js";
export class OpenAiCatalogImageGenerator implements CatalogImageGenerator {
  constructor(private readonly key: string, private readonly model: string, private readonly size: string, private readonly quality: string) {}
  async generate(input: { prompt: string; productSlug: string }): Promise<CatalogImageGenerationResult> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch("https://api.openai.com/v1/images/generations", { method: "POST", headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: this.model, prompt: input.prompt, size: this.size, quality: this.quality, n: 1, background: "opaque" }), signal: AbortSignal.timeout(120000) });
        if ((response.status === 429 || response.status >= 500) && attempt < 2) { const retry = Number(response.headers.get("retry-after") ?? ""); await new Promise((r) => setTimeout(r, Number.isFinite(retry) ? Math.min(retry * 1000, 10000) : 500 * 2 ** attempt)); continue; }
        if (!response.ok) throw new Error(`OpenAI image generation failed (${response.status}).`);
        const json = (await response.json()) as { data?: Array<{ b64_json?: string }> };
        const encoded = json.data?.[0]?.b64_json; if (!encoded) throw new Error("OpenAI image response did not contain data[0].b64_json.");
        const bytes = Buffer.from(encoded, "base64"); if (!bytes.length) throw new Error("OpenAI returned an empty image.");
        const dimensions = this.size.match(/^(\d+)x(\d+)$/);
        return { bytes, mimeType: "image/png", provider: "openai", model: this.model, size: this.size, quality: this.quality, ...(dimensions ? { width: Number(dimensions[1]), height: Number(dimensions[2]) } : {}) };
      } catch (error) { if (attempt === 2 || error instanceof Error && /failed \(4\d\d\)/.test(error.message)) throw error; await new Promise((r) => setTimeout(r, 500 * 2 ** attempt)); }
    }
    throw new Error("OpenAI image generation failed after retries.");
  }
}
