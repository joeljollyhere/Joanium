/**
 * CardPool — reuses DOM card elements instead of recreating them on every render.
 *
 * Usage:
 *   const pool = createCardPool({
 *     container: document.getElementById('my-grid'),
 *     createCard()          → HTMLElement        // build skeleton once
 *     updateCard(card, item)                      // update content in-place
 *     getKey(item)           → string             // unique key per item
 *   });
 *
 *   pool.render(items);      // reuse / create / hide as needed
 *   pool.destroy();          // remove all cards & clear pool
 */
export function createCardPool({ container, createCard, updateCard, getKey }) {
  /** @type {Map<string, HTMLElement>} */
  const pool = new Map();
  /** @type {Set<HTMLElement>} */
  const active = new Set();

  function render(items) {
    active.clear();

    for (let i = 0; i < items.length; i++) {
      const key = getKey(items[i]);
      let card = pool.get(key);

      if (!card) {
        card = createCard();
        pool.set(key, card);
        container.appendChild(card);
      }

      updateCard(card, items[i]);
      card.style.display = '';
      active.add(card);
    }

    // Hide cards that aren't in this render batch
    for (const [key, card] of pool) {
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

  return { render, clear, size: () => pool.size };
}
