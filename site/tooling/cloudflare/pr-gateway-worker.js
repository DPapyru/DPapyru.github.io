const GH_API = "https://api.github.com";

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin, env) });
    }

    try {
      const url = new URL(request.url);

      if (request.method !== "POST") {
        return json({ ok: false, error: "Method Not Allowed" }, 405, origin, env);
      }

      const isCreatePr = url.pathname === "/api/create-pr";
      const isPreflightCheck = url.pathname === "/api/preflight-check";
      if (!isCreatePr && !isPreflightCheck) {
        return json({ ok: false, error: "Not Found" }, 404, origin, env);
      }

      if (origin && !isAllowedOrigin(origin, env)) {
        return json({ ok: false, error: "Origin not allowed" }, 403, origin, env);
      }

      const key = request.headers.get("x-studio-key") || "";
      const bearer = String(request.headers.get("authorization") || "").trim();
      const hasBearer = /^Bearer\s+.+/.test(bearer);
      if (!hasBearer && (!env.STUDIO_SHARED_KEY || key !== env.STUDIO_SHARED_KEY)) {
        return json({ ok: false, error: "Unauthorized" }, 401, origin, env);
      }

      const body = await request.json();

      if (isPreflightCheck) {
        const result = await handlePreflightCheck(body, env);
        const hasErrors = Array.isArray(result.errors) && result.errors.length > 0;
        return json(result, hasErrors ? 409 : 200, origin, env);
      }

      const targetPath = sanitizeTargetPath(body.targetPath);
      const markdown = String(body.markdown || "");
      const prTitleInput = String(body.prTitle || "");
      const prBodyInput = String(body.prBody || "");
      const existingPrNumber = parseExistingPrNumber(body.existingPrNumber);
      const extraFiles = normalizeExtraFiles(body.extraFiles || []);

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

      let branch = "";
      let reusedExistingPr = false;
      let currentPrNumber = 0;
      let currentPrUrl = "";

      if (existingPrNumber > 0) {
        const existingPr = await getPullRequestByNumber(env, existingPrNumber, installationToken);
        ensurePullRequestReusable(existingPr, baseBranch);

        branch = normalizeRefName(existingPr.head && existingPr.head.ref);
        if (!branch) {
          throw new Error("无法获取目标 PR 的 head 分支");
        }

        reusedExistingPr = true;
        currentPrNumber = Number(existingPr.number || 0);
        currentPrUrl = String(existingPr.html_url || "");
      } else {
        const baseHeadSha = await getBranchHeadSha(env, baseBranch, installationToken);
        branch = makeBranchName(targetPath);

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
      }

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

      for (const file of extraFiles) {
        const extraSha = await getExistingFileSha(env, file.path, branch, installationToken);
        const extraBase64 = file.encoding === "base64" ? file.content : utf8ToBase64(file.content);

        await ghFetch(
          `${GH_API}/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${encodePathForUrl(file.path)}`,
          installationToken,
          {
            method: "PUT",
            body: JSON.stringify({
              message: `docs: update ${file.path} via article studio`,
              content: extraBase64,
              branch,
              sha: extraSha || undefined
            })
          }
        );
      }

      const prTitle = (prTitleInput || `docs: 更新 ${targetPath}`).slice(0, 120);
      const prBody =
        prBodyInput ||
        [
          "Created by Article Studio.",
          "",
          `- File: \`${repoPath}\``,
          `- Extra files: ${extraFiles.length}`,
          `- Branch: \`${branch}\``
        ].join("\n");

      if (!reusedExistingPr) {
        const pr = await ghFetch(
          `${GH_API}/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/pulls`,
          installationToken,
          {
            method: "POST",
            body: JSON.stringify({
              title: prTitle,
              head: branch,
              base: baseBranch,
              body: prBody
            })
          }
        );

        currentPrNumber = Number(pr.number || 0);
        currentPrUrl = String(pr.html_url || "");
      }

      return json(
        {
          ok: true,
          prUrl: currentPrUrl,
          prNumber: currentPrNumber,
          branch,
          filePath: repoPath,
          extraFiles: extraFiles.map((f) => f.path),
          reusedExistingPr
        },
        200,
        origin,
        env
      );
    } catch (err) {
      return json(
        { ok: false, error: err && err.message ? err.message : String(err) },
        500,
        origin,
        env
      );
    }
  }
};

function isAllowedOrigin(origin, env) {
  const list = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0) return true;
  return list.includes(origin);
}

function corsHeaders(origin, env) {
  const allowOrigin = isAllowedOrigin(origin, env) ? origin || "*" : "null";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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

function sanitizeExtraFilePath(input) {
  let p = String(input || "").trim().replace(/\\/g, "/");
  p = p.replace(/^\/+/, "");
  p = p.replace(/\/{2,}/g, "/");

  if (!p) throw new Error("extra file path 为空");
  if (p.includes("..")) throw new Error("extra file path 非法");

  const isShaderGalleryFile = /^site\/content\/shader-gallery\/[a-z0-9](?:[a-z0-9-]{0,62})\/(?:entry|shader)\.json$/i.test(p);
  const isArticleImageFile = /^site\/content\/.+\/imgs\/[a-z0-9\u4e00-\u9fa5_-]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp|avif)$/i.test(p);
  const isArticleMediaFile = /^site\/content\/.+\/media\/[a-z0-9\u4e00-\u9fa5_-]+\.(?:mp4|webm)$/i.test(p);
  const isArticleCsharpFile = /^site\/content\/.+\/code\/[a-z0-9\u4e00-\u9fa5_-]+\.cs$/i.test(p);
  if (!isShaderGalleryFile && !isArticleImageFile && !isArticleMediaFile && !isArticleCsharpFile) {
    throw new Error("extra file 只允许 site/content/shader-gallery/<slug>/(entry|shader).json、site/content/**/imgs/*.{png,jpg,jpeg,gif,webp,svg,bmp,avif}、site/content/**/media/*.{mp4,webm} 或 site/content/**/code/*.cs");
  }

  return p;
}

function normalizeExtraFiles(input) {
  if (!Array.isArray(input)) return [];
  if (input.length > 8) throw new Error("extraFiles 数量不能超过 8");

  return input.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`extraFiles[${index}] 必须是对象`);
    }

    const path = sanitizeExtraFilePath(item.path);
    const content = String(item.content || "");
    const encoding = String(item.encoding || "utf8").trim().toLowerCase();
    const isBase64 = encoding === "base64";

    if (!isBase64 && encoding !== "utf8") {
      throw new Error(`extraFiles[${index}] encoding 非法`);
    }

    if (!content.trim()) {
      throw new Error(`extraFiles[${index}] content 不能为空`);
    }

    const isVideoMediaFile = /^site\/content\/.+\/media\/[a-z0-9\u4e00-\u9fa5_-]+\.(?:mp4|webm)$/i.test(path);

    if (isBase64) {
      if (!/^[A-Za-z0-9+/=\s]+$/.test(content)) {
        throw new Error(`extraFiles[${index}] base64 content 非法`);
      }
      const maxBase64Length = isVideoMediaFile
        ? Math.ceil((10 * 1024 * 1024 * 4) / 3)
        : 3200000;
      if (content.length > maxBase64Length) {
        if (isVideoMediaFile) {
          throw new Error(`extraFiles[${index}] base64 content 过大（>10MB 原始视频）`);
        }
        throw new Error(`extraFiles[${index}] base64 content 过大（>3.2MB）`);
      }
    } else if (content.length > 200000) {
      throw new Error(`extraFiles[${index}] content 过大（>200KB）`);
    }

    return {
      path,
      content: isBase64 ? content.replace(/\s+/g, "") : content,
      encoding: isBase64 ? "base64" : "utf8"
    };
  });
}

async function handlePreflightCheck(body, env) {
  const mode = String(body && body.mode || "hard").trim().toLowerCase() === "soft" ? "soft" : "hard";
  const targetPath = sanitizeTargetPath(body && body.targetPath);
  const markdown = String(body && body.markdown || "");
  const extraFiles = normalizeExtraFiles(body && body.extraFiles || []);
  const errors = [];
  const warnings = [];

  if (!markdown.trim()) {
    errors.push({
      code: "empty_markdown",
      path: `site/content/${targetPath}`,
      message: "markdown 不能为空"
    });
  }

  if (markdown.length > 300000) {
    errors.push({
      code: "markdown_too_large",
      path: `site/content/${targetPath}`,
      message: "markdown 过大（>300KB）"
    });
  }

  const localSeen = new Set();
  for (const file of extraFiles) {
    const key = String(file.path || "").toLowerCase();
    if (!key) continue;
    if (localSeen.has(key)) {
      errors.push({
        code: "duplicate_extra_path",
        path: file.path,
        message: "extraFiles 中出现重复路径"
      });
      continue;
    }
    localSeen.add(key);
  }

  const csharpFiles = extraFiles.filter((file) => /\.cs$/i.test(String(file.path || "")));
  if (csharpFiles.length > 0) {
    const appJwt = await createAppJwt(env.GITHUB_APP_ID, env.GITHUB_PRIVATE_KEY);
    const installationToken = await getInstallationToken(env, appJwt);
    const baseBranch = env.GITHUB_BASE_BRANCH || "main";

    for (const file of csharpFiles) {
      const existingSha = await getExistingFileSha(env, file.path, baseBranch, installationToken);
      if (existingSha) {
        errors.push({
          code: "repo_path_conflict",
          path: file.path,
          message: "仓库中已存在同路径 C# 文件，请重命名后重试"
        });
      }
    }
  }

  return {
    ok: errors.length === 0,
    mode,
    targetPath,
    checkedFiles: extraFiles.map((file) => file.path),
    warnings,
    errors
  };
}

function parseExistingPrNumber(input) {
  const text = String(input || "").trim();
  if (!text) return 0;
  const num = Number(text);
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error("existingPrNumber 非法");
  }
  return num;
}

function normalizeRefName(value) {
  const ref = String(value || "").trim();
  if (!ref) return "";
  return ref.replace(/^refs\/heads\//i, "");
}

async function getPullRequestByNumber(env, prNumber, token) {
  return ghFetch(
    `${GH_API}/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/pulls/${encodeURIComponent(String(prNumber))}`,
    token
  );
}

function ensurePullRequestReusable(pr, baseBranch) {
  if (!pr || Number(pr.number || 0) <= 0) {
    throw new Error("目标 PR 不存在");
  }

  if (String(pr.state || "").toLowerCase() !== "open") {
    throw new Error("目标 PR 已关闭，无法继续提交");
  }

  const currentBase = String(pr.base && pr.base.ref || "").trim();
  if (currentBase !== String(baseBranch || "").trim()) {
    throw new Error(`目标 PR 的 base 分支不是 ${baseBranch}`);
  }
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

function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
