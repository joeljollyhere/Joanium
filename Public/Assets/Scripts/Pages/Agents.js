// ─────────────────────────────────────────────
//  openworld — Public/Assets/Scripts/Pages/Agents.js
// ─────────────────────────────────────────────

import { initSidebar }       from '../Shared/Sidebar.js';
import { initAboutModal }    from '../Shared/Modals/AboutModal.js';
import { initLibraryModal }  from '../Shared/Modals/LibraryModal.js';
import { initSettingsModal } from '../Shared/Modals/SettingsModal.js';

const about    = initAboutModal();
const settings = initSettingsModal();

const library = initLibraryModal({
  onChatSelect: (chatId) => {
    if (chatId) localStorage.setItem('ow-pending-chat', chatId);
    window.electronAPI?.launchMain();
  },
});

const sidebar = initSidebar({
  activePage:    'agents',
  onNewChat:     () => window.electronAPI?.launchMain(),
  onLibrary:     () => library.isOpen() ? library.close() : library.open(),
  onAutomations: () => window.electronAPI?.launchAutomations?.(),
  onSkills:      () => window.electronAPI?.launchSkills?.(),
  onAgents:      () => { /* already here */ },
  onSettings:    () => settings.open(),
  onAbout:       () => about.open(),
});

window.addEventListener('ow:user-profile-updated', e => sidebar.setUser(e.detail?.name ?? ''));
settings.loadUser().then(user => sidebar.setUser(user?.name ?? ''));

// ── DOM refs ─────────────────────────────────────────────────────────────
const activeBanner  = document.getElementById('agents-active-banner');
const activeNameEl  = document.getElementById('agents-active-name');
const agentsGrid    = document.getElementById('agents-grid');
const searchWrapper = document.getElementById('agents-search-wrapper');
const searchInput   = document.getElementById('agents-search');
const countEl       = document.getElementById('agents-count');

// ── State ─────────────────────────────────────────────────────────────────
let _activeAgent = null;
let _allAgents   = []; // custom agents only

// ── Helpers ───────────────────────────────────────────────────────────────

function escapeHtml(v) {
  return String(v ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getAvatarInitials(name) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return String(name ?? '').trim().slice(0, 2).toUpperCase() || 'AI';
}

function isActiveCustom(agent) {
  return _activeAgent?.filename === agent?.filename;
}

function isDefaultActive() {
  return !_activeAgent;
}

function matchesSearch(agent, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return [agent.name, agent.personality, agent.description, agent.instructions, agent.filename]
    .join(' ').toLowerCase().includes(q);
}

// ── Banner ────────────────────────────────────────────────────────────────

function updateBanner() {
  if (!activeBanner || !activeNameEl) return;
  activeBanner.hidden    = false;
  activeNameEl.textContent = _activeAgent ? _activeAgent.name : 'Default Assistant';
}

// ── Default agent card ────────────────────────────────────────────────────

function buildDefaultCard() {
  const active = isDefaultActive();
  const card   = document.createElement('div');
  card.className = `agent-card agent-card--default${active ? ' is-active' : ''}`;

  card.innerHTML = `
    ${active ? `<div class="agent-active-badge"><div class="agent-active-badge-dot"></div>Active</div>` : ''}
    <div class="agent-avatar agent-avatar--default">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:24px;height:24px">
        <path d="M12 2L8 6H4v4L2 12l2 2v4h4l4 4 4-4h4v-4l2-2-2-2V6h-4L12 2z"/>
      </svg>
    </div>
    <div class="agent-info">
      <div class="agent-name">Default Assistant</div>
      <div class="agent-description">The standard openworld AI — helpful, accurate, and contextually aware of your system, repos, and email.</div>
    </div>
    <div class="agent-personality">
      <span class="agent-tag">helpful</span>
      <span class="agent-tag">accurate</span>
      <span class="agent-tag">contextual</span>
    </div>
    <div class="agent-card-footer">
      ${active
        ? `<button class="agent-status-btn" disabled>Currently active</button>`
        : `<button class="agent-activate-btn" type="button">Set active</button>`
      }
      <button class="agent-chat-btn" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Chat
      </button>
    </div>`;

  card.querySelector('.agent-activate-btn')?.addEventListener('click', async e => {
    e.stopPropagation();
    await window.electronAPI?.resetActiveAgent?.();
    _activeAgent = null;
    render(searchInput?.value?.trim() ?? '');
  });

  card.querySelector('.agent-chat-btn')?.addEventListener('click', async e => {
    e.stopPropagation();
    await window.electronAPI?.resetActiveAgent?.();
    window.electronAPI?.launchMain();
  });

  return card;
}

// ── Custom agent card ─────────────────────────────────────────────────────

function buildAgentCard(agent) {
  const active = isActiveCustom(agent);
  const card   = document.createElement('div');
  card.className = `agent-card${active ? ' is-active' : ''}`;

  const tags = (agent.personality || '')
    .split(',').map(t => t.trim()).filter(Boolean).slice(0, 5)
    .map(t => `<span class="agent-tag">${escapeHtml(t)}</span>`).join('');

  card.innerHTML = `
    ${active ? `<div class="agent-active-badge"><div class="agent-active-badge-dot"></div>Active</div>` : ''}
    <div class="agent-avatar">${escapeHtml(getAvatarInitials(agent.name))}</div>
    <div class="agent-info">
      <div class="agent-name">${escapeHtml(agent.name)}</div>
      ${agent.description ? `<div class="agent-description">${escapeHtml(agent.description)}</div>` : ''}
    </div>
    ${tags ? `<div class="agent-personality">${tags}</div>` : ''}
    <div class="agent-card-footer">
      ${active
        ? `<button class="agent-deactivate-btn" type="button">Deactivate</button>`
        : `<button class="agent-activate-btn" type="button">Activate</button>`
      }
      <button class="agent-chat-btn" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Chat
      </button>
    </div>`;

  card.querySelector('.agent-activate-btn')?.addEventListener('click', async e => {
    e.stopPropagation();
    const res = await window.electronAPI?.setActiveAgent?.(agent);
    if (res?.ok !== false) { _activeAgent = agent; render(searchInput?.value?.trim() ?? ''); }
  });

  card.querySelector('.agent-deactivate-btn')?.addEventListener('click', async e => {
    e.stopPropagation();
    await window.electronAPI?.resetActiveAgent?.();
    _activeAgent = null;
    render(searchInput?.value?.trim() ?? '');
  });

  card.querySelector('.agent-chat-btn')?.addEventListener('click', async e => {
    e.stopPropagation();
    await window.electronAPI?.setActiveAgent?.(agent);
    window.electronAPI?.launchMain();
  });

  return card;
}

// ── Full render ───────────────────────────────────────────────────────────

function render(query = '') {
  updateBanner();

  // Total count includes default + custom
  const total = 1 + _allAgents.length;
  if (countEl) countEl.textContent = `${total} agent${total !== 1 ? 's' : ''}`;

  if (!agentsGrid) return;
  agentsGrid.innerHTML = '';

  // Build merged list: default first, then custom
  const defaultAgent = { _isDefault: true };
  const allItems     = [defaultAgent, ..._allAgents];

  // Filter custom agents (default always shows when no query, or if query matches keywords)
  const defaultKeywords = 'default assistant helpful accurate contextual openworld standard';
  const showDefault = !query || defaultKeywords.includes(query.toLowerCase()) ||
    'default assistant'.includes(query.toLowerCase());

  const filteredCustom = _allAgents.filter(a => matchesSearch(a, query));
  const showItems = [];
  if (showDefault) showItems.push(defaultAgent);
  showItems.push(...filteredCustom);

  if (showItems.length === 0) {
    const nope = document.createElement('div');
    nope.className   = 'agents-no-results';
    nope.textContent = `No agents match "${query}"`;
    agentsGrid.appendChild(nope);
    return;
  }

  showItems.forEach(item => {
    if (item._isDefault) {
      agentsGrid.appendChild(buildDefaultCard());
    } else {
      agentsGrid.appendChild(buildAgentCard(item));
    }
  });
}

// ── Search wiring (with clear button) ────────────────────────────────────

const agentsClearBtn = document.getElementById('agents-search-clear');

searchInput?.addEventListener('input', () => {
  render(searchInput.value.trim());
  if (agentsClearBtn) agentsClearBtn.classList.toggle('visible', searchInput.value.length > 0);
});

agentsClearBtn?.addEventListener('click', () => {
  if (searchInput) searchInput.value = '';
  agentsClearBtn.classList.remove('visible');
  render('');
  searchInput?.focus();
});

// ── Boot ──────────────────────────────────────────────────────────────────

async function load() {
  try {
    const [agentsRes, activeRes] = await Promise.all([
      window.electronAPI?.getAgents?.(),
      window.electronAPI?.getActiveAgent?.(),
    ]);
    _allAgents   = agentsRes?.agents  ?? [];
    _activeAgent = activeRes?.agent   ?? null;
  } catch (err) {
    console.error('[Agents] Load error:', err);
  }
  render();
}

load();
