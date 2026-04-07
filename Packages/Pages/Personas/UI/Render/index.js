import { getPersonasHTML } from './Templates/PersonasTemplate.js';
import { createPersonaCardPool, getAvatarInitials } from './Components/PersonasCards.js';

// ── Module-level refs (reset on each mount) ──────────────────────────────────
let activeBanner = null;
let activeNameEl = null;
let personasGrid = null;
let personasEmpty = null;
let searchInput = null;
let searchClearBtn = null;
let countEl = null;
let _navigate = null;
let _activePersona = null;
let _allPersonas = [];
let _personaPool = null;
let modalBackdrop = null;
let modalNameEl = null;
let modalAvatarEl = null;
let modalContent = null;
let modalCloseBtn = null;

// ── Helpers ───────────────────────────────────────────────────────────────────
function matchesSearch(persona, query) {
  if (!query) return true;
  const lowerQuery = query.toLowerCase();
  return [
    persona.name,
    persona.publisher,
    persona.personality,
    persona.description,
    persona.instructions,
    persona.filename,
  ]
    .join(' ')
    .toLowerCase()
    .includes(lowerQuery);
}

function renderMarkdown(raw = '') {
  let text = String(raw)
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
    .trim();
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html = html.replace(/```([\s\S]*?)```/g, (_match, inner) => {
    const newlineIndex = inner.indexOf('\n');
    const code = newlineIndex >= 0 ? inner.slice(newlineIndex + 1) : inner;
    return `</p><pre><code>${code}</code></pre><p>`;
  });
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^### (.+)$/gm, '</p><h3>$1</h3><p>');
  html = html.replace(/^## (.+)$/gm, '</p><h2>$1</h2><p>');
  html = html.replace(/^# (.+)$/gm, '</p><h1>$1</h1><p>');
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  html = `<p>${html}</p>`;
  html = html.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>');
  html = html.replace(/<p>\s*<\/p>/g, '').replace(/<p><br><\/p>/g, '');
  return html;
}

function openModal(persona) {
  if (!modalBackdrop || !modalNameEl || !modalContent) return;
  modalNameEl.textContent = persona.name || 'Persona';
  if (modalAvatarEl) {
    if (persona._isDefault) {
      modalAvatarEl.innerHTML = `<img src="../../../Assets/Logo/Logo.png" alt="Joanium" width="36" height="36">`;
      modalAvatarEl.className = 'persona-modal-avatar persona-modal-avatar--default';
    } else {
      modalAvatarEl.textContent = getAvatarInitials(persona.name);
      modalAvatarEl.className = 'persona-modal-avatar';
    }
  }
  modalContent.innerHTML = renderMarkdown(persona.instructions || persona.description || '');
  modalBackdrop.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeModal() {
  modalBackdrop?.classList.remove('open');
  document.body.classList.remove('modal-open');
}

function updateBanner() {
  if (!activeBanner || !activeNameEl) return;
  activeBanner.hidden = false;
  activeNameEl.textContent = _activePersona ? _activePersona.name : 'Joana';
}

function navigateToChat() {
  return _navigate?.('chat', { startFreshChat: true });
}

// ── Rendering ─────────────────────────────────────────────────────────────────
function render(query = '') {
  updateBanner();

  const total = 1 + _allPersonas.length;
  if (countEl) countEl.textContent = `${total} persona${total !== 1 ? 's' : ''}`;

  if (!personasGrid || !_personaPool) return;

  // Show empty state when there are no custom personas at all (ignoring search)
  if (_allPersonas.length === 0) {
    if (personasEmpty) personasEmpty.hidden = false;
    personasGrid.style.display = 'none';
    return;
  }

  if (personasEmpty) personasEmpty.hidden = true;
  personasGrid.style.display = '';

  const filteredCustom = _allPersonas.filter((persona) => matchesSearch(persona, query));
  const visibleItems = [...filteredCustom];

  if (visibleItems.length === 0) {
    _personaPool.render([], null);
    let noResults = personasGrid.querySelector('.personas-no-results');
    if (!noResults) {
      noResults = document.createElement('div');
      noResults.className = 'personas-no-results';
      personasGrid.appendChild(noResults);
    }
    noResults.textContent = `No personas match "${query}"`;
    noResults.style.display = '';
    return;
  }

  const noResults = personasGrid.querySelector('.personas-no-results');
  if (noResults) noResults.style.display = 'none';

  _personaPool.render(visibleItems, _activePersona?.id ?? null);
}

// ── Data loading ──────────────────────────────────────────────────────────────
async function load() {
  try {
    const [personasResult, activeResult] = await Promise.all([
      window.electronAPI?.invoke?.('get-personas'),
      window.electronAPI?.invoke?.('get-active-persona'),
    ]);
    _allPersonas = personasResult?.personas ?? [];
    _activePersona = activeResult?.persona ?? null;
  } catch (error) {
    console.error('[Personas] Load error:', error);
    _allPersonas = [];
    _activePersona = null;
  }

  render(searchInput?.value?.trim() ?? '');
}

// ── mount ─────────────────────────────────────────────────────────────────────
export function mount(outlet, { navigate }) {
  outlet.innerHTML = getPersonasHTML();

  activeBanner = document.getElementById('personas-active-banner');
  activeNameEl = document.getElementById('personas-active-name');
  personasGrid = document.getElementById('personas-grid');
  personasEmpty = document.getElementById('personas-empty');
  searchInput = document.getElementById('personas-search');
  searchClearBtn = document.getElementById('personas-search-clear');
  countEl = document.getElementById('personas-count');
  modalBackdrop = document.getElementById('persona-modal-backdrop');
  modalNameEl = document.getElementById('persona-modal-name');
  modalAvatarEl = document.getElementById('persona-modal-avatar');
  modalContent = document.getElementById('persona-modal-content');
  modalCloseBtn = document.getElementById('persona-modal-close');
  _navigate = navigate;

  _activePersona = null;
  _allPersonas = [];

  _personaPool = createPersonaCardPool({
    container: personasGrid,
    onActivateDefault: async () => {
      await window.electronAPI?.invoke?.('reset-active-persona');
      _activePersona = null;
      render(searchInput?.value?.trim() ?? '');
    },
    onChatDefault: async () => {
      await window.electronAPI?.invoke?.('reset-active-persona');
      _activePersona = null;
      await navigateToChat();
    },
    onActivatePersona: async (persona) => {
      const result = await window.electronAPI?.invoke?.('set-active-persona', persona);
      if (result?.ok !== false) {
        _activePersona = persona;
        render(searchInput?.value?.trim() ?? '');
      }
    },
    onDeactivatePersona: async () => {
      await window.electronAPI?.invoke?.('reset-active-persona');
      const activeResult = await window.electronAPI?.invoke?.('get-active-persona');
      _activePersona = activeResult?.persona ?? null;
      render(searchInput?.value?.trim() ?? '');
    },
    onChatPersona: async (persona) => {
      const result = await window.electronAPI?.invoke?.('set-active-persona', persona);
      if (result?.ok !== false) {
        _activePersona = persona;
        await navigateToChat();
      }
    },
    onReadPersona: (persona) => {
      openModal(persona);
    },
  });

  const onSearchInput = () => {
    render(searchInput?.value.trim() ?? '');
    searchClearBtn?.classList.toggle('visible', (searchInput?.value.length ?? 0) > 0);
  };
  const onSearchClear = () => {
    if (searchInput) searchInput.value = '';
    searchClearBtn?.classList.remove('visible');
    render('');
    searchInput?.focus();
  };
  const onModalClose = () => closeModal();
  const onModalBackdropClick = (e) => {
    if (e.target === modalBackdrop) closeModal();
  };
  const onKeydown = (e) => {
    if (e.key === 'Escape') closeModal();
  };

  modalCloseBtn?.addEventListener('click', onModalClose);
  modalBackdrop?.addEventListener('click', onModalBackdropClick);
  searchInput?.addEventListener('input', onSearchInput);
  searchClearBtn?.addEventListener('click', onSearchClear);
  document
    .getElementById('personas-go-marketplace')
    ?.addEventListener('click', () => _navigate?.('marketplace'));
  document.addEventListener('keydown', onKeydown);

  load();

  return function cleanup() {
    closeModal();
    modalCloseBtn?.removeEventListener('click', onModalClose);
    modalBackdrop?.removeEventListener('click', onModalBackdropClick);
    searchInput?.removeEventListener('input', onSearchInput);
    searchClearBtn?.removeEventListener('click', onSearchClear);
    document.removeEventListener('keydown', onKeydown);

    _personaPool?.clear();
    _personaPool = null;
    activeBanner = null;
    activeNameEl = null;
    personasGrid = null;
    personasEmpty = null;
    searchInput = null;
    searchClearBtn = null;
    countEl = null;
    _navigate = null;
    modalBackdrop = null;
    modalNameEl = null;
    modalAvatarEl = null;
    modalContent = null;
    modalCloseBtn = null;
  };
}
