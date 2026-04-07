import { createCardPool } from '../../../../System/CardPool.js';
import { escapeHtml, renderMarkdownToHtml } from '../../../../System/Utils.js';
import { getMarketplaceHTML } from './Templates/MarketplaceTemplate.js';

let countEl = null;
let sourceEl = null;
let gridEl = null;
let loadingEl = null;
let loadingCopyEl = null;
let errorEl = null;
let emptyEl = null;
let emptyTitleEl = null;
let emptyCopyEl = null;
let sentinelEl = null;
let searchInput = null;
let searchClearBtn = null;
let sortSelect = null;
let tabButtons = [];
let filterButtons = [];

let modalBackdrop = null;
let modalNameEl = null;
let modalMetaEl = null;
let modalIconEl = null;
let modalVerifiedEl = null;
let modalStatusEl = null;
let modalContentEl = null;
let modalInstallBtn = null;
let modalCloseBtn = null;

let _cardPool = null;
let _observer = null;
let _items = [];
let _selectedItem = null;
let _requestToken = 0;
let _activeType = 'skills';
let _activeFilter = 'all';
let _activeSort = 'az';
let _loading = false;
let _nextPage = 1;
let _hasMore = false;
let _origins = [];
let _activeOrigin = '';

function getTypeLabel(type) {
  return type === 'personas' ? 'Personas' : 'Skills';
}

function getTypeNoun(type) {
  return type === 'personas' ? 'persona' : 'skill';
}

function getItemIcon(type) {
  if (type === 'personas') {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5.5 19a6.5 6.5 0 0113 0" stroke-linecap="round" />
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
}

function updateCount() {
  if (!countEl) return;

  const label = getTypeLabel(_activeType).toLowerCase();
  countEl.textContent = `${_items.length} ${label}`;
}

function updateSource() {
  if (!sourceEl) return;

  if (!_activeOrigin) {
    sourceEl.hidden = true;
    sourceEl.textContent = '';
    return;
  }

  try {
    sourceEl.textContent = new URL(_activeOrigin).host;
  } catch {
    sourceEl.textContent = _activeOrigin;
  }
  sourceEl.hidden = false;
}

function updateTabs() {
  tabButtons.forEach((button) => {
    const isActive = button.dataset.type === _activeType;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

function updateFilters() {
  filterButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.filter === _activeFilter);
  });
}

function updateListSurface() {
  updateCount();
  updateSource();

  const hasItems = _items.length > 0;
  if (gridEl) gridEl.hidden = !hasItems;
  if (sentinelEl) sentinelEl.hidden = !_hasMore;

  if (hasItems || _loading || errorEl?.hidden === false) {
    emptyEl.hidden = true;
    return;
  }

  emptyTitleEl.textContent = `No ${getTypeLabel(_activeType).toLowerCase()} found`;
  emptyCopyEl.textContent = searchInput?.value.trim()
    ? `Nothing matched "${searchInput.value.trim()}". Try a different search or publisher filter.`
    : `The marketplace did not return any ${getTypeLabel(_activeType).toLowerCase()} for this view yet.`;
  emptyEl.hidden = false;
}

function setLoading(visible, copy = 'Loading marketplace...') {
  if (!loadingEl || !loadingCopyEl) return;
  loadingEl.hidden = !visible;
  loadingCopyEl.textContent = copy;
}

function setError(message = '') {
  if (!errorEl) return;
  if (!message) {
    errorEl.hidden = true;
    errorEl.textContent = '';
    return;
  }

  const originHint = _origins.length ? ` Tried: ${_origins.join(', ')}` : '';
  errorEl.textContent = `${message}${originHint}`;
  errorEl.hidden = false;
}

function mergeItems(existingItems, nextItems) {
  const byId = new Map(existingItems.map((item) => [item.id, item]));
  for (const item of nextItems) {
    byId.set(item.id, item);
  }
  return [...byId.values()];
}

function buildMetaChips(item) {
  const chips = [
    `<span class="marketplace-chip marketplace-chip--type">${escapeHtml(getTypeNoun(item.type))}</span>`,
    `<span class="marketplace-chip">${escapeHtml(item.publisher)}</span>`,
  ];

  if (item.type === 'skills' && item.trigger) {
    chips.push(`<span class="marketplace-chip">${escapeHtml(item.trigger)}</span>`);
  }

  if (item.type === 'personas' && item.personality) {
    chips.push(`<span class="marketplace-chip">${escapeHtml(item.personality)}</span>`);
  }

  if (item.downloads > 0) {
    chips.push(`<span class="marketplace-chip">${item.downloads} downloads</span>`);
  }

  if (item.stars > 0) {
    chips.push(`<span class="marketplace-chip">${item.stars} stars</span>`);
  }

  return chips.join('');
}

function createCard() {
  const card = document.createElement('article');
  card.className = 'marketplace-card';
  card.innerHTML = `
    <div class="marketplace-card-head">
      <div class="marketplace-card-icon"></div>
      <div class="marketplace-card-title-group">
        <div class="marketplace-card-name-row">
          <div class="marketplace-card-name"></div>
          <span class="marketplace-card-verified" hidden aria-label="Verified Joanium item" title="Verified Joanium item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12.75l2.25 2.25L15 9.75" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M12 3l2.6 1.2 2.84-.34 1.2 2.6 2.36 1.62-.8 2.74.8 2.74-2.36 1.62-1.2 2.6-2.84-.34L12 21l-2.6-1.2-2.84.34-1.2-2.6L3 15.92l.8-2.74L3 10.44l2.36-1.62 1.2-2.6 2.84.34L12 3z" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </div>
        <div class="marketplace-card-publisher"></div>
      </div>
      <span class="marketplace-card-status" hidden></span>
    </div>
    <div class="marketplace-card-description"></div>
    <div class="marketplace-card-tags"></div>
    <div class="marketplace-card-footer">
      <button class="marketplace-card-read-btn" type="button">Read</button>
      <button class="marketplace-card-install-btn" type="button">Install</button>
    </div>
  `;

  card.addEventListener('click', (event) => {
    if (event.target.closest('button')) return;
    if (card._item) openModal(card._item);
  });

  card.querySelector('.marketplace-card-read-btn')?.addEventListener('click', (event) => {
    event.stopPropagation();
    if (card._item) openModal(card._item);
  });

  card.querySelector('.marketplace-card-install-btn')?.addEventListener('click', async (event) => {
    event.stopPropagation();
    if (card._item) {
      await installItem(card._item);
    }
  });

  return card;
}

function updateCard(card, item) {
  card._item = item;
  card.dataset.itemId = item.id;
  card.querySelector('.marketplace-card-icon').innerHTML = getItemIcon(item.type);
  card.querySelector('.marketplace-card-name').textContent = item.name;
  card.querySelector('.marketplace-card-publisher').textContent = item.publisher;
  card.querySelector('.marketplace-card-description').textContent =
    item.description || item.excerpt || 'Open to read the full file.';
  card.querySelector('.marketplace-card-tags').innerHTML = buildMetaChips(item);
  card.querySelector('.marketplace-card-verified').hidden = item.isVerified !== true;

  const statusEl = card.querySelector('.marketplace-card-status');
  statusEl.hidden = item.isInstalled !== true;
  statusEl.textContent = item.isInstalled ? 'Installed' : '';

  const installBtn = card.querySelector('.marketplace-card-install-btn');
  installBtn.textContent = item.isInstalled ? 'Installed' : 'Install';
  installBtn.disabled = item.isInstalled === true;
}

function updateModal(item) {
  modalNameEl.textContent = item.name;
  modalMetaEl.innerHTML = buildMetaChips(item);
  modalIconEl.innerHTML = getItemIcon(item.type);
  modalVerifiedEl.hidden = item.isVerified !== true;
  modalInstallBtn.disabled = item.isInstalled === true;
  modalInstallBtn.textContent = item.isInstalled ? 'Installed' : 'Install';
}

function setModalStatus(message = '', tone = 'info') {
  if (!modalStatusEl) return;

  if (!message) {
    modalStatusEl.hidden = true;
    modalStatusEl.textContent = '';
    modalStatusEl.dataset.tone = '';
    return;
  }

  modalStatusEl.hidden = false;
  modalStatusEl.dataset.tone = tone;
  modalStatusEl.textContent = message;
}

async function openModal(item) {
  _selectedItem = item;
  updateModal(item);
  modalContentEl.innerHTML = item.markdown ? renderMarkdownToHtml(item.markdown) : '';
  setModalStatus(item.markdown ? '' : 'Loading the full file...', 'info');
  modalBackdrop.classList.add('open');
  document.body.classList.add('modal-open');

  if (item.markdown) return;

  try {
    const result = await window.electronAPI?.invoke?.('marketplace-get-item-detail', {
      type: item.type,
      item,
    });
    if (!result?.ok) throw new Error(result?.error || 'Could not load the marketplace item.');

    const detail = result.item ?? item;
    _selectedItem = detail;
    _items = mergeItems(_items, [detail]);
    _cardPool?.render(_items);
    updateListSurface();
    updateModal(detail);
    modalContentEl.innerHTML = renderMarkdownToHtml(detail.markdown);
    setModalStatus('', 'info');
  } catch (error) {
    modalContentEl.innerHTML = '';
    setModalStatus(error.message, 'error');
  }
}

function closeModal() {
  modalBackdrop?.classList.remove('open');
  document.body.classList.remove('modal-open');
  setModalStatus('', 'info');
}

async function installItem(item) {
  const previousLabel = modalInstallBtn?.textContent;

  if (_selectedItem?.id === item.id) {
    modalInstallBtn.disabled = true;
    modalInstallBtn.textContent = 'Installing...';
    setModalStatus('Installing into your local library...', 'info');
  }

  try {
    const result = await window.electronAPI?.invoke?.('marketplace-install-item', {
      type: item.type,
      item,
    });
    if (!result?.ok) throw new Error(result?.error || 'Install failed.');

    const installedItem = {
      ...(result.item ?? item),
      isInstalled: true,
      installedSource: 'user',
    };
    _items = mergeItems(
      _items.map((entry) => (entry.id === installedItem.id ? installedItem : entry)),
      [installedItem],
    );
    _cardPool?.render(_items);
    updateListSurface();

    if (_selectedItem?.id === installedItem.id) {
      _selectedItem = installedItem;
      updateModal(installedItem);
      setModalStatus(
        'Installed successfully. It is now available in your local library.',
        'success',
      );
    }
  } catch (error) {
    if (_selectedItem?.id === item.id) {
      modalInstallBtn.disabled = false;
      modalInstallBtn.textContent = previousLabel || 'Install';
      setModalStatus(error.message, 'error');
    }
  }
}

async function loadItems({ reset = false } = {}) {
  if (_loading && !reset) return;

  if (reset) {
    _items = [];
    _nextPage = 1;
    _hasMore = false;
    _cardPool?.render(_items);
    updateListSurface();
  } else if (!_hasMore || !_nextPage) {
    return;
  }

  const token = ++_requestToken;
  _loading = true;
  setError('');
  setLoading(
    true,
    reset ? `Loading ${getTypeLabel(_activeType).toLowerCase()}...` : 'Loading more...',
  );

  try {
    const result = await window.electronAPI?.invoke?.('marketplace-list-items', {
      type: _activeType,
      page: reset ? 1 : _nextPage,
      search: searchInput?.value.trim() ?? '',
      filter: _activeFilter,
      sort: _activeSort,
      limit: 24,
    });
    if (token !== _requestToken) return;
    if (!result?.ok) throw new Error(result?.error || 'Marketplace loading failed.');

    _activeOrigin = result.origin ?? _activeOrigin;
    _items = reset ? (result.items ?? []) : mergeItems(_items, result.items ?? []);
    _nextPage = result.nextPage ?? null;
    _hasMore = Boolean(result.hasMore);
    _cardPool?.render(_items);
  } catch (error) {
    if (token !== _requestToken) return;
    setError(error.message || 'Marketplace loading failed.');
  } finally {
    if (token === _requestToken) {
      _loading = false;
      setLoading(false);
      updateListSurface();
    }
  }
}

function refreshMarketplace() {
  updateTabs();
  updateFilters();
  loadItems({ reset: true });
}

function setupObserver() {
  if (!sentinelEl) return;

  _observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry?.isIntersecting || _loading || !_hasMore) return;
      loadItems({ reset: false });
    },
    { rootMargin: '240px 0px' },
  );

  _observer.observe(sentinelEl);
}

export function mount(outlet) {
  outlet.innerHTML = getMarketplaceHTML();

  countEl = document.getElementById('marketplace-count');
  sourceEl = document.getElementById('marketplace-source');
  gridEl = document.getElementById('marketplace-grid');
  loadingEl = document.getElementById('marketplace-loading');
  loadingCopyEl = document.getElementById('marketplace-loading-copy');
  errorEl = document.getElementById('marketplace-error');
  emptyEl = document.getElementById('marketplace-empty');
  emptyTitleEl = document.getElementById('marketplace-empty-title');
  emptyCopyEl = document.getElementById('marketplace-empty-copy');
  sentinelEl = document.getElementById('marketplace-sentinel');
  searchInput = document.getElementById('marketplace-search');
  searchClearBtn = document.getElementById('marketplace-search-clear');
  sortSelect = document.getElementById('marketplace-sort');
  tabButtons = Array.from(document.querySelectorAll('.marketplace-tab'));
  filterButtons = Array.from(document.querySelectorAll('.marketplace-filter-chip'));

  modalBackdrop = document.getElementById('marketplace-modal-backdrop');
  modalNameEl = document.getElementById('marketplace-modal-name');
  modalMetaEl = document.getElementById('marketplace-modal-meta');
  modalIconEl = document.getElementById('marketplace-modal-icon');
  modalVerifiedEl = document.getElementById('marketplace-modal-verified');
  modalStatusEl = document.getElementById('marketplace-modal-status');
  modalContentEl = document.getElementById('marketplace-modal-content');
  modalInstallBtn = document.getElementById('marketplace-modal-install');
  modalCloseBtn = document.getElementById('marketplace-modal-close');

  _items = [];
  _selectedItem = null;
  _requestToken = 0;
  _activeType = 'skills';
  _activeFilter = 'all';
  _activeSort = 'az';
  _loading = false;
  _nextPage = 1;
  _hasMore = false;
  _activeOrigin = '';

  _cardPool = createCardPool({
    container: gridEl,
    createCard,
    updateCard,
    getKey: (item) => item.id,
  });

  setupObserver();

  const onSearchInput = () => {
    searchClearBtn?.classList.toggle('visible', (searchInput?.value.length ?? 0) > 0);
    refreshMarketplace();
  };
  const onSearchClear = () => {
    if (searchInput) searchInput.value = '';
    searchClearBtn?.classList.remove('visible');
    refreshMarketplace();
    searchInput?.focus();
  };
  const onSortChange = () => {
    _activeSort = sortSelect?.value ?? 'az';
    refreshMarketplace();
  };
  const onTabClick = (event) => {
    const nextType = event.currentTarget?.dataset?.type;
    if (!nextType || nextType === _activeType) return;
    _activeType = nextType;
    refreshMarketplace();
  };
  const onFilterClick = (event) => {
    const nextFilter = event.currentTarget?.dataset?.filter;
    if (!nextFilter || nextFilter === _activeFilter) return;
    _activeFilter = nextFilter;
    refreshMarketplace();
  };
  const onModalClose = () => closeModal();
  const onModalBackdropClick = (event) => {
    if (event.target === modalBackdrop) closeModal();
  };
  const onModalInstall = async () => {
    if (_selectedItem) await installItem(_selectedItem);
  };
  const onKeydown = (event) => {
    if (event.key === 'Escape') closeModal();
  };

  searchInput?.addEventListener('input', onSearchInput);
  searchClearBtn?.addEventListener('click', onSearchClear);
  sortSelect?.addEventListener('change', onSortChange);
  tabButtons.forEach((button) => button.addEventListener('click', onTabClick));
  filterButtons.forEach((button) => button.addEventListener('click', onFilterClick));
  modalCloseBtn?.addEventListener('click', onModalClose);
  modalBackdrop?.addEventListener('click', onModalBackdropClick);
  modalInstallBtn?.addEventListener('click', onModalInstall);
  document.addEventListener('keydown', onKeydown);

  const configPromise = window.electronAPI?.invoke?.('marketplace-get-config');
  configPromise?.then((config) => {
    _origins = config?.origins ?? [];
  });

  refreshMarketplace();

  return function cleanup() {
    closeModal();
    _observer?.disconnect();
    _observer = null;
    _cardPool?.clear();
    _cardPool = null;

    searchInput?.removeEventListener('input', onSearchInput);
    searchClearBtn?.removeEventListener('click', onSearchClear);
    sortSelect?.removeEventListener('change', onSortChange);
    tabButtons.forEach((button) => button.removeEventListener('click', onTabClick));
    filterButtons.forEach((button) => button.removeEventListener('click', onFilterClick));
    modalCloseBtn?.removeEventListener('click', onModalClose);
    modalBackdrop?.removeEventListener('click', onModalBackdropClick);
    modalInstallBtn?.removeEventListener('click', onModalInstall);
    document.removeEventListener('keydown', onKeydown);

    countEl = sourceEl = gridEl = loadingEl = loadingCopyEl = null;
    errorEl = emptyEl = emptyTitleEl = emptyCopyEl = sentinelEl = null;
    searchInput = searchClearBtn = sortSelect = null;
    tabButtons = [];
    filterButtons = [];
    modalBackdrop = modalNameEl = modalMetaEl = modalIconEl = null;
    modalVerifiedEl = modalStatusEl = modalContentEl = modalInstallBtn = modalCloseBtn = null;
  };
}
