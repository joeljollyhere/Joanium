import { getHTML } from './Templates/SkillsTemplate.js';
import { openConfirm, closeConfirm } from './Components/SkillsConfirm.js';
import { createCardPool } from '../../../../System/CardPool.js';
import { renderMarkdownToHtml } from '../../../../System/Utils.js';

/* ── DOM refs (module-level, reset on each mount/unmount) ── */
let skillsGrid = null;
let skillsEmpty = null;
let searchWrapper = null;
let searchInput = null;
let searchClearBtn = null;
let countEl = null;
let enabledCountEl = null;
let enableAllBtn = null;
let disableAllBtn = null;
let _navigate = null;
let modalBackdrop = null;
let modalName = null;
let modalContent = null;
let modalCloseBtn = null;

let _allSkills = [];
let _skillPool = null;

/* ── Helpers ── */
function matchesSearch(skill, query) {
  if (!query) return true;
  const lowerQuery = query.toLowerCase();
  return [skill.name, skill.publisher, skill.trigger, skill.description, skill.body, skill.filename]
    .join(' ')
    .toLowerCase()
    .includes(lowerQuery);
}

function updateCounts() {
  const total = _allSkills.length;
  const enabled = _allSkills.filter((s) => s.enabled).length;
  if (countEl) countEl.textContent = `${total} skill${total !== 1 ? 's' : ''}`;
  if (enabledCountEl) {
    enabledCountEl.textContent = enabled === 0 ? 'None active' : `${enabled} active`;
    enabledCountEl.classList.toggle('skills-enabled-count--active', enabled > 0);
  }
  if (enableAllBtn) enableAllBtn.disabled = enabled === total;
  if (disableAllBtn) disableAllBtn.disabled = enabled === 0;
}

async function handleToggle(skillId, newEnabled) {
  const skill = _allSkills.find((s) => s.id === skillId);
  if (skill) skill.enabled = newEnabled;
  updateCounts();
  const result = await window.electronAPI?.invoke?.('toggle-skill', skillId, newEnabled);
  if (!result?.ok) {
    if (skill) skill.enabled = !newEnabled;
    render(searchInput?.value?.trim() ?? '');
    console.error('[Skills] Toggle failed:', result?.error);
  }
}

function openModal(skill) {
  if (!modalName || !modalContent || !modalBackdrop) return;
  modalName.textContent = skill.name;
  modalContent.innerHTML = renderMarkdownToHtml(skill.raw);
  modalBackdrop.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeModal() {
  modalBackdrop?.classList.remove('open');
  document.body.classList.remove('modal-open');
}

function createSkillCard() {
  const card = document.createElement('div');
  card.className = 'skill-card';
  card._currentSkill = null;

  card.innerHTML = `
    <div class="skill-card-head">
      <div class="skill-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="skill-card-title-group">
        <div class="skill-name-row">
          <div class="skill-name"></div>
          <span class="skill-verified" hidden aria-label="Verified Joanium skill" title="Verified Joanium skill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12.75l2.25 2.25L15 9.75" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 3l2.6 1.2 2.84-.34 1.2 2.6 2.36 1.62-.8 2.74.8 2.74-2.36 1.62-1.2 2.6-2.84-.34L12 21l-2.6-1.2-2.84.34-1.2-2.6L3 15.92l.8-2.74L3 10.44l2.36-1.62 1.2-2.6 2.84.34L12 3z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </div>
        <div class="skill-meta-row">
          <span class="skill-badge">Skill</span>
          <span class="skill-publisher"></span>
        </div>
      </div>
      <label class="skill-toggle" title="">
        <input type="checkbox" class="skill-toggle-input" />
        <span class="skill-toggle-track"></span>
      </label>
    </div>
    <div class="skill-trigger" style="display:none">
      <span class="skill-trigger-label">When</span>
      <span class="skill-trigger-text"></span>
    </div>
    <div class="skill-description" style="display:none"></div>
    <div class="skill-card-footer">
      <button class="skill-read-btn" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Read
      </button>
    </div>`;

  const toggleInput = card.querySelector('.skill-toggle-input');
  const toggleLabel = card.querySelector('.skill-toggle');

  toggleLabel?.addEventListener('click', (e) => e.stopPropagation());
  toggleInput?.addEventListener('change', async (e) => {
    const skill = card._currentSkill;
    if (!skill) return;
    const newEnabled = e.target.checked;
    if (toggleLabel) toggleLabel.title = newEnabled ? 'Disable this skill' : 'Enable this skill';
    card.classList.toggle('skill-card--enabled', newEnabled);
    await handleToggle(skill.id, newEnabled);
  });

  card.addEventListener('click', (e) => {
    if (e.target.closest('.skill-toggle')) return;
    if (card._currentSkill) openModal(card._currentSkill);
  });

  card.querySelector('.skill-read-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (card._currentSkill) openModal(card._currentSkill);
  });

  return card;
}

function updateSkillCard(card, skill) {
  card._currentSkill = skill;
  card.className = `skill-card${skill.enabled ? ' skill-card--enabled' : ''}`;
  card.dataset.filename = skill.filename;
  card.dataset.skillId = skill.id;

  card.querySelector('.skill-name').textContent = skill.name;
  card.querySelector('.skill-publisher').textContent = skill.publisher;
  card.querySelector('.skill-verified').hidden = skill.isVerified !== true;
  card.querySelector('.skill-toggle').title = skill.enabled
    ? 'Disable this skill'
    : 'Enable this skill';
  card.querySelector('.skill-toggle-input').checked = skill.enabled;

  const triggerEl = card.querySelector('.skill-trigger');
  if (skill.trigger) {
    triggerEl.style.display = '';
    card.querySelector('.skill-trigger-text').textContent = skill.trigger;
  } else {
    triggerEl.style.display = 'none';
  }

  const descEl = card.querySelector('.skill-description');
  if (skill.description) {
    descEl.style.display = '';
    descEl.textContent = skill.description;
  } else {
    descEl.style.display = 'none';
  }
}

function render(query = '') {
  const filtered = _allSkills.filter((s) => matchesSearch(s, query));
  updateCounts();

  if (_allSkills.length === 0) {
    skillsEmpty.hidden = false;
    skillsGrid.hidden = true;
    searchWrapper.hidden = true;
    return;
  }

  skillsEmpty.hidden = true;
  searchWrapper.hidden = false;
  skillsGrid.hidden = false;

  if (filtered.length === 0) {
    _skillPool.render([]);
    let noResults = skillsGrid.querySelector('.skills-no-results');
    if (!noResults) {
      noResults = document.createElement('div');
      noResults.className = 'skills-no-results';
      skillsGrid.appendChild(noResults);
    }
    noResults.textContent = `No skills match "${query}"`;
    noResults.style.display = '';
    return;
  }

  const noResults = skillsGrid.querySelector('.skills-no-results');
  if (noResults) noResults.style.display = 'none';

  _skillPool.render(filtered);
}

async function load() {
  try {
    const result = await window.electronAPI?.invoke?.('get-skills');
    _allSkills = result?.skills ?? [];
  } catch (err) {
    console.error('[Skills] Load error:', err);
    _allSkills = [];
  }
  render(searchInput?.value?.trim() ?? '');
}

/* ══════════════════════════════════════════
   MOUNT
══════════════════════════════════════════ */
export function mount(outlet, { navigate } = {}) {
  outlet.innerHTML = getHTML();

  skillsGrid = document.getElementById('skills-grid');
  skillsEmpty = document.getElementById('skills-empty');
  searchWrapper = document.getElementById('skills-search-wrapper');
  searchInput = document.getElementById('skills-search');
  searchClearBtn = document.getElementById('skills-search-clear');
  countEl = document.getElementById('skills-count');
  enabledCountEl = document.getElementById('skills-enabled-count');
  enableAllBtn = document.getElementById('skills-enable-all');
  disableAllBtn = document.getElementById('skills-disable-all');
  modalBackdrop = document.getElementById('skill-modal-backdrop');
  modalName = document.getElementById('skill-modal-name');
  modalContent = document.getElementById('skill-modal-content');
  modalCloseBtn = document.getElementById('skill-modal-close');

  _navigate = navigate ?? null;
  _allSkills = [];
  _skillPool = createCardPool({
    container: skillsGrid,
    createCard: createSkillCard,
    updateCard: updateSkillCard,
    getKey: (skill) => skill.id,
  });
  closeConfirm();

  const onModalClose = () => closeModal();
  const onModalBackdropClick = (e) => {
    if (e.target === modalBackdrop) closeModal();
  };
  const onKeydown = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeConfirm();
    }
  };
  const onSearchInput = () => {
    const query = searchInput?.value.trim() ?? '';
    render(query);
    searchClearBtn?.classList.toggle('visible', (searchInput?.value.length ?? 0) > 0);
  };
  const onSearchClear = () => {
    if (searchInput) searchInput.value = '';
    searchClearBtn?.classList.remove('visible');
    render('');
    searchInput?.focus();
  };
  const onEnableAll = async () => {
    const confirmed = await openConfirm({
      type: 'enable',
      totalCount: _allSkills.length,
      enabledCount: _allSkills.filter((s) => s.enabled).length,
    });
    if (!confirmed || !enableAllBtn) return;
    enableAllBtn.disabled = true;
    const result = await window.electronAPI?.invoke?.('enable-all-skills');
    if (result?.ok !== false) {
      _allSkills.forEach((s) => {
        s.enabled = true;
      });
      render(searchInput?.value?.trim() ?? '');
    }
  };
  const onDisableAll = async () => {
    const confirmed = await openConfirm({
      type: 'disable',
      totalCount: _allSkills.length,
      enabledCount: _allSkills.filter((s) => s.enabled).length,
    });
    if (!confirmed || !disableAllBtn) return;
    disableAllBtn.disabled = true;
    const result = await window.electronAPI?.invoke?.('disable-all-skills');
    if (result?.ok !== false) {
      _allSkills.forEach((s) => {
        s.enabled = false;
      });
      render(searchInput?.value?.trim() ?? '');
    }
  };

  modalCloseBtn?.addEventListener('click', onModalClose);
  modalBackdrop?.addEventListener('click', onModalBackdropClick);
  searchInput?.addEventListener('input', onSearchInput);
  searchClearBtn?.addEventListener('click', onSearchClear);
  enableAllBtn?.addEventListener('click', onEnableAll);
  disableAllBtn?.addEventListener('click', onDisableAll);
  document
    .getElementById('skills-go-marketplace')
    ?.addEventListener('click', () => _navigate?.('marketplace'));
  document.addEventListener('keydown', onKeydown);

  load();

  return function cleanup() {
    closeModal();
    closeConfirm();
    modalCloseBtn?.removeEventListener('click', onModalClose);
    modalBackdrop?.removeEventListener('click', onModalBackdropClick);
    searchInput?.removeEventListener('input', onSearchInput);
    searchClearBtn?.removeEventListener('click', onSearchClear);
    enableAllBtn?.removeEventListener('click', onEnableAll);
    disableAllBtn?.removeEventListener('click', onDisableAll);
    document.removeEventListener('keydown', onKeydown);

    _skillPool?.clear();
    _skillPool = null;
    skillsGrid = skillsEmpty = searchWrapper = searchInput = null;
    searchClearBtn = countEl = enabledCountEl = enableAllBtn = null;
    disableAllBtn = modalBackdrop = modalName = modalContent = modalCloseBtn = null;
    _navigate = null;
  };
}
