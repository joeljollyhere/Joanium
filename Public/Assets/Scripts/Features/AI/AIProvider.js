// ─────────────────────────────────────────────
//  openworld — Public/Assets/Scripts/Features/AI/AIProvider.js
//  Provider adapters with NATIVE function/tool calling support.
//  Each provider has its own tool format — we normalize here.
// ─────────────────────────────────────────────

function extractBase64(dataUrl) {
  return String(dataUrl ?? '').split(',', 2)[1] ?? '';
}

function normalizeMessage(msg) {
  return {
    role:        msg?.role ?? 'user',
    content:     String(msg?.content ?? ''),
    attachments: Array.isArray(msg?.attachments)
      ? msg.attachments.filter(a => a?.type === 'image' && typeof a.dataUrl === 'string')
      : [],
  };
}

function buildAnthropicContent(msg) {
  const blocks = [];
  if (msg.content) blocks.push({ type: 'text', text: msg.content });
  msg.attachments.forEach(a => blocks.push({
    type: 'image',
    source: { type: 'base64', media_type: a.mimeType || 'image/png', data: extractBase64(a.dataUrl) },
  }));
  if (blocks.length === 1 && blocks[0].type === 'text') return msg.content;
  return blocks;
}

function buildGoogleParts(msg) {
  const parts = [];
  if (msg.content) parts.push({ text: msg.content });
  msg.attachments.forEach(a => parts.push({
    inlineData: { mimeType: a.mimeType || 'image/png', data: extractBase64(a.dataUrl) },
  }));
  return parts;
}

function buildOpenAIContent(msg) {
  if (!msg.attachments.length) return msg.content;
  const parts = [];
  if (msg.content) parts.push({ type: 'text', text: msg.content });
  msg.attachments.forEach(a => parts.push({ type: 'image_url', image_url: { url: a.dataUrl } }));
  return parts;
}

/* ══════════════════════════════════════════
   TOOL FORMAT CONVERTERS
   Each provider wants tools in a different shape.
══════════════════════════════════════════ */

/**
 * Convert our tool definitions to Anthropic format.
 * https://docs.anthropic.com/en/docs/tool-use
 */
function toAnthropicTools(tools) {
  return tools.map(t => ({
    name:        t.name,
    description: t.description,
    input_schema: {
      type:       'object',
      properties: Object.fromEntries(
        Object.entries(t.parameters).map(([key, p]) => [
          key,
          { type: p.type, description: p.description },
        ])
      ),
      required: Object.entries(t.parameters)
        .filter(([, p]) => p.required)
        .map(([k]) => k),
    },
  }));
}

/**
 * Convert our tool definitions to OpenAI/OpenRouter format.
 */
function toOpenAITools(tools) {
  return tools.map(t => ({
    type: 'function',
    function: {
      name:        t.name,
      description: t.description,
      parameters: {
        type:       'object',
        properties: Object.fromEntries(
          Object.entries(t.parameters).map(([key, p]) => [
            key,
            { type: p.type, description: p.description },
          ])
        ),
        required: Object.entries(t.parameters)
          .filter(([, p]) => p.required)
          .map(([k]) => k),
      },
    },
  }));
}

/**
 * Convert our tool definitions to Google Gemini format.
 */
function toGoogleTools(tools) {
  return [{
    functionDeclarations: tools.map(t => ({
      name:        t.name,
      description: t.description,
      parameters: {
        type:       'object',
        properties: Object.fromEntries(
          Object.entries(t.parameters).map(([key, p]) => [
            key,
            { type: p.type.toUpperCase(), description: p.description },
          ])
        ),
        required: Object.entries(t.parameters)
          .filter(([, p]) => p.required)
          .map(([k]) => k),
      },
    })),
  }];
}

/* ══════════════════════════════════════════
   TOOL CALL RESULT TYPE
   { type: 'text', text: string }
   { type: 'tool_call', name: string, params: object, callId: string }
══════════════════════════════════════════ */

/* ══════════════════════════════════════════
   MAIN FETCH — TEXT ONLY (existing behaviour)
══════════════════════════════════════════ */
export async function fetchFromProvider(provider, modelId, messages, sysPrompt = '') {
  const result = await fetchWithTools(provider, modelId, messages, sysPrompt, []);
  if (result.type === 'text') return result.text;
  return '(unexpected tool call in text-only mode)';
}

/* ══════════════════════════════════════════
   MAIN FETCH — WITH NATIVE TOOL CALLING
   Returns { type: 'text', text } or { type: 'tool_call', name, params, callId }
══════════════════════════════════════════ */
export async function fetchWithTools(provider, modelId, messages, sysPrompt = '', tools = []) {
  const { provider: providerId, endpoint, api, auth_header, auth_prefix = '' } = provider;
  const history = messages.slice(-20).map(normalizeMessage);

  /* ── Anthropic ── */
  if (providerId === 'anthropic') {
    const body = {
      model:      modelId,
      max_tokens: 2048,
      messages:   history.map(m => ({ role: m.role, content: buildAnthropicContent(m) })),
    };
    if (sysPrompt) body.system = sysPrompt;
    if (tools.length) body.tools = toAnthropicTools(tools);

    const res = await fetch(endpoint, {
      method:  'POST',
      headers: {
        'content-type':      'application/json',
        'x-api-key':         api,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message ?? `HTTP ${res.status}`); }

    const data = await res.json();

    // Check for tool_use block
    const toolUseBlock = data.content?.find(b => b.type === 'tool_use');
    if (toolUseBlock) {
      return {
        type:   'tool_call',
        name:   toolUseBlock.name,
        params: toolUseBlock.input ?? {},
        callId: toolUseBlock.id,
      };
    }

    return { type: 'text', text: data.content?.find(b => b.type === 'text')?.text ?? '(empty response)' };
  }

  /* ── Google Gemini ── */
  if (providerId === 'google') {
    const url  = endpoint.replace('{model}', modelId) + `?key=${api}`;
    const body = {
      contents: history.map(m => ({
        role:  m.role === 'assistant' ? 'model' : 'user',
        parts: buildGoogleParts(m),
      })),
    };
    if (sysPrompt) body.systemInstruction = { parts: [{ text: sysPrompt }] };
    if (tools.length) body.tools = toGoogleTools(tools);

    const res = await fetch(url, {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message ?? `HTTP ${res.status}`); }

    const data = await res.json();
    const part = data.candidates?.[0]?.content?.parts?.[0];

    if (part?.functionCall) {
      return {
        type:   'tool_call',
        name:   part.functionCall.name,
        params: part.functionCall.args ?? {},
        callId: null,
      };
    }

    return { type: 'text', text: part?.text ?? '(empty response)' };
  }

  /* ── OpenAI / OpenRouter / Mistral ── */
  const openAIMessages = [
    ...(sysPrompt ? [{ role: 'system', content: sysPrompt }] : []),
    ...history.map(m => ({ role: m.role, content: buildOpenAIContent(m) })),
  ];

  const body = { model: modelId, messages: openAIMessages };
  if (tools.length) {
    body.tools       = toOpenAITools(tools);
    body.tool_choice = 'auto';
  }

  const res = await fetch(endpoint, {
    method:  'POST',
    headers: {
      'content-type': 'application/json',
      [auth_header]:  `${auth_prefix}${api}`,
      ...(providerId === 'openrouter'
        ? { 'HTTP-Referer': 'https://openworld.app', 'X-Title': 'openworld' }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message ?? `HTTP ${res.status}`); }

  const data    = await res.json();
  const message = data.choices?.[0]?.message;

  if (message?.tool_calls?.length) {
    const tc = message.tool_calls[0];
    return {
      type:   'tool_call',
      name:   tc.function.name,
      params: JSON.parse(tc.function.arguments ?? '{}'),
      callId: tc.id,
    };
  }

  return { type: 'text', text: message?.content ?? '(empty response)' };
}
