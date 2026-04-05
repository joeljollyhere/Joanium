import { state } from '../System/State.js';
import { createModal } from '../System/ModalFactory.js';
import { loadConnectorsPanel } from '../Pages/Shared/Connectors/index.js';
import { loadMCPPanel } from '../Pages/Shared/MCP/index.js';
import { loadChannelsPanel } from '../Pages/Channels/Features/index.js';
import { PROVIDERS, PROVIDERS_BY_ID } from '../Pages/Setup/UI/Render/Providers/SetupProviders.js';

const PROVIDER_ORDER = new Map(PROVIDERS.map((provider, index) => [provider.id, index]));

function getInitials(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0] ?? 'OW').slice(0, 2).toUpperCase();
}

function buildHTML() {
  return `
    <div id="settings-modal-backdrop">
      <div id="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
        <div class="settings-modal-header">
          <div class="settings-modal-copy">
            <h2 id="settings-modal-title">Workspace settings</h2>
          </div>
          <button id="settings-modal-close" class="settings-modal-close" type="button" aria-label="Close settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/>
            </svg>
          </button>
        </div>

        <div class="settings-modal-body">
          <div class="settings-shell">
            <nav class="settings-tabs" aria-label="Settings sections">
              <button class="settings-tab active" type="button" data-settings-tab="user">User</button>
              <button class="settings-tab" type="button" data-settings-tab="providers">AI Providers</button>
              <button class="settings-tab" type="button" data-settings-tab="connectors">Connectors</button>
              <button class="settings-tab" type="button" data-settings-tab="channels">Channels</button>
              <button class="settings-tab" type="button" data-settings-tab="mcp">MCP Servers</button>
            </nav>

            <div class="settings-content">
              <section class="settings-panel active" data-settings-panel="user">
                <div class="settings-panel-header">
                  <h3>User</h3>
                  <p>Update your display name, memory, and custom instructions. These are injected into every AI conversation automatically.</p>
                </div>
                <div class="settings-form">
                  <label class="settings-field">
                    <span class="settings-field-label">Name</span>
                    <input id="settings-user-name" type="text" maxlength="80" placeholder="Your name" autocomplete="name"/>
                  </label>
                  <label class="settings-field">
                    <span class="settings-field-label">Memory</span>
                    <textarea id="settings-memory" placeholder="Facts about you, ongoing projects, and preferences the AI should always remember."></textarea>
                  </label>
                  <label class="settings-field">
                    <span class="settings-field-label">Custom Instructions</span>
                    <textarea id="settings-custom-instructions" placeholder="Tone, style, or behaviour instructions for the AI."></textarea>
                  </label>
                </div>
              </section>

              <section class="settings-panel" data-settings-panel="providers" hidden>
                <div class="settings-panel-header">
                  <h3>AI Providers</h3>
                  <p>Connect hosted models with API keys or point Joanium at local Ollama or LM Studio servers. When a local server is reachable, Joanium detects its available models automatically.</p>
                </div>
                <div id="settings-providers-list" class="providers-stack">
                  <div class="ap-empty-hint">Loading...</div>
                </div>
              </section>

              <section class="settings-panel" data-settings-panel="connectors" hidden>
                <div class="settings-panel-header">
                  <h3>Connectors</h3>
                  <p>Link Gmail and GitHub so the AI knows about your emails and repos, and automations can take action.</p>
                </div>
                <div id="connector-list" class="connector-list">
                  <div class="cx-loading">Loading connectors...</div>
                </div>
              </section>

              <section class="settings-panel" data-settings-panel="mcp" hidden>
                <div class="settings-panel-header">
                  <h3>MCP Servers</h3>
                  <p>Connect Model Context Protocol servers here. Browser-control MCP tools automatically show up in chat once a server is connected.</p>
                </div>
                <div id="mcp-settings-panel" class="mcp-settings-panel">
                  <div class="cx-loading">Loading MCP servers...</div>
                </div>
              </section>

              <section class="settings-panel" data-settings-panel="channels" hidden>
                <div class="settings-panel-header">
                  <h3>Channels</h3>
                  <p>Connect WhatsApp and Telegram. When someone messages in, the AI replies automatically on your behalf.</p>
                </div>
                <div id="channels-settings-panel" class="channels-settings-panel">
                  <div class="cx-loading">Loading channels...</div>
                </div>
              </section>
            </div>
          </div>
        </div>

        <div class="settings-modal-footer">
          <div id="settings-save-feedback" class="settings-feedback" aria-live="polite"></div>
          <button id="settings-save" class="settings-save-btn" type="button">Save changes</button>
        </div>
      </div>
    </div>
  `;
}

function buildProviderCatalog(providers) {
  const knownProviders = new Set(PROVIDERS.map((p) => p.id));
  const catalog = Array.isArray(providers) ? [...providers] : [];
  PROVIDERS.forEach((def) => {
    if (!catalog.some((p) => p.provider === def.id)) {
      catalog.push({
        provider: def.id,
        label: def.label,
        api: null,
        settings: {},
        configured: false,
        models: {},
      });
    }
  });
  return catalog.filter((p) => knownProviders.has(p.provider));
}

function getProviderDefinition(providerId) {
  return PROVIDERS_BY_ID[providerId] ?? null;
}
function getSavedProviderConfig(r) {
  return {
    apiKey: String(r.api ?? ''),
    endpoint: String(r.settings?.endpoint ?? ''),
    modelId: String(r.settings?.modelId ?? ''),
  };
}
function isProviderConfigured(r) {
  return Boolean(r?.configured);
}

function getEffectiveProviderConfig(r, pending = {}) {
  const def = getProviderDefinition(r.provider);
  const saved = getSavedProviderConfig(r);
  const effective = { ...saved };
  def?.fields?.forEach((f) => {
    if (f.type !== 'password' && !effective[f.key] && f.defaultValue != null)
      effective[f.key] = f.defaultValue;
  });
  Object.entries(pending ?? {}).forEach(([k, v]) => {
    effective[k] = String(v ?? '');
  });
  return effective;
}

function providerHasDraftChanges(pending = {}) {
  return Object.keys(pending ?? {}).length > 0;
}
function providerIsComplete(r, config) {
  const def = getProviderDefinition(r.provider);
  if (!def) return false;
  return def.fields.every(
    (f) => !f.required || String(config[f.key] ?? '').trim().length >= (f.minLength ?? 1),
  );
}

function providerStatus(r, config, isDeleting, hasDraft) {
  if (isDeleting) return { tone: 'removing', label: 'Removing' };
  if (providerIsComplete(r, config))
    return {
      tone: isProviderConfigured(r) ? 'active' : 'draft',
      label: isProviderConfigured(r) ? 'Connected' : 'Ready to save',
    };
  if (hasDraft) return { tone: 'incomplete', label: 'Needs required fields' };
  return { tone: 'inactive', label: 'Not connected' };
}

function sortProviderCatalog(catalog, ss) {
  return [...catalog].sort((l, r) => {
    const lc = Number(isProviderConfigured(l) || ss.pendingDeletes.has(l.provider));
    const rc = Number(isProviderConfigured(r) || ss.pendingDeletes.has(r.provider));
    if (lc !== rc) return rc - lc;
    return (
      (PROVIDER_ORDER.get(l.provider) ?? Number.MAX_SAFE_INTEGER) -
      (PROVIDER_ORDER.get(r.provider) ?? Number.MAX_SAFE_INTEGER)
    );
  });
}

export function initSettingsModal() {
  const $ = (id) => document.getElementById(id);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const ss = {
    activeTab: 'user',
    providerCatalog: [],
    pendingProviderConfigs: {},
    pendingDeletes: new Set(),
  };

  const modal = createModal({
    backdropId: 'settings-modal-backdrop',
    html: buildHTML(),
    closeBtnSelector: '#settings-modal-close',
    onInit(backdrop) {
      $$('[data-settings-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          switchTab(btn.dataset.settingsTab);
          focusActiveTab();
        });
      });

      $('settings-save')?.addEventListener('click', () => {
        if (ss.activeTab === 'user') void saveUserTab();
        if (ss.activeTab === 'providers') void saveProvidersTab();
      });

      document.addEventListener('keydown', (e) => {
        const isSave = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's';
        if (isSave && modal.isOpen()) {
          e.preventDefault();
          if (ss.activeTab === 'user') void saveUserTab();
          if (ss.activeTab === 'providers') void saveProvidersTab();
        }
      });
    },
  });

  function setFeedback(msg = '', tone = 'info') {
    const el = $('settings-save-feedback');
    if (!el) return;
    el.textContent = msg;
    el.className = msg ? `settings-feedback ${tone}` : 'settings-feedback';
  }

  function providerTabHasChanges() {
    return (
      ss.pendingDeletes.size > 0 ||
      Object.values(ss.pendingProviderConfigs).some(providerHasDraftChanges)
    );
  }

  function updateSaveButton() {
    const btn = $('settings-save');
    if (!btn) return;
    if (ss.activeTab === 'user') {
      btn.textContent = 'Save changes';
      btn.disabled = false;
      return;
    }
    if (ss.activeTab === 'providers') {
      btn.textContent = 'Save provider changes';
      btn.disabled = !providerTabHasChanges();
      return;
    }
    btn.textContent = 'No changes to save';
    btn.disabled = true;
  }

  function switchTab(tabId) {
    ss.activeTab = tabId;
    $$('[data-settings-tab]').forEach((b) => {
      const active = b.dataset.settingsTab === tabId;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', String(active));
    });
    $$('[data-settings-panel]').forEach((p) => {
      const active = p.dataset.settingsPanel === tabId;
      p.classList.toggle('active', active);
      p.hidden = !active;
    });
    setFeedback();
    updateSaveButton();
    if (tabId === 'connectors') loadConnectorsPanel();
    if (tabId === 'mcp') loadMCPPanel();
    if (tabId === 'channels') loadChannelsPanel();
  }

  function focusActiveTab() {
    if (ss.activeTab === 'providers') {
      $('settings-providers-list')?.querySelector('input')?.focus();
      return;
    }
    if (ss.activeTab === 'mcp') {
      $('mcp-add-btn')?.focus();
      return;
    }
    if (ss.activeTab === 'user') $('settings-user-name')?.focus();
  }

  function applyUserProfile(user = {}) {
    const rawName = String(user?.name ?? '').trim();
    const displayName = rawName || 'User';
    const firstName = displayName.split(/\s+/)[0];
    state.userName = rawName;
    state.userInitials = getInitials(displayName);
    const wt = document.querySelector('.welcome-title');
    if (wt) wt.textContent = rawName ? `Welcome, ${firstName}` : 'Welcome';
    window.dispatchEvent(
      new CustomEvent('ow:user-profile-updated', {
        detail: { name: displayName, initials: state.userInitials },
      }),
    );
  }

  function captureProviderFocus() {
    const list = $('settings-providers-list');
    const active = document.activeElement;
    if (!(active instanceof HTMLInputElement) || !list?.contains(active)) return null;

    return {
      providerId: active.dataset.providerId ?? '',
      fieldKey: active.dataset.fieldKey ?? '',
      selectionStart: active.selectionStart,
      selectionEnd: active.selectionEnd,
      selectionDirection: active.selectionDirection,
    };
  }

  function restoreProviderFocus(focusState) {
    if (!focusState?.providerId || !focusState?.fieldKey) return;

    requestAnimationFrame(() => {
      const list = $('settings-providers-list');
      if (!list) return;

      const nextInput = Array.from(
        list.querySelectorAll('input[data-provider-id][data-field-key]'),
      ).find(
        (input) =>
          input.dataset.providerId === focusState.providerId &&
          input.dataset.fieldKey === focusState.fieldKey,
      );

      if (!nextInput || nextInput.disabled) return;
      nextInput.focus();

      if (
        typeof focusState.selectionStart !== 'number' ||
        typeof focusState.selectionEnd !== 'number'
      )
        return;
      if (typeof nextInput.setSelectionRange !== 'function') return;

      try {
        nextInput.setSelectionRange(
          focusState.selectionStart,
          focusState.selectionEnd,
          focusState.selectionDirection ?? 'none',
        );
      } catch {}
    });
  }

  function renderProviderField(r, field, savedConfig, effectiveConfig, disabled) {
    const wrapper = document.createElement('label');
    wrapper.className = 'spr-field';
    const label = document.createElement('span');
    label.className = 'spr-field-label';
    label.textContent = field.label;
    const inputWrap = document.createElement('div');
    inputWrap.className = 'key-input-wrap spr-key-wrap';
    const input = document.createElement('input');
    input.className = 'key-input spr-key-input';
    input.type = field.type === 'password' ? 'password' : 'text';
    input.placeholder =
      field.type === 'password' && savedConfig.apiKey ? '••••••••  (saved)' : field.placeholder;
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.disabled = disabled;
    input.dataset.providerId = r.provider;
    input.dataset.fieldKey = field.key;
    input.value =
      field.type === 'password'
        ? String(ss.pendingProviderConfigs[r.provider]?.[field.key] ?? '')
        : String(effectiveConfig[field.key] ?? '');
    input.addEventListener('input', () => {
      const focusState = captureProviderFocus();
      const pending = { ...(ss.pendingProviderConfigs[r.provider] ?? {}) };
      const trimmed = input.value.trim();
      if (field.type === 'password' && !trimmed && savedConfig.apiKey) delete pending[field.key];
      else pending[field.key] = input.value;
      if (Object.keys(pending).length > 0) ss.pendingProviderConfigs[r.provider] = pending;
      else delete ss.pendingProviderConfigs[r.provider];
      if (trimmed) ss.pendingDeletes.delete(r.provider);
      renderProviders(focusState);
    });
    inputWrap.appendChild(input);
    if (field.type === 'password') {
      const eye = document.createElement('button');
      eye.type = 'button';
      eye.className = 'key-eye';
      eye.title = 'Show or hide';
      eye.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-width="1.8"/><circle cx="12" cy="12" r="3" stroke-width="1.8"/></svg>`;
      eye.disabled = disabled;
      eye.addEventListener('click', () => {
        input.type = input.type === 'password' ? 'text' : 'password';
      });
      inputWrap.appendChild(eye);
    }
    wrapper.append(label, inputWrap);
    return wrapper;
  }

  function renderProviders(focusState = null) {
    const list = $('settings-providers-list');
    if (!list) return;
    const catalog = sortProviderCatalog(ss.providerCatalog, ss);
    if (!catalog.length) {
      list.innerHTML = '<div class="settings-empty-card">No providers available.</div>';
      updateSaveButton();
      return;
    }
    list.innerHTML = '';
    catalog.forEach((r) => {
      const def = getProviderDefinition(r.provider);
      if (!def) return;
      const savedConfig = getSavedProviderConfig(r);
      const pendingConfig = ss.pendingProviderConfigs[r.provider] ?? {};
      const effectiveConfig = getEffectiveProviderConfig(r, pendingConfig);
      const isDeleting = ss.pendingDeletes.has(r.provider);
      const hasDraft = providerHasDraftChanges(pendingConfig);
      const hasAnyConfig = isProviderConfigured(r) || hasDraft;
      const status = providerStatus(r, effectiveConfig, isDeleting, hasDraft);

      const row = document.createElement('div');
      row.className = `spr-row${status.tone === 'active' ? ' spr-row--active' : ''}${isDeleting ? ' spr-row--deleting' : ''}`;
      row.style.setProperty('--p-color', def.color);

      const main = document.createElement('div');
      main.className = 'spr-main';
      const summary = document.createElement('div');
      summary.className = 'spr-summary';
      const icon = document.createElement('div');
      icon.className = 'spr-icon';
      icon.innerHTML = `<img class="spr-icon-img" src="${def.iconPath || 'data:,'}" alt="" /><span class="spr-icon-fallback">${def.fallback}</span>`;
      if (!def.iconPath) icon.classList.add('icon-missing');
      const img = icon.querySelector('.spr-icon-img');
      img?.addEventListener('error', () => icon.classList.add('icon-missing'));
      img?.addEventListener('load', () => icon.classList.remove('icon-missing'));

      const info = document.createElement('div');
      info.className = 'spr-info';
      info.innerHTML = `<div class="spr-provider-name">${r.label ?? def.label}</div><div class="spr-provider-copy">${def.company || def.caption}</div>`;

      const badge = document.createElement('span');
      badge.className = `spr-status spr-status--${status.tone}`;
      badge.textContent = status.label;
      summary.append(icon, info, badge);

      const fields = document.createElement('div');
      fields.className = `spr-fields${def.fields.length > 1 ? ' spr-fields--multi' : ''}`;
      def.fields.forEach((f) =>
        fields.appendChild(renderProviderField(r, f, savedConfig, effectiveConfig, isDeleting)),
      );
      main.append(summary, fields);

      if (def.hint) {
        const h = document.createElement('p');
        h.className = 'spr-hint';
        h.textContent = def.hint;
        main.appendChild(h);
      }

      const actions = document.createElement('div');
      actions.className = 'spr-actions';
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = isDeleting ? 'spr-undo-btn' : 'spr-delete-btn';
      delBtn.title = isDeleting ? 'Undo removal' : 'Remove configuration';
      delBtn.hidden = !isDeleting && !hasAnyConfig;
      delBtn.innerHTML = isDeleting
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 14l-4-4 4-4M5 10h11a4 4 0 010 8h-1" stroke-linecap="round" stroke-linejoin="round"/></svg> Undo`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      delBtn.addEventListener('click', () => {
        if (isDeleting) {
          ss.pendingDeletes.delete(r.provider);
        } else {
          ss.pendingDeletes.add(r.provider);
          delete ss.pendingProviderConfigs[r.provider];
        }
        renderProviders();
      });
      actions.appendChild(delBtn);
      row.append(main, actions);
      list.appendChild(row);
    });
    updateSaveButton();
    restoreProviderFocus(focusState);
  }

  async function hydrateModal() {
    setFeedback();
    ss.pendingDeletes.clear();
    ss.pendingProviderConfigs = {};
    const [user, customInstructions, memory, providers] = await Promise.all([
      window.electronAPI?.invoke('get-user'),
      window.electronAPI?.invoke('get-custom-instructions'),
      window.electronAPI?.invoke('get-memory'),
      window.electronAPI?.invoke('get-models'),
    ]);
    applyUserProfile(user ?? {});
    ss.providerCatalog = buildProviderCatalog(providers);
    if ($('settings-user-name')) $('settings-user-name').value = user?.name ?? '';
    if ($('settings-memory')) $('settings-memory').value = memory ?? '';
    if ($('settings-custom-instructions'))
      $('settings-custom-instructions').value = customInstructions ?? '';
    renderProviders();
    updateSaveButton();
  }

  async function saveUserTab() {
    const nextName = $('settings-user-name')?.value.trim() ?? '';
    const nextMemory = $('settings-memory')?.value ?? '';
    const nextInstructions = $('settings-custom-instructions')?.value ?? '';
    if (nextName.length < 2) {
      setFeedback('Enter a name with at least 2 characters.', 'error');
      $('settings-user-name')?.focus();
      return;
    }
    $('settings-save').disabled = true;
    setFeedback('Saving...', 'info');
    try {
      const [profileResult, instructionsResult, memoryResult] = await Promise.all([
        window.electronAPI?.invoke('save-user-profile', { name: nextName }),
        window.electronAPI?.invoke('save-custom-instructions', nextInstructions),
        window.electronAPI?.invoke('save-memory', nextMemory),
      ]);
      if (!profileResult?.ok) throw new Error(profileResult?.error ?? 'Could not save profile.');
      if (!instructionsResult?.ok)
        throw new Error(instructionsResult?.error ?? 'Could not save custom instructions.');
      if (!memoryResult?.ok) throw new Error(memoryResult?.error ?? 'Could not save memory.');
      applyUserProfile(profileResult.user ?? { name: nextName });
      setFeedback('Changes saved.', 'success');
      window.dispatchEvent(new CustomEvent('ow:settings-saved'));
    } catch (err) {
      setFeedback(err.message || 'Could not save.', 'error');
    } finally {
      updateSaveButton();
    }
  }

  async function saveProvidersTab() {
    const changes = {};
    for (const r of ss.providerCatalog) {
      const pid = r.provider;
      if (ss.pendingDeletes.has(pid)) {
        changes[pid] = null;
        continue;
      }
      const pendingConfig = ss.pendingProviderConfigs[pid];
      if (!providerHasDraftChanges(pendingConfig)) continue;
      const effectiveConfig = getEffectiveProviderConfig(r, pendingConfig);
      if (!providerIsComplete(r, effectiveConfig)) {
        setFeedback(`Finish the required fields for ${r.label ?? pid}.`, 'error');
        renderProviders();
        return;
      }
      const def = getProviderDefinition(pid);
      const savedConfig = getSavedProviderConfig(r);
      const payload = {};
      def.fields.forEach((f) => {
        const pv = pendingConfig[f.key];
        if (pv != null) {
          payload[f.key] = String(pv).trim();
          return;
        }
        if (!savedConfig[f.key] && effectiveConfig[f.key])
          payload[f.key] = String(effectiveConfig[f.key]).trim();
      });
      if (Object.keys(payload).length > 0) changes[pid] = payload;
    }
    if (!Object.keys(changes).length) {
      setFeedback('No provider changes to save.', 'error');
      return;
    }
    $('settings-save').disabled = true;
    setFeedback('Saving provider settings...', 'info');
    try {
      const result = await window.electronAPI?.invoke('save-provider-configs', changes);
      if (!result?.ok) throw new Error(result?.error ?? 'Could not save provider settings.');
      const allProviders = (await window.electronAPI?.invoke('get-models')) ?? [];
      state.allProviders = allProviders;
      state.providers = allProviders.filter((p) => p.configured);
      ss.providerCatalog = buildProviderCatalog(allProviders);
      ss.pendingProviderConfigs = {};
      ss.pendingDeletes.clear();
      renderProviders();
      const savedCount = Object.values(changes).filter((v) => v !== null).length;
      const removedCount = Object.values(changes).filter((v) => v === null).length;
      const parts = [];
      if (savedCount) parts.push(`${savedCount} provider${savedCount !== 1 ? 's' : ''} saved`);
      if (removedCount)
        parts.push(`${removedCount} provider${removedCount !== 1 ? 's' : ''} removed`);
      setFeedback(`${parts.join(', ')}.`, 'success');
      window.dispatchEvent(new CustomEvent('ow:settings-saved'));
    } catch (err) {
      setFeedback(err.message || 'Could not save.', 'error');
    } finally {
      updateSaveButton();
    }
  }

  async function open(tabId = ss.activeTab) {
    switchTab(tabId);
    modal.open();
    try {
      await hydrateModal();
    } catch (err) {
      setFeedback('Could not load settings.', 'error');
    }
    requestAnimationFrame(() => focusActiveTab());
  }

  async function loadUser() {
    try {
      const user = await window.electronAPI?.invoke('get-user');
      applyUserProfile(user ?? {});
      return user;
    } catch {
      applyUserProfile({});
      return null;
    }
  }

  return { open, close: modal.close, loadUser };
}
