import { createModal } from '../System/ModalFactory.js';

const SPONSOR_URL = 'https://github.com/sponsors/withinjoel';
const AUTHOR_URL = 'https://joeljolly.vercel.app';

function buildHTML() {
  return /* html */`
    <div id="about-modal-backdrop">
      <div id="about-modal" role="dialog" aria-modal="true" aria-labelledby="about-modal-title">

        <button class="settings-modal-close about-modal-close"
                id="about-modal-close" type="button" aria-label="Close about">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12"
                  stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/>
          </svg>
        </button>

        <div class="about-modal-body">

          <div class="about-logo-wrap">
            <img src="../../Icons/Logo.ico" alt="Joanium" width="64" height="64" />
          </div>

          <div class="about-app-name" id="about-modal-title">Joanium</div>
          <div class="about-version" id="about-version">v1.0.0</div>

          <p class="about-description">
            An Electron app that connects and controls your world.
          </p>

          <div class="about-divider"></div>

          <a id="about-sponsor-btn" class="about-sponsor-btn" href="#" role="button">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 21.593c-.534.542-1.076 1.05-1.524 1.483a.75.75 0 01-1.032-.011
                       L2.29 16.01C.454 14.174 0 12.023 0 10.14 0 6.262 3.004 3 6.75 3
                       c1.922 0 3.724.841 4.95 2.174A6.75 6.75 0 0117.25 3C21 3 24 6.263
                       24 10.14c0 1.883-.454 4.034-2.292 5.87l-7.154 7.065a.75.75 0
                       01-1.032.011c-.448-.433-.99-.94-1.522-1.482z"/>
            </svg>
            Sponsor on GitHub
          </a>

          <p class="footer-credit">
            Made with ❤️ by
            <a id="about-author-link" href="#" class="credit-name">Joel Jolly</a>
          </p>

        </div>
      </div>
    </div>
  `;
}

function openExternal(url) {
  const a = Object.assign(document.createElement('a'), {
    href: url, target: '_blank', rel: 'noopener noreferrer',
  });
  a.click();
}

export function initAboutModal() {
  const modal = createModal({
    backdropId: 'about-modal-backdrop',
    html: buildHTML(),
    closeBtnSelector: '#about-modal-close',
    onInit(backdrop) {
      const versionEl = backdrop.querySelector('#about-version');
      const sponsorBtn = backdrop.querySelector('#about-sponsor-btn');
      const authorLink = backdrop.querySelector('#about-author-link');

      (async () => {
        try {
          const v = await window.electronAPI?.getAppVersion?.();
          if (v && versionEl) versionEl.textContent = `v${v}`;
        } catch { /* keep default */ }
      })();

      if (sponsorBtn) sponsorBtn.href = SPONSOR_URL;
      if (authorLink) authorLink.href = AUTHOR_URL;

      sponsorBtn?.addEventListener('click', e => { e.preventDefault(); openExternal(SPONSOR_URL); });
      authorLink?.addEventListener('click', e => { e.preventDefault(); openExternal(AUTHOR_URL); });
    },
  });

  return { open: modal.open, close: modal.close };
}
