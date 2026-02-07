const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('ai-chat edge function normalizes secret env and reports upstream auth hints', () => {
    const file = path.resolve('site/tooling/supabase/edge-functions/ai-chat/index.ts');
    const source = fs.readFileSync(file, 'utf8');

    assert.match(source, /const\s+SILICONFLOW_API_KEY\s*=\s*normalizeSecretEnv\(/);
    assert.match(source, /const\s+SILICONFLOW_BASE_URL\s*=\s*normalizeSiliconFlowBaseUrl\(/);
    assert.match(source, /const\s+MODEL_ID\s*=\s*normalizeModelId\(/);
    assert.match(source, /function\s+normalizeSecretEnv\s*\(/);
    assert.match(source, /function\s+normalizeSiliconFlowBaseUrl\s*\(/);
    assert.match(source, /function\s+normalizeModelId\s*\(/);
    assert.match(source, /HTTP\s+401\s*\(check\s+SILICONFLOW_API_KEY\s+and\s+model\s+access\)/);
    assert.match(source, /SiliconFlow error \(model=\$\{MODEL_ID\}, base=\$\{SILICONFLOW_BASE_URL\}\):/);
    assert.match(source, /codePrefix/);
    assert.match(source, /function\s+extractSiliconFlowError\s*\(/);
});
