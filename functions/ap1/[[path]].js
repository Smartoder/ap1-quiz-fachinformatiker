/**
 * Proxy /ap1/* → Hetzner ap1-api (ersetzt vercel.json rewrites auf Pages).
 * Browser bleibt same-origin HTTPS; kein Mixed-Content.
 */
// Hostname (nicht Bare-IP): Pages Functions → CF Error 1003 bei Fetch auf IP
const UPSTREAM = "https://ap1.49-13-228-161.sslip.io";

export async function onRequest(context) {
  const incoming = new URL(context.request.url);
  const target = `${UPSTREAM}${incoming.pathname}${incoming.search}`;
  const method = context.request.method;

  const headers = new Headers(context.request.headers);
  headers.delete("host");
  headers.delete("cf-connecting-ip");
  headers.delete("cf-ray");
  headers.delete("cf-visitor");
  headers.delete("cf-ipcountry");
  headers.delete("x-forwarded-proto");
  headers.delete("x-real-ip");

  const init = { method, headers, redirect: "manual" };
  if (method !== "GET" && method !== "HEAD") {
    init.body = await context.request.arrayBuffer();
  }

  const upstream = await fetch(target, init);
  const out = new Headers(upstream.headers);
  out.set("Cache-Control", "no-store");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: out,
  });
}
