const UA =
  "AlmahbubMediaStaging/1.0 (International category media; provenance lookup)";
const ids = [236705, 247786, 4483610, 4246120, 6169668, 1078884, 2760241];

for (const id of ids) {
  const url = `https://www.pexels.com/photo/${id}/`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    redirect: "follow",
  });
  const html = await res.text();
  const ogTitle = html.match(/property="og:title" content="([^"]+)"/)?.[1];
  let creator;
  const ld = html.match(/application\/ld\+json">([\s\S]*?)<\/script>/);
  if (ld) {
    try {
      const json = JSON.parse(ld[1]);
      creator = json.author?.name || json.creator?.name;
    } catch {
      /* ignore */
    }
  }
  if (!creator) {
    creator = html.match(/"Photographer","name":"([^"]+)"/)?.[1];
  }
  console.log(
    JSON.stringify({
      id,
      status: res.status,
      final: res.url,
      ogTitle,
      creator,
    }),
  );
}
