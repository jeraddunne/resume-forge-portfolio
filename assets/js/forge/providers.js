/**
 * providers.js — one adapter, two providers.
 *
 * There is deliberately no "Claude build" and no "Codex build" of this site.
 * Both providers take the same {system, user} prompt and return text, so the
 * difference between them is data, not a second codebase. Everything that is
 * actually provider-specific lives in one object per provider below.
 *
 * The two providers use different *transports*, and that is a measured
 * decision, not a preference:
 *
 *   claude  — direct  : api.anthropic.com answers a CORS preflight with 200
 *                       and explicitly allows the
 *                       anthropic-dangerous-direct-browser-access header, so
 *                       the browser can call it with the visitor's own key.
 *
 *   codex   — handoff : api.toolkit.umgpt.umich.edu answers OPTIONS on
 *                       /v1/chat/completions with 401 in every variation
 *                       tested. Browsers never send Authorization on a
 *                       preflight and reject any preflight that is not 2xx,
 *                       so a browser call can never succeed. Instead of
 *                       standing up a proxy — which the project constraints
 *                       forbid, and which would put a U-M key on someone
 *                       else's server — this path hands the prompt to the
 *                       local `codex` CLI and takes the answer back.
 *
 * Evidence for both claims: docs/provider-transport-findings.md
 */

/** Never let a key reach a log, an error string, or the DOM. */
export const redact = (text, key) =>
  key && text ? String(text).split(key).join('[redacted-key]') : String(text ?? '');

const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com/v1/messages';

/**
 * Anthropic Messages API.
 * Raw fetch rather than @anthropic-ai/sdk: this site is deliberately a
 * no-build static deployment, so there is no bundler to install a package
 * into, and the same adapter shape has to serve a non-Anthropic provider.
 */
async function callClaude({ apiKey, model, system, user, signal }) {
  const modelConfig = PROVIDERS.claude.models.find((m) => m.id === model);

  const body = {
    model,
    // Deliberately small: the task is a one-bullet rewrite with three short
    // variants, not a long generation. Keeps a stranger's bill predictable.
    max_tokens: 2048,
    system,
    messages: [{ role: 'user', content: user }],
  };

  // effort is rejected by older small models, so it is a per-model property
  // rather than something sent unconditionally.
  if (modelConfig?.supportsEffort) {
    body.output_config = { effort: 'low' };
  }

  let response;
  try {
    response = await fetch(ANTHROPIC_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        // Required for browser-origin requests. Named "dangerous" because it
        // is only safe when the key belongs to the person at the keyboard —
        // which is exactly the bring-your-own-key case here.
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (networkError) {
    if (networkError.name === 'AbortError') throw networkError;
    throw new Error(
      'Could not reach api.anthropic.com. This is usually a network block, an ' +
        'extension interfering with the request, or the page being opened from a ' +
        'file:// URL instead of a web server.'
    );
  }

  const raw = await response.text();
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error(`Anthropic returned a non-JSON response (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    const detail = payload?.error?.message || `HTTP ${response.status}`;
    if (response.status === 401) {
      throw new Error('Anthropic rejected that API key (401). Check it and try again.');
    }
    if (response.status === 429) {
      throw new Error('Rate limited by Anthropic (429). Wait a moment and retry.');
    }
    if (response.status === 400 && /credit|balance/i.test(detail)) {
      throw new Error(`Anthropic rejected the request: ${detail}`);
    }
    throw new Error(redact(detail, apiKey));
  }

  if (payload.stop_reason === 'refusal') {
    throw new Error(
      'The model declined this request' +
        (payload.stop_details?.category ? ` (${payload.stop_details.category})` : '') +
        '. Try rephrasing the bullet.'
    );
  }

  const text = (payload.content || [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  if (!text) throw new Error('The model returned an empty response.');

  return {
    text,
    usage: payload.usage || null,
    model: payload.model || model,
  };
}

export const PROVIDERS = {
  claude: {
    id: 'claude',
    label: 'Claude (Anthropic)',
    transport: 'direct',
    blurb:
      'Your browser calls the Anthropic API directly with your key. Nothing passes through this site, ' +
      'because this site has no server to pass through.',
    keyLabel: 'Anthropic API key',
    keyPlaceholder: 'sk-ant-...',
    keyHelp: 'Create one at console.anthropic.com → API keys.',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    looksValid: (key) => /^sk-ant-/.test(key.trim()),
    keyWarning: 'Anthropic keys normally begin with "sk-ant-". Double-check you pasted the right one.',
    models: [
      { id: 'claude-opus-5', label: 'Claude Opus 5 — most capable', supportsEffort: true },
      { id: 'claude-sonnet-5', label: 'Claude Sonnet 5 — balanced', supportsEffort: true },
      { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 — fastest and cheapest', supportsEffort: false },
    ],
    run: callClaude,
  },

  codex: {
    id: 'codex',
    label: 'Codex (U-M GPT Toolkit)',
    transport: 'handoff',
    blurb:
      'The U-M Toolkit gateway rejects browser preflight requests, so no web page can call it — including ' +
      'this one. This panel builds the prompt and hands it to your local codex CLI instead, which means ' +
      'your U-M key never enters a web page at all.',
    cliCommand: 'codex exec --skip-git-repo-check -',
    models: [{ id: 'gpt-5.6-terra', label: 'gpt-5.6-terra (U-M Toolkit default)', supportsEffort: false }],
    run: () => {
      throw new Error(
        'The Codex provider is handoff-only in the browser. Use the copy button and run the prompt ' +
          'in your local codex CLI.'
      );
    },
  },
};

export const providerList = () => Object.values(PROVIDERS);
export const getProvider = (id) => PROVIDERS[id] || PROVIDERS.claude;
