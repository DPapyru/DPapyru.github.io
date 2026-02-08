# ai-chat Edge Function deployment checklist

## 1) Create function in Supabase Dashboard

- Go to `Edge Functions`.
- Click `Create a new function`.
- Name it `ai-chat`.
- Replace generated code with `index.ts` from this folder.
- Deploy.

## 2) Set secrets

In `Edge Functions -> Secrets`, add:

- `PR_AUTH_ME_URL` = your Worker auth endpoint, for example `https://<your-worker-domain>/auth/me`
- `SILICONFLOW_API_KEY` = your SiliconFlow API key
- `SILICONFLOW_BASE_URL` = `https://api.siliconflow.com/v1`
- `MODEL_ID` = your model id, for example `Pro/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B`
- `AI_COOLDOWN_SECONDS` = `60`
- `MAX_PROMPT_CHARS` = `6000`
- `ALLOWED_ORIGIN` = `https://dpapyru.github.io`

## 3) Test endpoint

After deploy, call:

- `POST https://<project-ref>.supabase.co/functions/v1/ai-chat`
- Headers:
  - `content-type: application/json`
  - `authorization: Bearer <oauth_token_from_github_login>`
- Body:

```json
{
  "prompt": "hello"
}
```

## 4) Fill frontend endpoint

In `viewer` page floating AI panel, set `AI API address` to:

- `https://<project-ref>.supabase.co/functions/v1/ai-chat`
