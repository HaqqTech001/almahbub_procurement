/**
 * Minimal API stub for Lighthouse / static quality runs.
 * Satisfies auth bootstrap + homepage catalog without a full API process.
 */
import http from "node:http";

const PORT = Number(process.env.LH_API_STUB_PORT ?? "14000");

const server = http.createServer((req, res) => {
  const origin = req.headers.origin ?? "http://127.0.0.1:4173";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "content-type, authorization, x-csrf-token",
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PATCH,PUT,DELETE,OPTIONS",
  );

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url ?? "/";

  if (url.includes("/auth/refresh")) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        data: null,
        error: { code: "UNAUTHENTICATED", message: "No session." },
      }),
    );
    return;
  }

  if (url.includes("/marketing/catalog")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ data: { products: [], categories: [] } }));
    return;
  }

  if (url.includes("/health")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: { code: "NOT_FOUND" } }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`LH API stub listening on http://127.0.0.1:${PORT}`);
});
