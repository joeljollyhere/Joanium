const STATE = {
  loaded: false,
  servers: [],
  tools: [],
  editor: null,
  feedback: '',
  feedbackTone: 'info',
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createServerId() {
  return `mcp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function parseArgsBlock(text = '') {
  return String(text)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

function parseEnvBlock(text = '') {
  const env = {};

  for (const rawLine of String(text).split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const eq = line.indexOf('=');
    if (eq < 1) {
      throw new Error(`Invalid env line "${line}". Use KEY=VALUE format.`);
    }

    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1);
    if (!key) throw new Error(`Invalid env line "${line}". Missing key.`);
    env[key] = value;
  }

  return env;
}

function argsToText(args = []) {
  return Array.isArray(args) ? args.join('\n') : '';
}

function envToText(env = {}) {
  return Object.entries(env ?? {})
    .map(([key, value]) => `${key}=${value ?? ''}`)
    .join('\n');
}

function getToolsForServer(serverId) {
  return STATE.tools
    .filter(tool => tool?._mcpServerId === serverId)
    .sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')));
}

function sortServers(servers = []) {
  return [...servers].sort((a, b) => {
    if (Boolean(a.connected) !== Boolean(b.connected)) {
      return Number(Boolean(b.connected)) - Number(Boolean(a.connected));
    }
    if (Boolean(a.enabled) !== Boolean(b.enabled)) {
      return Number(Boolean(b.enabled)) - Number(Boolean(a.enabled));
    }
    return String(a.name ?? '').localeCompare(String(b.name ?? ''));
  });
}

function setFeedback(message = '', tone = 'info') {
  STATE.feedback = message;
  STATE.feedbackTone = tone;
}

function transportLabel(transport = 'stdio') {
  if (transport === 'builtin') return 'Built-in';
  return transport === 'http' ? 'HTTP' : 'STDIO';
}

function buildServerSummary(server) {
  if (server.transport === 'builtin') {
    return escapeHtml(server.description || 'Built into Joanium and ready without extra setup.');
  }

  if (server.transport === 'http') {
    return escapeHtml(server.url || 'No URL configured');
  }

  const command = String(server.command ?? '').trim();
  const args = Array.isArray(server.args) ? server.args : [];
  const preview = [command, ...args].filter(Boolean).join(' ');
  return escapeHtml(preview || 'No command configured');
}

function buildToolBadges(serverId) {
  const tools = getToolsForServer(serverId);
  if (!tools.length) {
    return '<div class="mcp-tools-empty">No tools discovered yet.</div>';
  }

  return [
    '<div class="mcp-tool-badges">',
    ...tools.map(tool => `<span class="mcp-tool-badge">${escapeHtml(tool.name)}</span>`),
    '</div>',
  ].join('');
}

function buildEditorCard() {
  if (!STATE.editor) return '';

  const server = STATE.editor.server ?? {};
  const isEdit = STATE.editor.mode === 'edit';
  const isHttp = server.transport === 'http';

  return `
    <section class="mcp-editor-card">
      <div class="mcp-editor-header">
        <div>
          <h4>${isEdit ? 'Edit MCP Server' : 'Add MCP Server'}</h4>
          <p>
            Connect any MCP server that exposes browser, web, or workflow tools.
            Browser-style tools become available to chat automatically.
          </p>
        </div>
      </div>

      <div class="mcp-editor-grid">
        <label class="settings-field">
          <span class="settings-field-label">Server Name</span>
          <input id="mcp-server-name" type="text" maxlength="80"
                 placeholder="Browser Controller"
                 value="${escapeHtml(server.name ?? '')}" />
        </label>

        <label class="settings-field">
          <span class="settings-field-label">Transport</span>
          <select id="mcp-server-transport" class="mcp-select">
            <option value="stdio" ${isHttp ? '' : 'selected'}>STDIO</option>
            <option value="http" ${isHttp ? 'selected' : ''}>HTTP</option>
          </select>
        </label>
      </div>

      <label class="mcp-checkbox-row">
        <input id="mcp-server-enabled" type="checkbox" ${server.enabled !== false ? 'checked' : ''} />
        <span>Connect automatically when Joanium launches</span>
      </label>

      <div id="mcp-stdio-fields" ${isHttp ? 'hidden' : ''}>
        <div class="mcp-editor-grid">
          <label class="settings-field">
            <span class="settings-field-label">Command</span>
            <input id="mcp-server-command" type="text"
                   placeholder="npx"
                   value="${escapeHtml(server.command ?? '')}" />
          </label>
          <label class="settings-field">
            <span class="settings-field-label">Arguments</span>
            <textarea id="mcp-server-args" class="mcp-textarea"
                      placeholder="One argument per line&#10;@your-mcp/server&#10;--headless">${escapeHtml(argsToText(server.args ?? []))}</textarea>
          </label>
        </div>

        <label class="settings-field">
          <span class="settings-field-label">Environment Variables</span>
          <textarea id="mcp-server-env" class="mcp-textarea"
                    placeholder="Optional, one per line&#10;API_KEY=your-key&#10;BASE_URL=https://example.com">${escapeHtml(envToText(server.env ?? {}))}</textarea>
        </label>
      </div>

      <div id="mcp-http-fields" ${isHttp ? '' : 'hidden'}>
        <label class="settings-field">
          <span class="settings-field-label">Server URL</span>
          <input id="mcp-server-url" type="text"
                 placeholder="https://your-server.example.com"
                 value="${escapeHtml(server.url ?? '')}" />
        </label>
        <div class="mcp-inline-note">
          Use the base MCP server URL. Joanium will call the MCP endpoint automatically.
        </div>
      </div>

      <div class="mcp-editor-actions">
        <button id="mcp-cancel-btn" class="mcp-secondary-btn" type="button">Cancel</button>
        <button id="mcp-save-btn" class="mcp-secondary-btn" type="button">Save Server</button>
        <button id="mcp-save-connect-btn" class="mcp-primary-btn" type="button">Save and Connect</button>
      </div>
    </section>
  `;
}

function buildServerCards() {
  if (!STATE.servers.length) {
    return `
      <div class="settings-empty-card">
        No MCP servers yet. Add one here, then connect it to expose browser-control tools inside chat.
      </div>
    `;
  }

  return sortServers(STATE.servers).map(server => {
    const tools = getToolsForServer(server.id);
    const summary = buildServerSummary(server);

    return `
      <article class="mcp-server-card${server.connected ? ' is-connected' : ''}">
        <div class="mcp-server-header">
          <div class="mcp-server-copy">
            <div class="mcp-server-title-row">
              <h4>${escapeHtml(server.name || 'Unnamed MCP Server')}</h4>
              <span class="mcp-status-badge ${server.connected ? 'is-on' : 'is-off'}">
                ${server.connected ? 'Connected' : 'Disconnected'}
              </span>
              ${server.builtin ? '<span class="mcp-status-badge is-ready">Out of the box</span>' : ''}
              ${server.enabled ? '<span class="mcp-status-badge is-auto">Auto-connect</span>' : ''}
            </div>
            <p>${transportLabel(server.transport)} server${tools.length ? ` - ${tools.length} tool${tools.length === 1 ? '' : 's'}` : ''}</p>
          </div>
        </div>

        <div class="mcp-command-preview">${summary}</div>

        <div class="mcp-card-actions">
          <button class="mcp-secondary-btn" type="button" data-mcp-action="${server.connected ? 'disconnect' : 'connect'}" data-server-id="${escapeHtml(server.id)}">
            ${server.connected ? 'Disconnect' : 'Connect'}
          </button>
          ${server.builtin ? '' : `
          <button class="mcp-secondary-btn" type="button" data-mcp-action="edit" data-server-id="${escapeHtml(server.id)}">
            Edit
          </button>
          <button class="mcp-danger-btn" type="button" data-mcp-action="remove" data-server-id="${escapeHtml(server.id)}">
            Delete
          </button>`}
        </div>
      </article>
    `;
  }).join('');
}

function renderPanel() {
  const panel = document.getElementById('mcp-settings-panel');
  if (!panel) return;

  const feedback = STATE.feedback
    ? `<div class="mcp-panel-feedback ${escapeHtml(STATE.feedbackTone)}">${escapeHtml(STATE.feedback)}</div>`
    : '';

  panel.innerHTML = `
    <div class="mcp-toolbar">
      <div class="mcp-toolbar-copy">
        <strong>Configured Servers</strong>
        <span>Use STDIO for local MCP processes and HTTP for remote MCP services.</span>
      </div>
      <div class="mcp-toolbar-actions">
        <button id="mcp-refresh-btn" class="mcp-secondary-btn" type="button">Refresh</button>
        <button id="mcp-add-btn" class="mcp-primary-btn" type="button">Add Server</button>
      </div>
    </div>

    ${feedback}
    ${buildEditorCard()}

    <div class="mcp-server-list">
      ${buildServerCards()}
    </div>
  `;

  bindPanelEvents();
}

function syncTransportFields() {
  const transport = document.getElementById('mcp-server-transport')?.value ?? 'stdio';
  const stdio = document.getElementById('mcp-stdio-fields');
  const http = document.getElementById('mcp-http-fields');
  if (stdio) stdio.hidden = transport !== 'stdio';
  if (http) http.hidden = transport !== 'http';
}

function openEditor(mode, server = {}) {
  STATE.editor = {
    mode,
    server: {
      id: server.id ?? createServerId(),
      name: server.name ?? '',
      transport: server.transport ?? 'stdio',
      command: server.command ?? '',
      args: Array.isArray(server.args) ? server.args : [],
      env: server.env ?? {},
      url: server.url ?? '',
      enabled: server.enabled !== false,
      connected: Boolean(server.connected),
    },
  };
  setFeedback();
  renderPanel();
}

function closeEditor() {
  STATE.editor = null;
  setFeedback();
  renderPanel();
}

function readEditorValues() {
  const editing = STATE.editor?.server;
  if (!editing) throw new Error('No MCP server is being edited.');

  const transport = document.getElementById('mcp-server-transport')?.value ?? 'stdio';
  const payload = {
    id: editing.id,
    name: document.getElementById('mcp-server-name')?.value.trim() ?? '',
    transport,
    enabled: Boolean(document.getElementById('mcp-server-enabled')?.checked),
  };

  if (!payload.name) throw new Error('Server name is required.');

  if (transport === 'http') {
    const rawUrl = document.getElementById('mcp-server-url')?.value.trim() ?? '';
    if (!rawUrl) throw new Error('Server URL is required for HTTP transport.');

    let url;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new Error('Enter a valid HTTP server URL.');
    }

    payload.url = url.toString().replace(/\/$/, '');
  } else {
    payload.command = document.getElementById('mcp-server-command')?.value.trim() ?? '';
    if (!payload.command) throw new Error('Command is required for STDIO transport.');

    payload.args = parseArgsBlock(document.getElementById('mcp-server-args')?.value ?? '');
    payload.env = parseEnvBlock(document.getElementById('mcp-server-env')?.value ?? '');
  }

  return payload;
}

async function refreshData() {
  const [servers, toolsResult] = await Promise.all([
    window.electronAPI?.mcpListServers?.() ?? [],
    window.electronAPI?.mcpGetTools?.() ?? { ok: false, tools: [] },
  ]);

  STATE.servers = Array.isArray(servers) ? servers : [];
  STATE.tools = toolsResult?.ok ? (toolsResult.tools ?? []) : [];
  STATE.loaded = true;
}

async function saveEditor(connectAfterSave = false) {
  const existing = STATE.editor?.server;
  if (!existing) return;

  try {
    const payload = readEditorValues();
    const shouldReconnect = Boolean(existing.connected);

    if (shouldReconnect) {
      await window.electronAPI?.mcpDisconnectServer?.(payload.id).catch(() => { });
    }

    const saveResult = await window.electronAPI?.mcpSaveServer?.(payload);
    if (saveResult?.ok === false) {
      throw new Error(saveResult.error ?? 'Could not save the MCP server.');
    }

    if (connectAfterSave || shouldReconnect) {
      const connectResult = await window.electronAPI?.mcpConnectServer?.(payload.id);
      if (!connectResult?.ok) {
        throw new Error(connectResult?.error ?? 'Could not connect the MCP server.');
      }
      setFeedback(`"${payload.name}" is connected and ready.`, 'success');
    } else {
      setFeedback(`"${payload.name}" saved.`, 'success');
    }

    STATE.editor = null;
    await refreshData();
    renderPanel();
  } catch (err) {
    setFeedback(err.message || 'Could not save the MCP server.', 'error');
    renderPanel();
  }
}

async function connectServer(serverId) {
  const server = STATE.servers.find(entry => entry.id === serverId);
  if (!server) return;

  try {
    const result = await window.electronAPI?.mcpConnectServer?.(serverId);
    if (!result?.ok) throw new Error(result?.error ?? 'Could not connect the MCP server.');

    await refreshData();
    setFeedback(`"${server.name}" connected successfully.`, 'success');
    renderPanel();
  } catch (err) {
    setFeedback(err.message || `Could not connect "${server.name}".`, 'error');
    renderPanel();
  }
}

async function disconnectServer(serverId) {
  const server = STATE.servers.find(entry => entry.id === serverId);
  if (!server) return;

  try {
    const result = await window.electronAPI?.mcpDisconnectServer?.(serverId);
    if (!result?.ok) throw new Error(result?.error ?? 'Could not disconnect the MCP server.');

    await refreshData();
    setFeedback(`"${server.name}" disconnected.`, 'success');
    renderPanel();
  } catch (err) {
    setFeedback(err.message || `Could not disconnect "${server.name}".`, 'error');
    renderPanel();
  }
}

async function removeServer(serverId) {
  const server = STATE.servers.find(entry => entry.id === serverId);
  if (!server) return;

  const confirmed = window.confirm(`Delete MCP server "${server.name}"?`);
  if (!confirmed) return;

  try {
    const result = await window.electronAPI?.mcpRemoveServer?.(serverId);
    if (!result?.ok) throw new Error(result?.error ?? 'Could not delete the MCP server.');

    if (STATE.editor?.server?.id === serverId) STATE.editor = null;
    await refreshData();
    setFeedback(`"${server.name}" deleted.`, 'success');
    renderPanel();
  } catch (err) {
    setFeedback(err.message || `Could not delete "${server.name}".`, 'error');
    renderPanel();
  }
}

function bindPanelEvents() {
  document.getElementById('mcp-add-btn')?.addEventListener('click', () => {
    openEditor('create', { transport: 'stdio', enabled: true });
  });

  document.getElementById('mcp-refresh-btn')?.addEventListener('click', () => {
    void loadMCPPanel({ force: true, keepFeedback: true });
  });

  document.getElementById('mcp-cancel-btn')?.addEventListener('click', () => {
    closeEditor();
  });

  document.getElementById('mcp-save-btn')?.addEventListener('click', () => {
    void saveEditor(false);
  });

  document.getElementById('mcp-save-connect-btn')?.addEventListener('click', () => {
    void saveEditor(true);
  });

  document.getElementById('mcp-server-transport')?.addEventListener('change', () => {
    syncTransportFields();
  });

  document.querySelectorAll('[data-mcp-action]').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('data-mcp-action');
      const serverId = button.getAttribute('data-server-id');
      if (!serverId) return;

      if (action === 'connect') void connectServer(serverId);
      if (action === 'disconnect') void disconnectServer(serverId);
      if (action === 'remove') void removeServer(serverId);
      if (action === 'edit') {
        const server = STATE.servers.find(entry => entry.id === serverId);
        if (server) openEditor('edit', server);
      }
    });
  });
}

export async function loadMCPPanel({ force = false, keepFeedback = false } = {}) {
  const panel = document.getElementById('mcp-settings-panel');
  if (!panel) return;

  if (!keepFeedback) setFeedback();
  if (!STATE.loaded || force) {
    panel.innerHTML = '<div class="cx-loading">Loading MCP servers...</div>';
  }

  try {
    await refreshData();
    renderPanel();
  } catch (err) {
    panel.innerHTML = `<div class="cx-loading">Could not load MCP servers: ${escapeHtml(err.message)}</div>`;
  }
}
