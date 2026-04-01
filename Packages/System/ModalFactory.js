export const CLOSE_BUTTON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/></svg>`;

/**
 * Auto-discover any backdrop element with `.open` class
 * and toggle body.modal-open accordingly.
 */
export function syncAllModals() {
  const hasOpen = Boolean(document.querySelector('[id$="-backdrop"].open'));
  document.body.classList.toggle('modal-open', hasOpen);
}

/**
 * Create a modal shell that handles:
 *  - idempotent HTML injection into document.body
 *  - open / close with class toggling
 *  - backdrop click → close
 *  - Escape key → close
 *  - body.modal-open sync
 *
 * @param {object} opts
 * @param {string}   opts.backdropId   - The id of the backdrop element (e.g. 'about-modal-backdrop')
 * @param {string}   opts.html         - The HTML string to inject (should contain the backdrop element)
 * @param {boolean}  [opts.multiple]   - If true, append all children (for modals with sibling backdrops)
 * @param {Function} [opts.onOpen]     - Called after open
 * @param {Function} [opts.onClose]    - Called after close
 * @param {Function} [opts.onInit]     - Called once after injection, receives (backdropEl)
 * @param {string}   [opts.closeBtnSelector] - Selector for close button (default: '.settings-modal-close')
 * @returns {{ open: Function, close: Function, isOpen: Function, getBackdrop: Function }}
 */
export function createModal({
  backdropId,
  html,
  multiple = false,
  onOpen,
  onClose,
  onInit,
  closeBtnSelector = '.settings-modal-close',
}) {
  let _backdrop = null;
  let _initialized = false;

  function ensureInjected() {
    if (_initialized) return;
    _initialized = true;

    const existing = document.getElementById(backdropId);
    if (existing) {
      _backdrop = existing;
      return;
    }

    const wrap = document.createElement('div');
    wrap.innerHTML = html;

    if (multiple) {
      document.body.append(...Array.from(wrap.children));
    } else {
      document.body.appendChild(wrap.firstElementChild);
    }

    _backdrop = document.getElementById(backdropId);
    wireEvents();
    onInit?.(_backdrop);
  }

  function open() {
    ensureInjected();
    _backdrop?.classList.add('open');
    syncAllModals();
    onOpen?.();
  }

  function close() {
    _backdrop?.classList.remove('open');
    syncAllModals();
    onClose?.();
  }

  function isOpen() {
    return _backdrop?.classList.contains('open') ?? false;
  }

  function getBackdrop() {
    ensureInjected();
    return _backdrop;
  }

  function wireEvents() {
    if (!_backdrop) return;

    const closeBtn = _backdrop.querySelector(closeBtnSelector);
    closeBtn?.addEventListener('click', close);

    _backdrop.addEventListener('click', e => {
      if (e.target === _backdrop) close();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen()) close();
    });
  }

  return { open, close, isOpen, getBackdrop, ensureInjected };
}
