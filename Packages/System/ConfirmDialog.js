const STYLE_ID = 'generic-confirm-style';
let _confirmResolve = null;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #generic-confirm-backdrop {
      position: fixed; inset: 0;
      display: flex; align-items: center; justify-content: center;
      padding: 32px;
      background: rgba(8,11,18,0.55);
      backdrop-filter: blur(12px);
      z-index: 500;
      opacity: 0; pointer-events: none;
      transition: opacity 0.22s ease;
    }
    #generic-confirm-backdrop.open { opacity: 1; pointer-events: auto; }
    .generic-confirm-box {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 32px 28px 26px;
      width: min(400px, calc(100vw - 48px));
      box-shadow: 0 32px 96px rgba(0,0,0,0.32);
      transform: translateY(16px) scale(0.95);
      transition: transform 0.28s var(--ease-spring);
      display: flex; flex-direction: column; align-items: center;
      text-align: center; gap: 0;
    }
    #generic-confirm-backdrop.open .generic-confirm-box { transform: translateY(0) scale(1); }
    .generic-confirm-icon {
      width: 52px; height: 52px; border-radius: 15px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 16px; flex-shrink: 0;
    }
    .generic-confirm-icon--danger {
      background: var(--danger-dim, rgba(239,68,68,0.12));
      border: 1px solid color-mix(in srgb, var(--danger, #ef4444) 25%, transparent);
      color: var(--danger, #ef4444);
    }
    .generic-confirm-icon--default {
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      color: var(--text-muted);
    }
    #generic-confirm-title { font-size: 17px; font-weight: 600; color: var(--text-primary); margin: 0 0 10px; }
    #generic-confirm-body { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin: 0 0 26px; max-width: 300px; }
    .generic-confirm-actions { display: flex; gap: 10px; width: 100%; }
    .generic-confirm-btn {
      flex: 1; padding: 10px; border-radius: 12px;
      font-family: var(--font-ui); font-size: 13px; font-weight: 600;
      cursor: pointer; border: none;
      transition: opacity 0.15s, transform 0.1s, background 0.15s;
    }
    .generic-confirm-btn:hover { opacity: 0.88; }
    .generic-confirm-btn:active { transform: scale(0.97); }
    .generic-confirm-btn--cancel { background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border); }
    .generic-confirm-btn--cancel:hover { background: var(--bg-hover); opacity: 1; }
    .generic-confirm-btn--confirm { background: var(--accent); color: #fff; box-shadow: 0 4px 14px var(--accent-glow); }
    .generic-confirm-btn--danger { background: var(--danger, #ef4444); color: #fff; }
  `;
  document.head.appendChild(style);
}

function ensureDOM() {
  if (document.getElementById('generic-confirm-backdrop')) return;
  ensureStyles();
  const el = document.createElement('div');
  el.innerHTML = `
    <div id="generic-confirm-backdrop">
      <div class="generic-confirm-box">
        <div class="generic-confirm-icon generic-confirm-icon--default" id="generic-confirm-icon"></div>
        <h3 id="generic-confirm-title"></h3>
        <p id="generic-confirm-body"></p>
        <div class="generic-confirm-actions">
          <button class="generic-confirm-btn generic-confirm-btn--cancel" id="generic-confirm-cancel">Cancel</button>
          <button class="generic-confirm-btn generic-confirm-btn--confirm" id="generic-confirm-ok"></button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(el.firstElementChild);

  document.getElementById('generic-confirm-cancel')?.addEventListener('click', closeConfirm);
  document.getElementById('generic-confirm-backdrop')?.addEventListener('click', event => {
    if (event.target.id === 'generic-confirm-backdrop') closeConfirm();
  });
}

export function closeConfirm() {
  document.getElementById('generic-confirm-backdrop')?.classList.remove('open');
  _confirmResolve?.(false);
  _confirmResolve = null;
}

/**
 * Open a confirm dialog and return a Promise<boolean>.
 *
 * @param {object} opts
 * @param {string} opts.title - Dialog title
 * @param {string} opts.body - Dialog body text
 * @param {string} [opts.confirmText='Confirm'] - Confirm button text
 * @param {string} [opts.cancelText='Cancel'] - Cancel button text
 * @param {'default'|'danger'} [opts.variant='default'] - Visual variant
 * @param {string} [opts.iconSvg] - Optional custom icon SVG
 * @returns {Promise<boolean>}
 */
export function openConfirm({ title, body, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'default', iconSvg }) {
  ensureDOM();

  const backdrop = document.getElementById('generic-confirm-backdrop');
  const iconEl = document.getElementById('generic-confirm-icon');
  const titleEl = document.getElementById('generic-confirm-title');
  const bodyEl = document.getElementById('generic-confirm-body');
  const okBtn = document.getElementById('generic-confirm-ok');
  const cancelBtn = document.getElementById('generic-confirm-cancel');

  if (!backdrop || !iconEl || !titleEl || !bodyEl || !okBtn) return Promise.resolve(false);

  titleEl.textContent = title;
  bodyEl.textContent = body;
  okBtn.textContent = confirmText;
  if (cancelBtn) cancelBtn.textContent = cancelText;

  iconEl.className = `generic-confirm-icon generic-confirm-icon--${variant}`;
  if (iconSvg) {
    iconEl.innerHTML = iconSvg;
  } else if (variant === 'danger') {
    iconEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="26" height="26"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  } else {
    iconEl.innerHTML = '';
  }

  okBtn.className = `generic-confirm-btn generic-confirm-btn--${variant === 'danger' ? 'danger' : 'confirm'}`;

  backdrop.classList.add('open');

  return new Promise(resolve => {
    _confirmResolve = resolve;
    const freshOk = okBtn.cloneNode(true);
    okBtn.replaceWith(freshOk);
    freshOk.addEventListener('click', () => {
      _confirmResolve = null;
      closeConfirm();
      resolve(true);
    });
  });
}
