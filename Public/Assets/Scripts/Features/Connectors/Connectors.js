import { CONNECTORS, FREE_CONNECTORS } from './ConnectorDefs.js';
import { buildCard, buildFreeCard, setStatus, setConnectBtnState } from './ConnectorCards.js';

/* ── Shared mutable state (passed into card builders as a reference) ── */
export const cxState = {
  statuses:    {},  // { [connectorId]: { enabled, connectedAt, accountInfo } }
  pending:     {},  // { [connectorId]: { [fieldKey]: value } }
  freeStatuses:{},  // { [connectorId]: boolean }
  freeKeys:    {},  // { [connectorId]: { saved, value } }
  loaded:      false,
};

/* ══════════════════════════════════════════
   RENDER PANEL
══════════════════════════════════════════ */
function renderPanel() {
  const list = document.getElementById('connector-list');
  if (!list) return;
  list.innerHTML = '';

  const svcHeader = document.createElement('div');
  svcHeader.className = 'cx-section-header';
  svcHeader.innerHTML = `
    <div class="cx-section-title">
      <span class="cx-section-icon">🔌</span>
      Service Connectors
    </div>
    <div class="cx-section-sub">Requires authentication</div>`;
  list.appendChild(svcHeader);

  CONNECTORS.forEach(def => list.appendChild(buildCard(def, cxState, handleConnect, handleDisconnect)));

  const freeHeader = document.createElement('div');
  freeHeader.className = 'cx-section-header cx-section-header--free';
  freeHeader.innerHTML = `
    <div class="cx-section-title">
      <span class="cx-section-icon">⚡</span>
      Free APIs
    </div>
    <div class="cx-section-sub">Enabled by default · Toggle to disable</div>`;
  list.appendChild(freeHeader);

  FREE_CONNECTORS.forEach(def => list.appendChild(buildFreeCard(def, cxState)));
}

/* ══════════════════════════════════════════
   SERVICE CONNECTOR HANDLERS
══════════════════════════════════════════ */
async function handleConnect(id, def) {
  def.oauthFlow ? await handleOAuthConnect(id, def) : await handleTokenConnect(id, def);
}

async function handleOAuthConnect(id, def) {
  const credentials = cxState.pending[id] ?? {};
  const missing = def.fields.filter(f => !credentials[f.key]?.trim());
  if (missing.length) {
    setStatus(id, `Please fill in: ${missing.map(f => f.label).join(', ')}`, 'error'); return;
  }

  setConnectBtnState(id, true, 'Opening Google sign-in…');
  setStatus(id, 'A sign-in window will open — grant access and come back.');

  try {
    const result = await window.electronAPI?.gmailOAuthStart?.(credentials.clientId, credentials.clientSecret);
    if (!result?.ok) throw new Error(result?.error ?? 'OAuth failed');
    cxState.statuses[id] = { enabled: true, connectedAt: new Date().toISOString(), accountInfo: { email: result.email } };
    cxState.pending[id] = {};
    setStatus(id, `Connected as ${result.email} ✓`, 'success');
    setTimeout(renderPanel, 1000);
  } catch (err) {
    setStatus(id, `Failed: ${err.message}`, 'error');
    setConnectBtnState(id, false, 'Sign in with Google');
  }
}

async function handleTokenConnect(id, def) {
  const credentials = cxState.pending[id] ?? {};
  const missing = def.fields.filter(f => !credentials[f.key]?.trim());
  if (missing.length) {
    setStatus(id, `Please fill in: ${missing.map(f => f.label).join(', ')}`, 'error'); return;
  }

  setConnectBtnState(id, true, 'Connecting…');
  setStatus(id, '');

  try {
    await window.electronAPI?.saveConnector?.(id, credentials);
    const validation = await window.electronAPI?.validateConnector?.(id);
    if (!validation?.ok) throw new Error(validation?.error ?? 'Connection failed');
    cxState.statuses[id] = {
      enabled: true,
      connectedAt: new Date().toISOString(),
      accountInfo: { email: validation.email ?? null, username: validation.username ?? null },
    };
    cxState.pending[id] = {};
    setStatus(id, 'Connected successfully!', 'success');
    setTimeout(renderPanel, 900);
  } catch (err) {
    await window.electronAPI?.removeConnector?.(id).catch(() => { });
    cxState.statuses[id] = { enabled: false };
    setStatus(id, `Failed: ${err.message}`, 'error');
    setConnectBtnState(id, false, `Connect ${def.name}`);
  }
}

async function handleDisconnect(id) {
  try {
    await window.electronAPI?.removeConnector?.(id);
    cxState.statuses[id] = { enabled: false, accountInfo: null };
    cxState.pending[id] = {};
    renderPanel();
  } catch (err) {
    setStatus(id, `Could not disconnect: ${err.message}`, 'error');
  }
}

/* ══════════════════════════════════════════
   LOAD PANEL  (called by SettingsModal on tab switch)
══════════════════════════════════════════ */
export async function loadConnectorsPanel() {
  const list = document.getElementById('connector-list');
  if (!list) return;
  if (!cxState.loaded) list.innerHTML = '<div class="cx-loading">Loading connectors…</div>';

  try {
    const statuses = await window.electronAPI?.getConnectors?.() ?? {};
    cxState.statuses = {};
    for (const [name, s] of Object.entries(statuses)) {
      if (!s.isFree) cxState.statuses[name] = { ...s, accountInfo: null };
    }

    await Promise.all(
      Object.entries(cxState.statuses)
        .filter(([, s]) => s.enabled)
        .map(async ([name]) => {
          const v = await window.electronAPI?.validateConnector?.(name).catch(() => null);
          if (v?.ok) cxState.statuses[name].accountInfo = { email: v.email ?? null, username: v.username ?? null };
        }),
    );

    for (const def of FREE_CONNECTORS) {
      const config = await window.electronAPI?.getFreeConnectorConfig?.(def.id).catch(() => null);
      if (config) {
        cxState.freeStatuses[def.id] = config.enabled ?? true;
        if (!def.noKey && config.credentials?.apiKey) {
          cxState.freeKeys[def.id] = { saved: true, value: config.credentials.apiKey };
        }
      } else {
        cxState.freeStatuses[def.id] = true;
      }
    }

    cxState.loaded = true;
    renderPanel();
  } catch (err) {
    if (list) list.innerHTML = `<div class="cx-loading">Could not load connectors: ${err.message}</div>`;
  }
}
