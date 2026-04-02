import { getPersonasHTML } from './Templates/PersonasTemplate.js';
import { createPersonaCardPool } from './Components/PersonasCards.js';

// ── Module-level refs (reset on each mount) ──────────────────────────────────
let activeBanner  = null;
let activeNameEl  = null;
let personasGrid  = null;
let searchInput   = null;
let searchClearBtn = null;
let countEl       = null;
let _navigate     = null;
let _activePersona = null;
let _allPersonas  = [];
let _personaPool  = null;

// ── Helpers ───────────────────────────────────────────────────────────────────
function matchesSearch(persona, query) {
  if (!query) return true;
  const lowerQuery = query.toLowerCase();
  return [persona.name, persona.personality, persona.description, persona.instructions, persona.filename]
    .join(' ')
    .toLowerCase()
    .includes(lowerQuery);
}

function updateBanner() {
  if (!activeBanner || !activeNameEl) return;
  activeBanner.hidden = false;
  activeNameEl.textContent = _activePersona ? _activePersona.name : 'Default Assistant';
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

  const defaultKeywords = 'default assistant helpful accurate contextual standard';
  const lowerQuery = query.toLowerCase();
  const showDefault = !query || defaultKeywords.includes(lowerQuery) || 'default assistant'.includes(lowerQuery);

  const filteredCustom = _allPersonas.filter(persona => matchesSearch(persona, query));
  const visibleItems = [];
  if (showDefault) visibleItems.push({ _isDefault: true });
  visibleItems.push(...filteredCustom);

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

  _personaPool.render(visibleItems, _activePersona?.filename ?? null);
}

// ── Data loading ──────────────────────────────────────────────────────────────
async function load() {
  try {
    const [personasResult, activeResult] = await Promise.all([
      window.electronAPI?.getPersonas?.(),
      window.electronAPI?.getActivePersona?.(),
    ]);
    _allPersonas   = personasResult?.personas ?? [];
    _activePersona = activeResult?.persona ?? null;
  } catch (error) {
    console.error('[Personas] Load error:', error);
    _allPersonas   = [];
    _activePersona = null;
  }

  render(searchInput?.value?.trim() ?? '');
}

// ── mount ─────────────────────────────────────────────────────────────────────
export function mount(outlet, { navigate }) {
  outlet.innerHTML = getPersonasHTML();

  activeBanner   = document.getElementById('personas-active-banner');
  activeNameEl   = document.getElementById('personas-active-name');
  personasGrid   = document.getElementById('personas-grid');
  searchInput    = document.getElementById('personas-search');
  searchClearBtn = document.getElementById('personas-search-clear');
  countEl        = document.getElementById('personas-count');
  _navigate      = navigate;

  _activePersona = null;
  _allPersonas   = [];

  _personaPool = createPersonaCardPool({
    container: personasGrid,
    onActivateDefault: async () => {
      await window.electronAPI?.resetActivePersona?.();
      _activePersona = null;
      render(searchInput?.value?.trim() ?? '');
    },
    onChatDefault: async () => {
      await window.electronAPI?.resetActivePersona?.();
      _activePersona = null;
      await navigateToChat();
    },
    onActivatePersona: async (persona) => {
      const result = await window.electronAPI?.setActivePersona?.(persona);
      if (result?.ok !== false) {
        _activePersona = persona;
        render(searchInput?.value?.trim() ?? '');
      }
    },
    onDeactivatePersona: async () => {
      await window.electronAPI?.resetActivePersona?.();
      _activePersona = null;
      render(searchInput?.value?.trim() ?? '');
    },
    onChatPersona: async (persona) => {
      const result = await window.electronAPI?.setActivePersona?.(persona);
      if (result?.ok !== false) {
        _activePersona = persona;
        await navigateToChat();
      }
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

  searchInput?.addEventListener('input', onSearchInput);
  searchClearBtn?.addEventListener('click', onSearchClear);

  load();

  return function cleanup() {
    searchInput?.removeEventListener('input', onSearchInput);
    searchClearBtn?.removeEventListener('click', onSearchClear);

    _personaPool?.clear();
    _personaPool = null;
    activeBanner   = null;
    activeNameEl   = null;
    personasGrid   = null;
    searchInput    = null;
    searchClearBtn = null;
    countEl        = null;
    _navigate      = null;
  };
}
