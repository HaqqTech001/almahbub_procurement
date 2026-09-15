import type { Environment } from "../../../config/env.js";
import type { CatalogImageGenerator } from "./catalog-image-generator.js";
import { OpenAiCatalogImageGenerator } from "./openai-catalog-image-generator.js";
export function createCatalogImageGenerator(env: Environment): CatalogImageGenerator | null {
  if (env.CATALOG_IMAGE_PROVIDER !== "openai" || !env.OPENAI_API_KEY) return null;
  return new OpenAiCatalogImageGenerator(env.OPENAI_API_KEY, env.AI_OPENAI_IMAGE_MODEL, env.AI_OPENAI_IMAGE_SIZE, env.AI_OPENAI_IMAGE_QUALITY);
}
