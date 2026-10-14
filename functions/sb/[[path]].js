/**
 * Same-origin Auth-Proxy → AP1-Supabase GoTrue (eigenes Projekt, nicht HofZeit/Üben).
 *
 * Route: /sb/*  →  ${AP1_SUPABASE_URL}/auth/v1/...
 * Secrets nur in Cloudflare Pages. Öffentliche meta: url="/sb", key="ap1-web".
 *
 * Signup/Recover: wenn AP1_RESEND_API_KEY (+ optional AP1_RESEND_FROM) gesetzt,
 * wird der Bestätigungs-/Reset-Link per Admin generate_link erzeugt und über
 * Resend verschickt — umgeht Supabase Free-Built-in-Mail (sehr niedriges Limit).
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

const JSON_HDR = { "content-type": "application/json", "cache-control": "no-store" };

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

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HDR });
}

function authEndpoint(authRest) {
  return String(authRest || "")
    .split("/")[0]
    .split("?")[0]
    .toLowerCase();
}

async function resendMail(env, { to, subject, html, text }) {
  const key = env.AP1_RESEND_API_KEY;
  const from = env.AP1_RESEND_FROM;
  if (!key) throw new Error("AP1_RESEND_API_KEY fehlt");
  if (!from) throw new Error("AP1_RESEND_FROM fehlt");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "content-type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = j.message || j.name || "Resend-Versand fehlgeschlagen";
    const err = new Error(msg);
    err.status = r.status;
    throw err;
  }
  return j;
}

async function generateLink(base, secret, payload) {
  const r = await fetch(`${base}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      apikey: secret,
      Authorization: "Bearer " + secret,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(j.msg || j.error_description || j.message || "Link konnte nicht erzeugt werden");
    err.status = r.status;
    err.body = j;
    throw err;
  }
  return j;
}

function signupMail(actionLink, redirectTo) {
  const ziel = redirectTo || "https://ap1-trainer.pages.dev/";
  const subject = "AP1 Trainer — E-Mail bestätigen";
  const text =
    "Willkommen beim AP1 Trainer.\n\nBitte bestätige deine E-Mail mit diesem Link:\n" +
    actionLink +
    "\n\nDanach kannst du dich unter " +
    ziel +
    " anmelden.\nWenn du dich nicht registriert hast, ignoriere diese Mail.";
  const html =
    "<p>Willkommen beim <b>AP1 Trainer</b>.</p>" +
    "<p><a href=\"" +
    actionLink +
    "\">E-Mail bestätigen</a></p>" +
    "<p style=\"color:#555;font-size:13px\">Danach anmelden unter " +
    ziel +
    ". Wenn du dich nicht registriert hast, ignoriere diese Mail.</p>";
  return { subject, text, html };
}

function recoverMail(actionLink) {
  const subject = "AP1 Trainer — Passwort zurücksetzen";
  const text =
    "Du hast ein neues Passwort angefordert.\n\nLink zum Zurücksetzen:\n" +
    actionLink +
    "\n\nWenn du das nicht warst, ignoriere diese Mail.";
  const html =
    "<p>Du hast ein neues Passwort für den <b>AP1 Trainer</b> angefordert.</p>" +
    "<p><a href=\"" +
    actionLink +
    "\">Passwort zurücksetzen</a></p>" +
    "<p style=\"color:#555;font-size:13px\">Wenn du das nicht warst, ignoriere diese Mail.</p>";
  return { subject, text, html };
}

/** Signup über generate_link + Resend (kein Built-in-Mailer). */
async function handleSignupResend(context, base, secret, rawBody) {
  let body = {};
  try {
    body = JSON.parse(new TextDecoder().decode(rawBody) || "{}");
  } catch (e) {
    return json(400, { msg: "Ungültiger JSON-Body" });
  }
  const email = String(body.email || "").trim();
  const password = String(body.password || "");
  if (!email || !password) return json(400, { msg: "E-Mail und Passwort nötig" });

  const redirectTo =
    String(body.email_redirect_to || body.redirect_to || "").trim() ||
    "https://ap1-trainer.pages.dev/";
  const data = body.data && typeof body.data === "object" ? body.data : {};

  let link;
  try {
    link = await generateLink(base, secret, {
      type: "signup",
      email,
      password,
      data,
      redirect_to: redirectTo,
    });
  } catch (e) {
    const status = e.status && e.status >= 400 ? e.status : 400;
    return json(status, e.body || { msg: e.message || "Registrierung fehlgeschlagen" });
  }

  if (!link.action_link) {
    return json(500, { msg: "Bestätigungslink fehlt — bitte später erneut versuchen." });
  }

  const mail = signupMail(link.action_link, redirectTo);
  try {
    await resendMail(context.env, { to: email, ...mail });
  } catch (e) {
    return json(503, {
      msg:
        "Bestätigungsmail konnte gerade nicht gesendet werden. Bitte in ein paar Minuten erneut versuchen oder Tab „Ohne Konto“ nutzen.",
    });
  }

  /* Client erwartet Signup-Antwort ohne Session → needsConfirm. */
  const { action_link, email_otp, hashed_token, verification_type, redirect_to, ...user } = link;
  return json(200, { user, id: user.id });
}

/** Passwort-Reset über generate_link + Resend. */
async function handleRecoverResend(context, base, secret, rawBody) {
  let body = {};
  try {
    body = JSON.parse(new TextDecoder().decode(rawBody) || "{}");
  } catch (e) {
    return json(400, { msg: "Ungültiger JSON-Body" });
  }
  const email = String(body.email || "").trim();
  if (!email) return json(400, { msg: "E-Mail nötig" });
  const redirectTo =
    String(body.email_redirect_to || body.redirect_to || "").trim() ||
    "https://ap1-trainer.pages.dev/";

  let link;
  try {
    link = await generateLink(base, secret, {
      type: "recovery",
      email,
      redirect_to: redirectTo,
    });
  } catch (e) {
    /* Keine User-Enumeration: bei unbekannt immer „ok“ vortäuschen. */
    if (e.status === 404 || (e.body && /not found|User/i.test(JSON.stringify(e.body)))) {
      return json(200, {});
    }
    const status = e.status && e.status >= 400 ? e.status : 400;
    return json(status, e.body || { msg: e.message || "Zurücksetzen fehlgeschlagen" });
  }

  if (link.action_link) {
    const mail = recoverMail(link.action_link);
    try {
      await resendMail(context.env, { to: email, ...mail });
    } catch (e) {
      return json(503, {
        msg: "Reset-Mail konnte gerade nicht gesendet werden. Bitte später erneut versuchen.",
      });
    }
  }
  return json(200, {});
}

export async function onRequest(context) {
  const url = context.env.AP1_SUPABASE_URL;
  const secret = context.env.AP1_SUPABASE_SECRET;
  if (!url || !secret) {
    return json(503, {
      msg: "Auth-Proxy nicht konfiguriert (AP1_SUPABASE_URL / AP1_SUPABASE_SECRET).",
    });
  }

  const rest = restAusRequest(context).replace(/^\/+/, "");
  const m = rest.match(/^auth\/v1\/(.+)$/i);
  if (!m) {
    return json(404, { msg: "Pfad nicht erlaubt" });
  }
  const authRest = m[1];
  if (!pfadErlaubt(authRest)) {
    return json(404, { msg: "Pfad nicht erlaubt" });
  }

  const incoming = new URL(context.request.url);
  const base = String(url).replace(/\/$/, "");
  const method = context.request.method;
  const endpoint = authEndpoint(authRest);
  const resendAn = Boolean(context.env.AP1_RESEND_API_KEY);

  if (resendAn && method === "POST" && (endpoint === "signup" || endpoint === "recover")) {
    const rawBody = await context.request.arrayBuffer();
    if (endpoint === "signup") return handleSignupResend(context, base, secret, rawBody);
    return handleRecoverResend(context, base, secret, rawBody);
  }

  const target = `${base}/auth/v1/${authRest}${incoming.search}`;
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
