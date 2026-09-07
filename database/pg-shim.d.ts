declare module "pg" {
  import type { EventEmitter } from "node:events";

  export interface PoolConfig {
    connectionString?: string;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
    keepAlive?: boolean;
    keepAliveInitialDelayMillis?: number;
    allowExitOnIdle?: boolean;
  }

  export class Pool extends EventEmitter {
    constructor(config?: PoolConfig);
    on(event: "error", listener: (error: Error) => void): this;
  }

  const pg: { Pool: typeof Pool };
  export default pg;
}
