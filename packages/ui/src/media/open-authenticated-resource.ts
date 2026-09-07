export async function openAuthenticatedResource(
  href: string,
  getAccessToken?: (() => Promise<string | null>) | undefined,
): Promise<void> {
  if (!getAccessToken) {
    window.open(href, "_blank", "noopener,noreferrer");
    return;
  }
  const token = await getAccessToken();
  const response = await fetch(href, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  if (!response.ok) {
    window.open(href, "_blank", "noopener,noreferrer");
    return;
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
