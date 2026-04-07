import { escapeHtml } from '../../../../../System/Utils.js';

export { escapeHtml };

/**
 * Derive 1–2 character initials from a persona name.
 * @param {string} name
 * @returns {string}
 */
export function getAvatarInitials(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (
    String(name ?? '')
      .trim()
      .slice(0, 2)
      .toUpperCase() || 'AI'
  );
}

/**
 * Create a reusable persona card pool.
 *
 * @param {{
 *   container: HTMLElement,
 *   onActivatePersona: (persona: object) => Promise<void>,
 *   onDeactivatePersona: () => Promise<void>,
 *   onChatPersona: (persona: object) => Promise<void>,
 *   onReadPersona: (persona: object) => void,
 * }} opts
 * @returns {{ render: Function, clear: Function }}
 */
export function createPersonaCardPool({
  container,
  onActivatePersona,
  onDeactivatePersona,
  onChatPersona,
  onReadPersona,
}) {
  /** @type {Map<string, HTMLElement>} */
  const pool = new Map();
  /** @type {Set<HTMLElement>} */
  const active = new Set();

  function createCustomCard() {
    const card = document.createElement('div');
    card.className = 'persona-card';
    card._currentPersona = null;
    card._isActive = false;

    card.innerHTML = `
      <div class="persona-active-badge" style="display:none"><div class="persona-active-badge-dot"></div>Active</div>
      <div class="persona-avatar"></div>
      <div class="persona-info">
        <div class="persona-name-row">
          <div class="persona-name"></div>
          <span class="persona-verified" hidden aria-label="Verified Joanium persona" title="Verified Joanium persona">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12.75l2.25 2.25L15 9.75" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 3l2.6 1.2 2.84-.34 1.2 2.6 2.36 1.62-.8 2.74.8 2.74-2.36 1.62-1.2 2.6-2.84-.34L12 21l-2.6-1.2-2.84.34-1.2-2.6L3 15.92l.8-2.74L3 10.44l2.36-1.62 1.2-2.6 2.84.34L12 3z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </div>
        <div class="persona-publisher"></div>
        <div class="persona-description" style="display:none"></div>
      </div>
      <div class="persona-personality"></div>
      <div class="persona-card-footer">
        <button class="persona-activate-btn" type="button" style="display:none">Activate</button>
        <button class="persona-deactivate-btn" type="button" style="display:none">Deactivate</button>
        <button class="persona-read-btn" type="button" title="Read persona">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="persona-chat-btn" type="button" title="Chat with persona">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>`;

    card.querySelector('.persona-activate-btn')?.addEventListener('click', async (event) => {
      event.stopPropagation();
      if (card._currentPersona) await onActivatePersona(card._currentPersona);
    });

    card.querySelector('.persona-deactivate-btn')?.addEventListener('click', async (event) => {
      event.stopPropagation();
      await onDeactivatePersona();
    });

    card.querySelector('.persona-read-btn')?.addEventListener('click', (event) => {
      event.stopPropagation();
      if (card._currentPersona) onReadPersona?.(card._currentPersona);
    });

    card.querySelector('.persona-chat-btn')?.addEventListener('click', async (event) => {
      event.stopPropagation();
      if (card._currentPersona) await onChatPersona(card._currentPersona);
    });

    return card;
  }

  function updateCustomCard(card, persona, isActive) {
    card._currentPersona = persona;
    card._isActive = isActive;
    card.className = `persona-card${isActive ? ' is-active' : ''}`;
    card.dataset.personaId = persona.id;

    const badge = card.querySelector('.persona-active-badge');
    badge.style.display = isActive ? '' : 'none';

    card.querySelector('.persona-avatar').textContent = getAvatarInitials(persona.name);
    card.querySelector('.persona-name').textContent = persona.name;
    card.querySelector('.persona-publisher').textContent = persona.publisher;
    card.querySelector('.persona-verified').hidden = persona.isVerified !== true;

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
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 5)
      .map((tag) => `<span class="persona-tag">${escapeHtml(tag)}</span>`)
      .join('');
    tagsEl.innerHTML = tags;
    tagsEl.style.display = tags ? '' : 'none';

    const activateBtn = card.querySelector('.persona-activate-btn');
    const deactivateBtn = card.querySelector('.persona-deactivate-btn');
    activateBtn.style.display = isActive ? 'none' : '';
    deactivateBtn.style.display = isActive ? '' : 'none';
  }

  function render(items, activePersonaId) {
    active.clear();

    for (const item of items) {
      const key = item.id;
      const isActive = activePersonaId === item.id;

      let card = pool.get(key);

      if (!card) {
        card = createCustomCard();
        pool.set(key, card);
        container.appendChild(card);
      }

      updateCustomCard(card, item, isActive);

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
