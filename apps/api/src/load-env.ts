import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Side-effect import first in server entry so env is ready before app modules. */
loadEnv({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });
loadEnv();

