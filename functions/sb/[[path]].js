/**
 * Same-origin Auth-Proxy → AP1-Supabase GoTrue (eigenes Projekt, nicht HofZeit/Üben).
 *
 * Route: /sb/*  →  ${AP1_SUPABASE_URL}/auth/v1/...
 * Secrets nur in Cloudflare Pages. Öffentliche meta: url="/sb", key="ap1-web".
 */
const ERLAUBT = new Set([
  "signup",
  "token",
  "recover",
  "logout",
  "user",
  "verify",
  "reauthenticate",
]);

function pfadErlaubt(rest) {
  const first = String(rest || "")
    .split("/")[0]
    .split("?")[0]
    .toLowerCase();
  if (!first) return false;
  if (ERLAUBT.has(first)) return true;
  return first.startsWith("verify");
}

function restAusRequest(context) {
  const incoming = new URL(context.request.url);
  if (context.params && context.params.path != null && context.params.path !== "") {
    const p = context.params.path;
    return Array.isArray(p) ? p.join("/") : String(p);
  }
  return incoming.pathname.replace(/^\/sb\/?/, "");
}

export async function onRequest(context) {
  const url = context.env.AP1_SUPABASE_URL;
  const secret = context.env.AP1_SUPABASE_SECRET;
  if (!url || !secret) {
    return new Response(
      JSON.stringify({
        msg: "Auth-Proxy nicht konfiguriert (AP1_SUPABASE_URL / AP1_SUPABASE_SECRET).",
      }),
      { status: 503, headers: { "content-type": "application/json", "cache-control": "no-store" } }
    );
  }

  const rest = restAusRequest(context).replace(/^\/+/, "");
  // Erwartet: auth/v1/<endpoint>[/...]
  const m = rest.match(/^auth\/v1\/(.+)$/i);
  if (!m) {
    return new Response(JSON.stringify({ msg: "Pfad nicht erlaubt" }), {
      status: 404,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
  const authRest = m[1];
  if (!pfadErlaubt(authRest)) {
    return new Response(JSON.stringify({ msg: "Pfad nicht erlaubt" }), {
      status: 404,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }

  const incoming = new URL(context.request.url);
  const base = String(url).replace(/\/$/, "");
  const target = `${base}/auth/v1/${authRest}${incoming.search}`;
  const method = context.request.method;

  const headers = new Headers();
  const ct = context.request.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  headers.set("apikey", secret);
  const authIn = context.request.headers.get("authorization") || "";
  const bearer = authIn.replace(/^Bearer\s+/i, "").trim();
  if (bearer.startsWith("eyJ") && bearer !== secret) {
    headers.set("authorization", "Bearer " + bearer);
  } else {
    headers.set("authorization", "Bearer " + secret);
  }

  const init = { method, headers, redirect: "manual" };
  if (method !== "GET" && method !== "HEAD") {
    init.body = await context.request.arrayBuffer();
  }

  const upstream = await fetch(target, init);
  const out = new Headers(upstream.headers);
  out.set("cache-control", "no-store");
  out.delete("transfer-encoding");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: out,
  });
}
