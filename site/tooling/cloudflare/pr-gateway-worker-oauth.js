const GH_API = "https://api.github.com";
const GH_OAUTH_AUTHORIZE = "https://github.com/login/oauth/authorize";
const GH_OAUTH_TOKEN = "https://github.com/login/oauth/access_token";

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin, env) });
    }

    try {
      if (request.method === "GET" && url.pathname === "/auth/github/login") {
        return handleGithubLogin(request, env);
      }

      if (request.method === "GET" && url.pathname === "/auth/github/callback") {
        return handleGithubCallback(request, env);
      }

      if (request.method === "GET" && url.pathname === "/auth/me") {
        return handleAuthMe(request, env, origin);
      }

      if (request.method !== "POST") {
        return json({ ok: false, error: "Method Not Allowed" }, 405, origin, env);
      }

      if (url.pathname !== "/api/create-pr") {
        return json({ ok: false, error: "Not Found" }, 404, origin, env);
      }

      if (origin && !isAllowedOrigin(origin, env)) {
        return json({ ok: false, error: "Origin not allowed" }, 403, origin, env);
      }

      const authUser = await resolveAuthUserFromBearer(request, env);
      let submitter = authUser;

      if (!submitter) {
        const key = request.headers.get("x-studio-key") || "";
        if (!env.STUDIO_SHARED_KEY || key !== env.STUDIO_SHARED_KEY) {
          return json({ ok: false, error: "Unauthorized" }, 401, origin, env);
        }
      }

      const body = await request.json();
      const targetPath = sanitizeTargetPath(body.targetPath);
      const markdown = String(body.markdown || "");
      const prTitleInput = String(body.prTitle || "");
      const prBodyInput = String(body.prBody || "");

      if (!markdown.trim()) {
        return json({ ok: false, error: "markdown 不能为空" }, 400, origin, env);
      }
      if (markdown.length > 300000) {
        return json({ ok: false, error: "markdown 过大（>300KB）" }, 400, origin, env);
      }

      const baseBranch = env.GITHUB_BASE_BRANCH || "main";
      const repoPath = `site/content/${targetPath}`;

      const appJwt = await createAppJwt(env.GITHUB_APP_ID, env.GITHUB_PRIVATE_KEY);
      const installationToken = await getInstallationToken(env, appJwt);

      const baseHeadSha = await getBranchHeadSha(env, baseBranch, installationToken);
      const branch = makeBranchName(targetPath);

      await ghFetch(
        `${GH_API}/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/git/refs`,
        installationToken,
        {
          method: "POST",
          body: JSON.stringify({
            ref: `refs/heads/${branch}`,
            sha: baseHeadSha
          })
        }
      );

      const existingSha = await getExistingFileSha(env, repoPath, branch, installationToken);
      const contentBase64 = utf8ToBase64(markdown);

      await ghFetch(
        `${GH_API}/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${encodePathForUrl(repoPath)}`,
        installationToken,
        {
          method: "PUT",
          body: JSON.stringify({
            message: `docs: update ${targetPath} via article studio`,
            content: contentBase64,
            branch,
            sha: existingSha || undefined
          })
        }
      );

      const prTitle = (prTitleInput || `docs: 更新 ${targetPath}`).slice(0, 120);
      const bodyLines = [];
      if (prBodyInput) {
        bodyLines.push(prBodyInput);
      } else {
        bodyLines.push("Created by Article Studio.", "", `- File: \`${repoPath}\``, `- Branch: \`${branch}\``);
      }

      if (submitter) {
        bodyLines.push("", `- Submitter: @${submitter}`);
      }

      const pr = await ghFetch(
        `${GH_API}/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/pulls`,
        installationToken,
        {
          method: "POST",
          body: JSON.stringify({
            title: prTitle,
            head: branch,
            base: baseBranch,
            body: bodyLines.join("\n")
          })
        }
      );

      return json(
        {
          ok: true,
          prUrl: pr.html_url,
          prNumber: pr.number,
          branch,
          filePath: repoPath,
          submitter: submitter || null
        },
        200,
        origin,
        env
      );
    } catch (err) {
      return json(
        {
          ok: false,
          error: err && err.message ? err.message : String(err),
          name: err && err.name ? err.name : null
        },
        500,
        origin,
        env
      );
    }
  }
};

async function handleGithubLogin(request, env) {
  assertOauthConfigured(env);

  const requestUrl = new URL(request.url);
  const returnTo = sanitizeReturnToUrl(requestUrl.searchParams.get("return_to"), requestUrl.origin, env);
  const callbackUrl = `${requestUrl.origin}/auth/github/callback`;
  const stateToken = await signToken(
    {
      purpose: "oauth_state",
      nonce: randomId(12),
      returnTo: returnTo || undefined
    },
    env.SESSION_SIGNING_KEY,
    10 * 60
  );

  const redirect = new URL(GH_OAUTH_AUTHORIZE);
  redirect.searchParams.set("client_id", env.GITHUB_OAUTH_CLIENT_ID);
  redirect.searchParams.set("redirect_uri", callbackUrl);
  redirect.searchParams.set("scope", "read:user");
  redirect.searchParams.set("state", stateToken);

  return Response.redirect(redirect.toString(), 302);
}

async function handleGithubCallback(request, env) {
  assertOauthConfigured(env);

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code") || "";
  const state = requestUrl.searchParams.get("state") || "";

  if (!code || !state) {
    return new Response("Missing code/state", { status: 400 });
  }

  const statePayload = await verifyToken(state, env.SESSION_SIGNING_KEY);
  if (!statePayload || statePayload.purpose !== "oauth_state") {
    return new Response("Invalid oauth state", { status: 400 });
  }

  const callbackUrl = `${requestUrl.origin}/auth/github/callback`;

  const tokenRes = await fetch(GH_OAUTH_TOKEN, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: env.GITHUB_OAUTH_CLIENT_SECRET,
      code: code,
      redirect_uri: callbackUrl
    })
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    const desc = tokenData.error_description || tokenData.error || "oauth token exchange failed";
    return new Response(`OAuth failed: ${desc}`, { status: 400 });
  }

  const userRes = await fetch(`${GH_API}/user`, {
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${tokenData.access_token}`,
      "User-Agent": "article-studio-oauth"
    }
  });

  const userData = await userRes.json();
  if (!userRes.ok || !userData.login) {
    return new Response("Failed to fetch github user", { status: 400 });
  }

  const login = String(userData.login || "").trim();
  if (!login) {
    return new Response("Invalid github login", { status: 400 });
  }

  if (!isGithubUserAllowed(login, env)) {
    return new Response(`GitHub user not allowed: ${login}`, { status: 403 });
  }

  const sessionToken = await signToken(
    { purpose: "studio_user", user: login },
    env.SESSION_SIGNING_KEY,
    2 * 60 * 60
  );

  const returnTo =
    sanitizeReturnToUrl(statePayload.returnTo, requestUrl.origin, env) ||
    sanitizeReturnToUrl(env.FRONTEND_URL, requestUrl.origin, env) ||
    `${requestUrl.origin}/site/pages/article-studio.html`;

  const redirectBack = `${returnTo}#oauth_token=${encodeURIComponent(sessionToken)}&github_user=${encodeURIComponent(login)}`;
  return Response.redirect(redirectBack, 302);
}

async function handleAuthMe(request, env, origin) {
  if (origin && !isAllowedOrigin(origin, env)) {
    return json({ ok: false, error: "Origin not allowed" }, 403, origin, env);
  }

  const user = await resolveAuthUserFromBearer(request, env);
  if (!user) {
    return json({ ok: false, error: "Unauthorized" }, 401, origin, env);
  }

  return json({ ok: true, user: user }, 200, origin, env);
}

function assertOauthConfigured(env) {
  const needed = [
    "GITHUB_OAUTH_CLIENT_ID",
    "GITHUB_OAUTH_CLIENT_SECRET",
    "SESSION_SIGNING_KEY"
  ];

  for (const key of needed) {
    if (!String(env[key] || "").trim()) {
      throw new Error(`Missing env: ${key}`);
    }
  }
}

function isGithubUserAllowed(login, env) {
  const allow = String(env.ALLOWED_GITHUB_USERS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (allow.length === 0) return true;
  return allow.includes(String(login || "").toLowerCase());
}

function sanitizeReturnToUrl(input, requestOrigin, env) {
  const raw = String(input || "").trim();
  if (!raw) return "";

  let parsed;
  try {
    parsed = new URL(raw, requestOrigin);
  } catch (_) {
    return "";
  }

  if (!/^https?:$/.test(parsed.protocol)) {
    return "";
  }

  if (!isAllowedRedirectOrigin(parsed.origin, requestOrigin, env)) {
    return "";
  }

  parsed.hash = "";
  return parsed.toString();
}

function isAllowedRedirectOrigin(origin, requestOrigin, env) {
  const list = String(env.ALLOWED_REDIRECT_ORIGINS || env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (list.length === 0) {
    return origin === requestOrigin;
  }

  if (list.includes("*")) return true;
  return list.includes(origin);
}

async function resolveAuthUserFromBearer(request, env) {
  const auth = request.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return "";

  const token = String(m[1] || "").trim();
  if (!token) return "";

  const payload = await verifyToken(token, env.SESSION_SIGNING_KEY || "");
  if (!payload || payload.purpose !== "studio_user" || !payload.user) {
    return "";
  }

  if (!isGithubUserAllowed(payload.user, env)) {
    return "";
  }

  return String(payload.user);
}

function isAllowedOrigin(origin, env) {
  const list = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (list.length === 0) return true;
  if (list.includes("*")) return true;
  return list.includes(origin);
}

function corsHeaders(origin, env) {
  const allowOrigin = isAllowedOrigin(origin, env) ? (origin || "*") : "null";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, x-studio-key, authorization",
    "Access-Control-Max-Age": "86400"
  };
}

function json(data, status, origin, env) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(origin, env)
    }
  });
}

function sanitizeTargetPath(input) {
  let p = String(input || "").trim().replace(/\\/g, "/");
  p = p.replace(/^\/+/, "");
  p = p.replace(/^site\/content\//i, "");
  p = p.replace(/\/{2,}/g, "/");

  if (!p) throw new Error("targetPath 为空");
  if (p.includes("..")) throw new Error("targetPath 非法");
  if (!/\.md$/i.test(p)) throw new Error("只允许 .md");
  return p;
}

function encodePathForUrl(path) {
  return String(path)
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

function makeBranchName(targetPath) {
  const now = new Date();
  const ts =
    `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}` +
    `${String(now.getUTCHours()).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}${String(now.getUTCSeconds()).padStart(2, "0")}`;

  const slug = String(targetPath)
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5/_-]/g, "-")
    .replace(/[\\/]+/g, "-")
    .slice(0, 36);

  const rand = Math.random().toString(36).slice(2, 7);
  return `studio/${ts}-${slug || "doc"}-${rand}`;
}

async function ghFetch(url, token, init = {}) {
  const resp = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "article-studio-pr-worker",
      ...(init.headers || {})
    }
  });

  const text = await resp.text();
  const data = text ? safeJson(text) : {};

  if (!resp.ok) {
    const message = data && data.message ? data.message : `${resp.status} ${resp.statusText}`;
    throw new Error(`GitHub API error: ${message}`);
  }

  return data;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function getBranchHeadSha(env, branch, token) {
  const data = await ghFetch(
    `${GH_API}/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/git/ref/heads/${encodeURIComponent(branch)}`,
    token
  );
  return data.object.sha;
}

async function getExistingFileSha(env, repoPath, branch, token) {
  const url = `${GH_API}/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${encodePathForUrl(repoPath)}?ref=${encodeURIComponent(branch)}`;
  const resp = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "article-studio-pr-worker"
    }
  });

  if (resp.status === 404) return null;
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`读取文件失败: ${txt}`);
  }

  const data = await resp.json();
  return data.sha || null;
}

async function getInstallationToken(env, appJwt) {
  const data = await ghFetch(
    `${GH_API}/app/installations/${env.GITHUB_INSTALLATION_ID}/access_tokens`,
    appJwt,
    { method: "POST" }
  );
  return data.token;
}

async function createAppJwt(appId, pem) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = { iat: now - 60, exp: now + 9 * 60, iss: String(appId) };

  const encodedHeader = toBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await importPrivateKeyFromPem(pem);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput)
  );

  const encodedSig = toBase64Url(new Uint8Array(signature));
  return `${signingInput}.${encodedSig}`;
}

async function importPrivateKeyFromPem(pem) {
  const pemText = String(pem || "").trim();
  if (!pemText) throw new Error("GITHUB_PRIVATE_KEY 为空");

  const isPkcs1 = /BEGIN RSA PRIVATE KEY/.test(pemText);
  const b64 = pemText
    .replace(/-----BEGIN [A-Z ]+-----/g, "")
    .replace(/-----END [A-Z ]+-----/g, "")
    .replace(/\s+/g, "");

  const der = base64ToBytes(b64);
  const pkcs8Bytes = isPkcs1 ? pkcs1ToPkcs8(der) : der;

  return crypto.subtle.importKey(
    "pkcs8",
    pkcs8Bytes.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function pkcs1ToPkcs8(pkcs1Bytes) {
  const version = Uint8Array.from([0x02, 0x01, 0x00]);
  const algId = Uint8Array.from([
    0x30, 0x0d,
    0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
    0x05, 0x00
  ]);
  const privateKeyOctet = derWrap(0x04, pkcs1Bytes);
  const body = concatBytes(version, algId, privateKeyOctet);
  return derWrap(0x30, body);
}

function derWrap(tag, content) {
  const len = derEncodeLength(content.length);
  return concatBytes(Uint8Array.from([tag]), len, content);
}

function derEncodeLength(length) {
  if (length < 0x80) return Uint8Array.from([length]);
  const bytes = [];
  let n = length;
  while (n > 0) {
    bytes.unshift(n & 0xff);
    n >>= 8;
  }
  return Uint8Array.from([0x80 | bytes.length, ...bytes]);
}

function concatBytes(...arrays) {
  const total = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const arr of arrays) {
    out.set(arr, offset);
    offset += arr.length;
  }
  return out;
}

function base64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function toBase64Url(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input) {
  const b64 = String(input || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padded = b64 + "===".slice((b64.length + 3) % 4);
  return atob(padded);
}

function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function randomId(length) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  let out = "";
  for (let i = 0; i < arr.length; i++) {
    out += chars[arr[i] % chars.length];
  }
  return out;
}

async function signToken(payload, secret, ttlSeconds) {
  if (!secret) throw new Error("SESSION_SIGNING_KEY 为空");

  const now = Math.floor(Date.now() / 1000);
  const data = {
    ...payload,
    iat: now,
    exp: now + Math.max(30, Number(ttlSeconds || 0))
  };

  const encoded = toBase64Url(new TextEncoder().encode(JSON.stringify(data)));
  const sig = await signHmacSha256(encoded, secret);
  return `${encoded}.${sig}`;
}

async function verifyToken(token, secret) {
  if (!secret) return null;

  const parts = String(token || "").split(".");
  if (parts.length !== 2) return null;

  const encoded = parts[0];
  const sig = parts[1];

  const expected = await signHmacSha256(encoded, secret);
  if (!timingSafeEqual(sig, expected)) return null;

  let payload;
  try {
    payload = JSON.parse(fromBase64Url(encoded));
  } catch (_) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload || typeof payload !== "object") return null;
  if (!payload.exp || Number(payload.exp) < now) return null;

  return payload;
}

async function signHmacSha256(text, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(text));
  return toBase64Url(new Uint8Array(sig));
}

function timingSafeEqual(a, b) {
  const sa = String(a || "");
  const sb = String(b || "");
  if (sa.length !== sb.length) return false;

  let diff = 0;
  for (let i = 0; i < sa.length; i++) {
    diff |= sa.charCodeAt(i) ^ sb.charCodeAt(i);
  }

  return diff === 0;
}
