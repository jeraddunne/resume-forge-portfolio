/**
 * forge.js — UI controller for the bring-your-own-key panel.
 *
 * Responsibilities kept deliberately narrow: read the form, ask the selected
 * provider adapter to run the prompt, render the result. It knows nothing
 * about either API's wire format — that is providers.js — and it never stores
 * a key itself — that is key-store.js.
 */

import { getProvider, providerList, redact } from './providers.js';
import { bulletPrompt, asPlainPrompt } from './prompts.js';
import * as keyStore from './key-store.js';

const $ = (id) => document.getElementById(id);

const els = {
  root: $('forge-panel'),
  providerInputs: () => Array.from(document.querySelectorAll('input[name="forge-provider"]')),
  note: $('forge-provider-note'),
  directBlock: $('forge-direct-block'),
  handoffBlock: $('forge-handoff-block'),
  model: $('forge-model'),
  key: $('forge-key'),
  remember: $('forge-remember'),
  forget: $('forge-forget'),
  keyStatus: $('forge-key-status'),
  keyLink: $('forge-key-link'),
  mode: $('forge-mode'),
  role: $('forge-role'),
  bullet: $('forge-bullet'),
  run: $('forge-run'),
  copy: $('forge-copy'),
  cliCommand: $('forge-cli-command'),
  paste: $('forge-paste'),
  render: $('forge-render'),
  status: $('forge-status'),
  output: $('forge-output'),
  usage: $('forge-usage'),
  privacy: $('forge-privacy'),
};

let inFlight = null;

function currentProviderId() {
  const checked = els.providerInputs().find((input) => input.checked);
  return checked ? checked.value : 'claude';
}

function setStatus(message, tone = 'info') {
  els.status.textContent = message;
  els.status.dataset.tone = tone;
  els.status.hidden = !message;
}

function setOutput(text) {
  // textContent, never innerHTML: model output is untrusted text and must
  // never be parsed as markup on this page.
  els.output.textContent = text || '';
  els.output.hidden = !text;
}

function populateModels(provider) {
  els.model.innerHTML = '';
  provider.models.forEach((model) => {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = model.label;
    els.model.appendChild(option);
  });
}

function refreshKeyStatus(provider) {
  if (provider.transport !== 'direct') return;

  const stored = keyStore.loadKey(provider.id);
  if (stored) {
    els.key.value = stored;
    els.keyStatus.textContent = 'A key is held for this browser tab only. It is cleared when you close the tab.';
    els.keyStatus.dataset.tone = 'ok';
  } else if (!keyStore.storageAvailable()) {
    els.keyStatus.textContent =
      'Session storage is blocked in this browser, so the key cannot be remembered even for this tab. The panel still works — you will just retype it.';
    els.keyStatus.dataset.tone = 'warn';
  } else {
    els.keyStatus.textContent = 'No key stored.';
    els.keyStatus.dataset.tone = 'info';
  }

  if (keyStore.leakedToLocalStorage()) {
    els.keyStatus.textContent =
      'A key was found in localStorage, which this page never writes to. Click "Forget key" to remove it.';
    els.keyStatus.dataset.tone = 'error';
  }
}

function applyProvider() {
  const provider = getProvider(currentProviderId());
  const isDirect = provider.transport === 'direct';

  els.note.textContent = provider.blurb;
  els.directBlock.hidden = !isDirect;
  els.handoffBlock.hidden = isDirect;
  els.run.hidden = !isDirect;
  els.copy.hidden = isDirect;

  populateModels(provider);

  if (isDirect) {
    els.key.placeholder = provider.keyPlaceholder || '';
    els.key.setAttribute('aria-label', provider.keyLabel || 'API key');
    if (provider.keyUrl) {
      els.keyLink.href = provider.keyUrl;
      els.keyLink.textContent = provider.keyHelp || 'Get a key';
      els.keyLink.hidden = false;
    } else {
      els.keyLink.hidden = true;
    }
    refreshKeyStatus(provider);
  } else {
    els.cliCommand.textContent = provider.cliCommand || '';
  }

  setStatus('');
  setOutput('');
  els.usage.hidden = true;
}

function readForm() {
  const bullet = els.bullet.value.trim();
  if (!bullet) {
    setStatus('Paste a resume bullet first.', 'error');
    els.bullet.focus();
    return null;
  }
  return bulletPrompt({
    bullet,
    targetRole: els.role.value.trim(),
    mode: els.mode.value,
  });
}

async function runDirect() {
  const provider = getProvider(currentProviderId());
  const prompt = readForm();
  if (!prompt) return;

  const apiKey = els.key.value.trim();
  if (!apiKey) {
    setStatus('Enter your API key. It stays in this browser.', 'error');
    els.key.focus();
    return;
  }
  if (provider.looksValid && !provider.looksValid(apiKey)) {
    setStatus(provider.keyWarning || 'That key does not look right.', 'warn');
  }

  if (els.remember.checked) {
    keyStore.saveKey(provider.id, apiKey);
  } else {
    keyStore.clearKey(provider.id);
  }

  const controller = new AbortController();
  inFlight = controller;
  els.run.disabled = true;
  els.run.textContent = 'Working…';
  setStatus(`Sending to ${provider.label}. Your text goes to them, not to this site.`, 'info');
  setOutput('');
  els.usage.hidden = true;

  try {
    const result = await provider.run({
      apiKey,
      model: els.model.value,
      system: prompt.system,
      user: prompt.user,
      signal: controller.signal,
    });

    setOutput(result.text);
    setStatus('Done. Check every claim against your own records before you use it.', 'ok');

    if (result.usage) {
      const inTok = result.usage.input_tokens ?? 0;
      const outTok = result.usage.output_tokens ?? 0;
      els.usage.textContent = `${result.model} · ${inTok} in / ${outTok} out tokens · billed to your key`;
      els.usage.hidden = false;
    }
    refreshKeyStatus(provider);
  } catch (error) {
    if (error.name === 'AbortError') {
      setStatus('Cancelled.', 'info');
    } else {
      setStatus(redact(error.message, apiKey), 'error');
    }
  } finally {
    inFlight = null;
    els.run.disabled = false;
    els.run.textContent = 'Rewrite bullet';
  }
}

async function copyPrompt() {
  const prompt = readForm();
  if (!prompt) return;

  const text = asPlainPrompt(prompt);
  try {
    await navigator.clipboard.writeText(text);
    setStatus('Prompt copied. Paste it into your codex CLI, then bring the answer back below.', 'ok');
  } catch {
    // Clipboard API needs a secure context and permission; fall back to
    // showing the text so it can be selected by hand.
    setOutput(text);
    setStatus('Clipboard unavailable — the prompt is shown below, select and copy it.', 'warn');
  }
}

function renderPasted() {
  const pasted = els.paste.value.trim();
  if (!pasted) {
    setStatus('Paste the CLI output first.', 'error');
    els.paste.focus();
    return;
  }
  setOutput(pasted);
  setStatus('Shown as returned by your CLI. Nothing was sent from this page.', 'ok');
}

function init() {
  // Build the provider radios from the adapter list, so adding a provider is
  // a one-object change in providers.js and not an HTML edit.
  const fieldset = $('forge-provider-choices');
  providerList().forEach((provider, index) => {
    const id = `forge-provider-${provider.id}`;
    const wrapper = document.createElement('label');
    wrapper.className = 'forge-radio';
    wrapper.setAttribute('for', id);
    wrapper.innerHTML =
      `<input type="radio" id="${id}" name="forge-provider" value="${provider.id}"${index === 0 ? ' checked' : ''}>` +
      `<span></span>`;
    wrapper.querySelector('span').textContent = provider.label;
    fieldset.appendChild(wrapper);
  });

  els.providerInputs().forEach((input) => input.addEventListener('change', applyProvider));
  els.run.addEventListener('click', runDirect);
  els.copy.addEventListener('click', copyPrompt);
  els.render.addEventListener('click', renderPasted);

  els.forget.addEventListener('click', () => {
    keyStore.purge();
    els.key.value = '';
    els.remember.checked = false;
    refreshKeyStatus(getProvider(currentProviderId()));
    setStatus('Key cleared from this browser.', 'ok');
    els.key.focus();
  });

  // Submitting the form would reload the page and drop the key mid-request.
  $('forge-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (getProvider(currentProviderId()).transport === 'direct') runDirect();
    else copyPrompt();
  });

  window.addEventListener('pagehide', () => {
    if (inFlight) inFlight.abort();
  });

  els.privacy.textContent = keyStore.storageAvailable()
    ? 'This page has no backend. Your key is held in sessionStorage for this tab only, is sent only to the provider you picked, and is never written to localStorage, a cookie, or a server.'
    : 'This page has no backend. Your browser is blocking site storage, so the key is held in memory only and disappears on reload.';

  applyProvider();
}

// The panel is optional markup. If the article is not on the page — an older
// cached index.html, or a stripped-down copy of this repo — do nothing rather
// than throw, which would take out any script that loads after this one.
if (els.root) init();
