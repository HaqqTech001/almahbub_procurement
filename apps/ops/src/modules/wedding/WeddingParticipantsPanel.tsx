import { ModuleSkeleton } from "@hamd/ui/module-layout";
import { useEffect, useState } from "react";
import { useAuth } from "../../auth/session/auth-context.js";
import { getAccessToken } from "../../auth/session/token-store.js";
import { OpsAlert } from "../../components/OpsChrome.js";
import { OpsApiError, opsFetch, requireOpsToken } from "../../lib/ops-fetch.js";

type Participants = {
  total: number; enabled: number; active: number;
  items: Array<{ id: string; displayName: string; enabled: boolean; active: boolean; since: string | null }>;
};

export function WeddingParticipantsPanel({ kind }: { kind: "waiting" | "subscription" }) {
  const auth = useAuth();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Participants | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    let failures = 0;
    setData(null);
    setError(null);
    const refresh = async () => {
      let delay: number | undefined;
      try {
        const accessToken = await requireOpsToken(auth.ensureSession, getAccessToken);
        if (cancelled) return;
        const row = await opsFetch<Participants>("/wedding/participants", { accessToken, query: { kind, page } });
        if (!cancelled) { setData(row); setError(null); }
        failures = 0;
        delay = kind === "waiting" ? 10_000 : 30_000;
      } catch (cause) {
        failures += 1;
        if (!cancelled) setError(kind === "subscription" ? "Unable to load wedding subscribers." : "Unable to load waiting-room participants.");
        // Shared opsFetch handles session recovery; retry only transient reads,
        // twice, with backoff. Permission/validation failures require user action.
        const transient = !(cause instanceof OpsApiError) || cause.status >= 500;
        if (transient && failures <= 2) delay = failures * 30_000;
      } finally {
        if (!cancelled && delay !== undefined) timer = window.setTimeout(() => void refresh(), delay);
      }
    };
    void refresh();
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [kind, page, auth.ensureSession, attempt]);
  return <section aria-label={kind === "waiting" ? "Waiting Room" : "Wedding updates"}>
    <h2>{kind === "waiting" ? "Waiting Room" : "Wedding update subscriptions"}</h2>
    <p>{kind === "waiting" ? "Active means a joined member visited the wedding in the last 90 seconds. This is separate from live viewers." : "Verified account email subscriptions, separate from waiting-room attendance."}</p>
    {error ? <OpsAlert>{error} <button type="button" onClick={() => setAttempt(value => value + 1)}>Retry</button></OpsAlert> : null}
    {data && !error ? <>
      <p role="status">{data.enabled} {kind === "waiting" ? "joined" : "subscribed"}{kind === "waiting" ? ` · ${data.active} currently active` : ""} · {data.total} total records</p>
      <div style={{ overflowX: "auto", maxWidth: "100%" }}>
        <table><thead><tr><th scope="col">Name</th><th scope="col">Status</th><th scope="col">{kind === "waiting" ? "Joined at" : "Subscribed at"}</th></tr></thead>
          <tbody>{data.items.map((row) => <tr key={row.id}>
            <td>{row.displayName}</td><td>{row.enabled ? (kind === "waiting" ? (row.active ? "Active" : "Joined · offline") : "Subscribed") : (kind === "waiting" ? "Left" : "Unsubscribed")}</td>
            <td>{row.since ? new Date(row.since).toLocaleString() : "—"}</td>
          </tr>)}</tbody></table>
      </div>
      {!data.total ? <p>{kind === "subscription" ? "No wedding update subscribers yet." : "No waiting-room participants yet."}</p> : null}
      <button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
      <span> Page {page} </span>
      <button type="button" disabled={page * 50 >= data.total} onClick={() => setPage((value) => value + 1)}>Next</button>
    </> : !error ? <ModuleSkeleton variant="table" columns={3} count={6} /> : null}
  </section>;
}
