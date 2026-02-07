import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type CooldownRow = {
    allowed: boolean;
    retry_after_sec: number;
    next_allowed_at: string;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const PR_AUTH_ME_URL = Deno.env.get("PR_AUTH_ME_URL") || "";
const SILICONFLOW_API_KEY = Deno.env.get("SILICONFLOW_API_KEY") || "";
const SILICONFLOW_BASE_URL = (Deno.env.get("SILICONFLOW_BASE_URL") || "https://api.siliconflow.com/v1").replace(/\/+$/, "");
const MODEL_ID = Deno.env.get("MODEL_ID") || "Qwen/Qwen3-8B";
const AI_COOLDOWN_SECONDS = toPositiveInt(Deno.env.get("AI_COOLDOWN_SECONDS"), 120);
const MAX_PROMPT_CHARS = toPositiveInt(Deno.env.get("MAX_PROMPT_CHARS"), 6000);

const allowedOrigins = String(Deno.env.get("ALLOWED_ORIGIN") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

Deno.serve(async (request) => {
    const origin = request.headers.get("origin") || "";

    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: corsHeaders(origin)
        });
    }

    if (request.method !== "POST") {
        return json({ ok: false, error: "Method Not Allowed" }, 405, origin);
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return json({ ok: false, error: "Missing Supabase env" }, 500, origin);
    }

    if (!PR_AUTH_ME_URL) {
        return json({ ok: false, error: "Missing env: PR_AUTH_ME_URL" }, 500, origin);
    }

    if (!SILICONFLOW_API_KEY) {
        return json({ ok: false, error: "Missing env: SILICONFLOW_API_KEY" }, 500, origin);
    }

    if (origin && !isAllowedOrigin(origin)) {
        return json({ ok: false, error: "Origin not allowed" }, 403, origin);
    }

    const authToken = readBearerToken(request.headers.get("authorization") || "");
    if (!authToken) {
        return json({ ok: false, error: "Unauthorized" }, 401, origin);
    }

    let payload: { prompt?: unknown };
    try {
        payload = await request.json();
    } catch {
        return json({ ok: false, error: "Invalid JSON" }, 400, origin);
    }

    const prompt = String(payload.prompt || "").trim();
    if (!prompt) {
        return json({ ok: false, error: "prompt is required" }, 400, origin);
    }

    if (prompt.length > MAX_PROMPT_CHARS) {
        return json({ ok: false, error: `prompt too long (> ${MAX_PROMPT_CHARS})` }, 400, origin);
    }

    const verifyResult = await verifyGithubUser(authToken);
    if (!verifyResult.ok || !verifyResult.user) {
        return json({ ok: false, error: "Unauthorized" }, 401, origin);
    }

    const githubUser = verifyResult.user;

    const cooldownCheck = await consumeCooldown(githubUser);
    if (!cooldownCheck.ok) {
        return json({ ok: false, error: cooldownCheck.error || "Cooldown check failed" }, 500, origin);
    }

    if (!cooldownCheck.allowed) {
        const retryAfter = Math.max(1, cooldownCheck.retryAfterSec);
        return json({ ok: false, error: "Too Many Requests", retry_after_sec: retryAfter }, 429, origin, {
            "Retry-After": String(retryAfter)
        });
    }

    const aiResult = await callSiliconFlow(prompt);
    if (!aiResult.ok) {
        return json({ ok: false, error: aiResult.error || "Upstream AI failed" }, 502, origin);
    }

    return json(
        {
            ok: true,
            text: aiResult.text,
            model: MODEL_ID,
            user: githubUser
        },
        200,
        origin
    );
});

function isAllowedOrigin(origin: string): boolean {
    if (!origin) return true;
    if (allowedOrigins.length === 0) return true;
    if (allowedOrigins.includes("*")) return true;
    return allowedOrigins.includes(origin);
}

function corsHeaders(origin: string): Record<string, string> {
    const allowOrigin = isAllowedOrigin(origin) ? (origin || "*") : "null";
    return {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type, authorization",
        "Access-Control-Max-Age": "86400"
    };
}

function json(
    data: unknown,
    status: number,
    origin: string,
    extraHeaders: Record<string, string> = {}
): Response {
    return new Response(JSON.stringify(data, null, 2), {
        status,
        headers: {
            "content-type": "application/json; charset=utf-8",
            ...corsHeaders(origin),
            ...extraHeaders
        }
    });
}

function toPositiveInt(input: string | undefined, fallbackValue: number): number {
    const parsed = Number.parseInt(String(input || ""), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallbackValue;
    return parsed;
}

function readBearerToken(authHeader: string): string {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) return "";
    return String(match[1] || "").trim();
}

async function verifyGithubUser(token: string): Promise<{ ok: boolean; user: string }> {
    try {
        const response = await fetch(PR_AUTH_ME_URL, {
            method: "GET",
            headers: {
                authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return { ok: false, user: "" };
        }

        const body = await response.json().catch(() => null);
        const user = body && body.ok === true ? String(body.user || "").trim() : "";

        if (!user) {
            return { ok: false, user: "" };
        }

        return { ok: true, user };
    } catch {
        return { ok: false, user: "" };
    }
}

async function consumeCooldown(githubUser: string): Promise<{
    ok: boolean;
    allowed: boolean;
    retryAfterSec: number;
    error?: string;
}> {
    const { data, error } = await supabase.rpc("consume_ai_cooldown", {
        p_github_user: githubUser,
        p_cooldown_seconds: AI_COOLDOWN_SECONDS
    });

    if (error) {
        return {
            ok: false,
            allowed: false,
            retryAfterSec: 0,
            error: error.message
        };
    }

    const row = Array.isArray(data) ? (data[0] as CooldownRow | undefined) : undefined;
    if (!row) {
        return {
            ok: false,
            allowed: false,
            retryAfterSec: 0,
            error: "Invalid cooldown response"
        };
    }

    return {
        ok: true,
        allowed: !!row.allowed,
        retryAfterSec: Number(row.retry_after_sec || 0)
    };
}

async function callSiliconFlow(prompt: string): Promise<{ ok: boolean; text: string; error?: string }> {
    try {
        const response = await fetch(`${SILICONFLOW_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${SILICONFLOW_API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL_ID,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                stream: false
            })
        });

        const rawText = await response.text();
        const body = rawText ? JSON.parse(rawText) : null;

        if (!response.ok) {
            const message = body && body.error && body.error.message
                ? String(body.error.message)
                : `HTTP ${response.status}`;
            return { ok: false, text: "", error: `SiliconFlow error: ${message}` };
        }

        const content = body && body.choices && body.choices[0] && body.choices[0].message
            ? body.choices[0].message.content
            : "";

        const text = normalizeAssistantContent(content);
        if (!text) {
            return { ok: false, text: "", error: "Empty model output" };
        }

        return { ok: true, text };
    } catch (error) {
        return {
            ok: false,
            text: "",
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

function normalizeAssistantContent(content: unknown): string {
    if (typeof content === "string") {
        return content.trim();
    }

    if (Array.isArray(content)) {
        return content
            .map((item) => {
                if (typeof item === "string") return item;
                if (!item || typeof item !== "object") return "";
                const maybeText = (item as { text?: unknown; content?: unknown }).text ?? (item as { content?: unknown }).content;
                return typeof maybeText === "string" ? maybeText : "";
            })
            .join("")
            .trim();
    }

    return "";
}
