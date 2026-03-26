/* ── Status helpers ── */
export function setStatus(id, message, type = '') {
  const el = document.getElementById(`cx-status-${id}`);
  if (!el) return;
  el.textContent = message;
  el.className = `cx-status-msg${message && type ? ` ${type}` : ''}`;
}

export function setFreeStatus(id, message, type = '') {
  const el = document.getElementById(`cx-free-status-${id}`);
  if (!el) return;
  el.textContent = message;
  el.className = `cx-status-msg${message && type ? ` ${type}` : ''}`;
}

export function setConnectBtnState(id, loading, label) {
  const btn = document.getElementById(`cx-connect-btn-${id}`);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = label;
}

/* ── Service connector card ── */
export function buildCard(def, cxState, onConnect, onDisconnect) {
  const status = cxState.statuses[def.id] ?? { enabled: false };
  const isConnected = Boolean(status.enabled);

  const card = document.createElement('div');
  card.className = `cx-card${isConnected ? ' cx-connected' : ''}`;
  card.id = `cx-card-${def.id}`;

  card.innerHTML = `
    <div class="cx-card-header">
      <div class="cx-icon">${def.icon}</div>
      <div class="cx-info">
        <h4>${def.name}</h4>
        <p>${def.description}</p>
      </div>
      <span class="cx-badge ${isConnected ? 'cx-badge--on' : 'cx-badge--off'}">
        ${isConnected ? '● Connected' : '○ Not connected'}
      </span>
    </div>`;

  const caps = document.createElement('div');
  caps.className = 'cx-capabilities';
  def.capabilities.forEach(cap => {
    const tag = document.createElement('span');
    tag.className = 'cx-cap-tag';
    tag.textContent = cap;
    caps.appendChild(tag);
  });
  card.appendChild(caps);

  if (isConnected && status.accountInfo) {
    const info = document.createElement('div');
    info.className = 'cx-account-info';
    const display = status.accountInfo.email || status.accountInfo.username || 'Connected';
    info.innerHTML = `<div class="cx-account-avatar">${display[0].toUpperCase()}</div><span>${display}</span>`;
    card.appendChild(info);
  }

  if (def.automations?.length) {
    const autoSec = document.createElement('div');
    autoSec.className = 'cx-auto-section';
    autoSec.innerHTML = `<div class="cx-auto-label">Suggested Automations</div>`;
    def.automations.forEach(a => {
      const item = document.createElement('div');
      item.className = 'cx-auto-item';
      item.innerHTML = `<strong>${a.name}</strong> — <span>${a.description}</span>`;
      autoSec.appendChild(item);
    });
    card.appendChild(autoSec);
  }

  const statusEl = document.createElement('div');
  statusEl.className = 'cx-status-msg';
  statusEl.id = `cx-status-${def.id}`;
  card.appendChild(statusEl);

  const fieldsWrap = document.createElement('div');
  fieldsWrap.className = 'cx-fields';
  fieldsWrap.id = `cx-fields-${def.id}`;
  if (isConnected) fieldsWrap.style.display = 'none';

  def.fields.forEach(field => {
    const wrap = document.createElement('div');
    wrap.className = 'cx-field-wrap';
    const label = document.createElement('label');
    label.className = 'cx-field-label';
    label.textContent = field.label;
    label.htmlFor = `cx-field-${def.id}-${field.key}`;
    const input = document.createElement('input');
    input.id = `cx-field-${def.id}-${field.key}`;
    input.type = field.type;
    input.className = 'cx-field-input';
    input.placeholder = field.placeholder;
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.addEventListener('input', () => {
      if (!cxState.pending[def.id]) cxState.pending[def.id] = {};
      cxState.pending[def.id][field.key] = input.value.trim();
    });
    wrap.append(label, input);
    if (field.hint) {
      const hint = document.createElement('div');
      hint.className = 'cx-field-hint';
      hint.textContent = field.hint;
      wrap.appendChild(hint);
    }
    fieldsWrap.appendChild(wrap);
  });
  card.appendChild(fieldsWrap);

  const actions = document.createElement('div');
  actions.className = 'cx-actions';

  const helpLink = document.createElement('a');
  helpLink.className = 'cx-help-link';
  helpLink.textContent = def.helpText;
  helpLink.href = '#';
  helpLink.addEventListener('click', e => {
    e.preventDefault();
    const a = Object.assign(document.createElement('a'), { href: def.helpUrl, target: '_blank', rel: 'noopener noreferrer' });
    a.click();
  });
  actions.appendChild(helpLink);

  const btnGroup = document.createElement('div');
  btnGroup.className = 'cx-btn-group';

  if (isConnected) {
    const updateBtn = document.createElement('button');
    updateBtn.className = 'cx-secondary-btn';
    updateBtn.textContent = 'Update credentials';
    updateBtn.addEventListener('click', () => { fieldsWrap.style.display = ''; updateBtn.style.display = 'none'; });
    btnGroup.appendChild(updateBtn);

    const disconnectBtn = document.createElement('button');
    disconnectBtn.className = 'cx-disconnect-btn';
    disconnectBtn.textContent = 'Disconnect';
    disconnectBtn.addEventListener('click', () => onDisconnect(def.id));
    btnGroup.appendChild(disconnectBtn);
  } else {
    const connectBtn = document.createElement('button');
    connectBtn.id = `cx-connect-btn-${def.id}`;
    connectBtn.className = 'cx-connect-btn';
    connectBtn.textContent = def.oauthFlow ? 'Sign in with Google' : `Connect ${def.name}`;
    connectBtn.addEventListener('click', () => onConnect(def.id, def));
    btnGroup.appendChild(connectBtn);
  }

  actions.appendChild(btnGroup);
  card.appendChild(actions);
  return card;
}

/* ── Free API connector card ── */
export function buildFreeCard(def, cxState) {
  const isEnabled = cxState.freeStatuses[def.id] ?? true;

  const card = document.createElement('div');
  card.className = `cx-free-card${isEnabled ? ' cx-free-enabled' : ' cx-free-disabled'}`;
  card.id = `cx-free-card-${def.id}`;

  const header = document.createElement('div');
  header.className = 'cx-free-header';
  header.innerHTML = `
    <div class="cx-free-icon">${def.icon}</div>
    <div class="cx-free-info">
      <div class="cx-free-name">
        ${def.name}
        ${def.noKey ? '<span class="cx-free-badge">Free · No key</span>' : def.optionalKey ? '<span class="cx-free-badge cx-free-badge--optional">Free · Optional key</span>' : '<span class="cx-free-badge cx-free-badge--key">Free key required</span>'}
      </div>
      <div class="cx-free-desc">${def.description}</div>
    </div>`;

  const toggleWrap = document.createElement('label');
  toggleWrap.className = 'cx-free-toggle';
  toggleWrap.title = isEnabled ? 'Click to disable' : 'Click to enable';
  toggleWrap.innerHTML = `
    <input type="checkbox" class="cx-free-toggle-input" ${isEnabled ? 'checked' : ''} />
    <span class="cx-free-toggle-track"></span>`;
  toggleWrap.querySelector('.cx-free-toggle-input').addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    cxState.freeStatuses[def.id] = enabled;
    card.classList.toggle('cx-free-enabled', enabled);
    card.classList.toggle('cx-free-disabled', !enabled);
    toggleWrap.title = enabled ? 'Click to disable' : 'Click to enable';
    await window.electronAPI?.toggleFreeConnector?.(def.id, enabled);
  });

  header.appendChild(toggleWrap);
  card.appendChild(header);

  if (def.toolHint) {
    const hint = document.createElement('div');
    hint.className = 'cx-free-tool-hint';
    hint.innerHTML = `<span class="cx-free-tool-hint-icon">💬</span> ${def.toolHint}`;
    card.appendChild(hint);
  }

  if (!def.noKey) {
    const keySection = document.createElement('div');
    keySection.className = 'cx-free-key-section';

    const keyLabel = document.createElement('div');
    keyLabel.className = 'cx-free-key-label';
    keyLabel.textContent = def.keyLabel;

    const keyWrap = document.createElement('div');
    keyWrap.className = 'cx-free-key-wrap key-input-wrap';

    const keyInput = document.createElement('input');
    keyInput.type = 'password';
    keyInput.className = 'cx-field-input cx-free-key-input';
    keyInput.id = `cx-free-key-${def.id}`;
    keyInput.placeholder = def.keyPlaceholder;
    keyInput.autocomplete = 'off';
    keyInput.spellcheck = false;
    if (cxState.freeKeys[def.id]?.saved) keyInput.value = cxState.freeKeys[def.id].value ?? '';

    const eyeBtn = document.createElement('button');
    eyeBtn.type = 'button';
    eyeBtn.className = 'key-eye';
    eyeBtn.title = 'Show / hide';
    eyeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-width="1.8"/><circle cx="12" cy="12" r="3" stroke-width="1.8"/></svg>`;
    eyeBtn.addEventListener('click', () => { keyInput.type = keyInput.type === 'password' ? 'text' : 'password'; });
    keyWrap.append(keyInput, eyeBtn);

    const keyHint = document.createElement('div');
    keyHint.className = 'cx-field-hint';
    keyHint.textContent = def.keyHint;

    const keyActions = document.createElement('div');
    keyActions.className = 'cx-free-key-actions';

    const saveKeyBtn = document.createElement('button');
    saveKeyBtn.className = 'cx-connect-btn cx-free-save-btn';
    saveKeyBtn.textContent = 'Save key';
    saveKeyBtn.addEventListener('click', async () => {
      const val = keyInput.value.trim();
      saveKeyBtn.disabled = true;
      saveKeyBtn.textContent = 'Saving…';
      const res = await window.electronAPI?.saveFreeConnectorKey?.(def.id, val);
      if (res?.ok !== false) {
        cxState.freeKeys[def.id] = { saved: true, value: val };
        saveKeyBtn.textContent = '✓ Saved';
        setFreeStatus(def.id, val ? `Key saved — ${def.name} is ready.` : 'Key cleared.', 'success');
        setTimeout(() => { saveKeyBtn.disabled = false; saveKeyBtn.textContent = 'Save key'; }, 2000);
      } else {
        setFreeStatus(def.id, `Error: ${res.error}`, 'error');
        saveKeyBtn.disabled = false;
        saveKeyBtn.textContent = 'Save key';
      }
    });

    const docsLink = document.createElement('a');
    docsLink.className = 'cx-help-link';
    docsLink.textContent = 'Get free key →';
    docsLink.href = '#';
    docsLink.addEventListener('click', e => {
      e.preventDefault();
      const a = Object.assign(document.createElement('a'), { href: def.docsUrl, target: '_blank', rel: 'noopener noreferrer' });
      a.click();
    });

    keyActions.append(docsLink, saveKeyBtn);
    keySection.append(keyLabel, keyWrap, keyHint, keyActions);

    const statusEl = document.createElement('div');
    statusEl.className = 'cx-status-msg';
    statusEl.id = `cx-free-status-${def.id}`;
    keySection.appendChild(statusEl);

    card.appendChild(keySection);
  }

  return card;
}
