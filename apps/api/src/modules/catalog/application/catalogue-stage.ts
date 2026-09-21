export async function catalogueStage<T>(
  stage: string,
  work: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await work();
    console.log(
      JSON.stringify({ stage, status: "ok", durationMs: Date.now() - start }),
    );
    return result;
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "UNKNOWN";
    console.error(
      JSON.stringify({
        stage,
        status: "failed",
        code,
        durationMs: Date.now() - start,
      }),
    );
    throw new Error(
      `Catalogue stage failed: ${stage} (${code}). Previous data/report retained.`,
      { cause: error },
    );
  }
}
