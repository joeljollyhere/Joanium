import { escapeHtml } from '../../../../../System/Utils.js';
import { createCardPool } from '../../../../../System/CardPool.js';

export { escapeHtml };

/**
 * Derive 1–2 character initials from a persona name.
 * @param {string} name
 * @returns {string}
 */
export function getAvatarInitials(name) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return String(name ?? '').trim().slice(0, 2).toUpperCase() || 'AI';
}

const DEFAULT_KEY = '__default__';

/**
 * Create a card pool that handles both default and custom persona cards.
 *
 * @param {{
 *   container: HTMLElement,
 *   onActivateDefault: () => Promise<void>,
 *   onChatDefault: () => Promise<void>,
 *   onActivatePersona: (persona: object) => Promise<void>,
 *   onDeactivatePersona: () => Promise<void>,
 *   onChatPersona: (persona: object) => Promise<void>,
 * }} opts
 * @returns {{ render: Function, clear: Function }}
 */
export function createPersonaCardPool({
  container,
  onActivateDefault,
  onChatDefault,
  onActivatePersona,
  onDeactivatePersona,
  onChatPersona,
}) {
  /** @type {Map<string, HTMLElement>} */
  const pool = new Map();
  /** @type {Set<HTMLElement>} */
  const active = new Set();

  function createDefaultCard() {
    const card = document.createElement('div');
    card.className = 'persona-card persona-card--default';
    card._isDefault = true;
    card._isActive = false;

    card.innerHTML = `
      <div class="persona-active-badge" style="display:none"><div class="persona-active-badge-dot"></div>Active</div>
      <div class="persona-avatar persona-avatar--default">
        <img src="../../../Assets/Logo/Logo.png" alt="Joanium" width="60" height="60">
      </div>
      <div class="persona-info">
        <div class="persona-name">Default Assistant</div>
        <div class="persona-description">The standard Joanium AI - helpful, accurate, and contextually aware of your system, repos, and email.</div>
      </div>
      <div class="persona-personality">
        <span class="persona-tag">helpful</span>
        <span class="persona-tag">accurate</span>
        <span class="persona-tag">contextual</span>
      </div>
      <div class="persona-card-footer">
        <button class="persona-activate-btn" type="button" style="display:none">Set active</button>
        <button class="persona-status-btn" disabled style="display:none">Currently active</button>
        <button class="persona-chat-btn" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Chat
        </button>
      </div>`;

    card.querySelector('.persona-activate-btn')?.addEventListener('click', async event => {
      event.stopPropagation();
      await onActivateDefault();
    });

    card.querySelector('.persona-chat-btn')?.addEventListener('click', async event => {
      event.stopPropagation();
      await onChatDefault();
    });

    return card;
  }

  function updateDefaultCard(card, isActive) {
    card._isActive = isActive;
    card.className = `persona-card persona-card--default${isActive ? ' is-active' : ''}`;

    const badge = card.querySelector('.persona-active-badge');
    badge.style.display = isActive ? '' : 'none';

    const activateBtn = card.querySelector('.persona-activate-btn');
    const statusBtn = card.querySelector('.persona-status-btn');
    activateBtn.style.display = isActive ? 'none' : '';
    statusBtn.style.display = isActive ? '' : 'none';
  }

  function createCustomCard() {
    const card = document.createElement('div');
    card.className = 'persona-card';
    card._currentPersona = null;
    card._isActive = false;

    card.innerHTML = `
      <div class="persona-active-badge" style="display:none"><div class="persona-active-badge-dot"></div>Active</div>
      <div class="persona-avatar"></div>
      <div class="persona-info">
        <div class="persona-name"></div>
        <div class="persona-description" style="display:none"></div>
      </div>
      <div class="persona-personality"></div>
      <div class="persona-card-footer">
        <button class="persona-activate-btn" type="button" style="display:none">Activate</button>
        <button class="persona-deactivate-btn" type="button" style="display:none">Deactivate</button>
        <button class="persona-chat-btn" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Chat
        </button>
      </div>`;

    card.querySelector('.persona-activate-btn')?.addEventListener('click', async event => {
      event.stopPropagation();
      if (card._currentPersona) await onActivatePersona(card._currentPersona);
    });

    card.querySelector('.persona-deactivate-btn')?.addEventListener('click', async event => {
      event.stopPropagation();
      await onDeactivatePersona();
    });

    card.querySelector('.persona-chat-btn')?.addEventListener('click', async event => {
      event.stopPropagation();
      if (card._currentPersona) await onChatPersona(card._currentPersona);
    });

    return card;
  }

  function updateCustomCard(card, persona, isActive) {
    card._currentPersona = persona;
    card._isActive = isActive;
    card.className = `persona-card${isActive ? ' is-active' : ''}`;

    const badge = card.querySelector('.persona-active-badge');
    badge.style.display = isActive ? '' : 'none';

    card.querySelector('.persona-avatar').textContent = getAvatarInitials(persona.name);
    card.querySelector('.persona-name').textContent = persona.name;

    const descEl = card.querySelector('.persona-description');
    if (persona.description) {
      descEl.style.display = '';
      descEl.textContent = persona.description;
    } else {
      descEl.style.display = 'none';
    }

    const tagsEl = card.querySelector('.persona-personality');
    const tags = (persona.personality || '')
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)
      .slice(0, 5)
      .map(tag => `<span class="persona-tag">${escapeHtml(tag)}</span>`)
      .join('');
    tagsEl.innerHTML = tags;
    tagsEl.style.display = tags ? '' : 'none';

    const activateBtn = card.querySelector('.persona-activate-btn');
    const deactivateBtn = card.querySelector('.persona-deactivate-btn');
    activateBtn.style.display = isActive ? 'none' : '';
    deactivateBtn.style.display = isActive ? '' : 'none';
  }

  /**
   * Render persona items. Each item is either `{ _isDefault: true }` or a persona object.
   * @param {Array} items
   * @param {string|null} activeFilename - filename of the active persona, or null for default
   */
  function render(items, activeFilename) {
    active.clear();

    for (const item of items) {
      const isDefault = item._isDefault;
      const key = isDefault ? DEFAULT_KEY : item.filename;
      const isActive = isDefault ? !activeFilename : activeFilename === item.filename;

      let card = pool.get(key);

      if (!card) {
        card = isDefault ? createDefaultCard() : createCustomCard();
        pool.set(key, card);
        container.appendChild(card);
      }

      if (isDefault) {
        updateDefaultCard(card, isActive);
      } else {
        updateCustomCard(card, item, isActive);
      }

      card.style.display = '';
      active.add(card);
    }

    for (const [, card] of pool) {
      if (!active.has(card)) {
        card.style.display = 'none';
      }
    }
  }

  function clear() {
    for (const [, card] of pool) {
      card.remove();
    }
    pool.clear();
    active.clear();
  }

  return { render, clear };
}
