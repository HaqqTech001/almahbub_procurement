/** Retry only a read-only startup probe, never an account transaction. */
export async function checkDatabaseBeforeBootstrap(probe: () => Promise<unknown>): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await probe();
      return;
    } catch (error) {
      const failure = error as { code?: string; message?: string } | null;
      const transient = ["P1001", "P1002", "P1017", "P2024", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "EAI_AGAIN"].includes(failure?.code ?? "")
        || /connection (?:terminated|timeout)|timeout exceeded when trying to connect|EMAXCONNSESSION|max clients reached/i.test(failure?.message ?? "");
      if (!transient) throw error;
      if (attempt === 2) {
        throw new Error("Database connection unavailable before admin bootstrap after 3 attempts. Check database reachability and pooler capacity; no bootstrap transaction was started.", { cause: error });
      }
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
}
