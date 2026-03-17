import { applyTheme } from './Themes.js';
import {
    state,
    avatarBtn,
    avatarPanel,
    avatarPanelBadge,
    avatarPanelName,
    avatarSettingsBtn,
    themePanel,
    settingsModalBackdrop,
    settingsModalClose,
} from './Root.js';

/* USER INIT - load name from User.json */
export async function loadUser() {
    try {
        const user = await window.electronAPI?.getUser();
        if (!user?.name) {
            renderSettingsProviders();
            return;
        }

        state.userName = user.name;
        const parts = user.name.trim().split(/\s+/);
        state.userInitials = parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : parts[0].slice(0, 2).toUpperCase();

        if (avatarBtn) {
            avatarBtn.textContent = state.userInitials;
            avatarBtn.title = user.name;
            avatarBtn.setAttribute('data-tip', user.name);
        }

        if (avatarPanelBadge) avatarPanelBadge.textContent = state.userInitials;
        if (avatarPanelName) avatarPanelName.textContent = user.name;

        const welcomeTitle = document.querySelector('.welcome-title');
        if (welcomeTitle) welcomeTitle.textContent = `Welcome, ${parts[0]}`;

        renderSettingsProviders();
    } catch (e) {
        console.warn('[openworld] Could not load user:', e);
    }
}

function renderSettingsProviders() {
    const container = document.getElementById('settings-providers-list');
    if (!container) return;

    if (state.providers.length === 0) {
        container.innerHTML = `<div class="settings-empty-card">No API keys configured</div>`;
        return;
    }

    const providerColors = {
        anthropic: '#cc785c',
        openai: '#10a37f',
        google: '#4285f4',
        openrouter: '#9b59b6',
    };

    container.innerHTML = state.providers.map((provider) => `
    <div class="ap-provider-item">
      <span class="ap-provider-dot" style="background:${providerColors[provider.provider] ?? 'var(--accent)'}"></span>
      <span class="ap-provider-name">${provider.label}</span>
      <span class="ap-provider-status">Connected</span>
    </div>`).join('');
}

/* AVATAR PANEL */
export function toggleAvatarPanel(e) {
    e?.stopPropagation();
    avatarPanel?.classList.toggle('open');
    themePanel?.classList.remove('open');
}

export function closeAvatarPanel() {
    avatarPanel?.classList.remove('open');
}

export function openSettingsModal() {
    closeAvatarPanel();
    themePanel?.classList.remove('open');
    renderSettingsProviders();
    settingsModalBackdrop?.classList.add('open');
    document.body.classList.add('modal-open');
}

export function closeSettingsModal() {
    settingsModalBackdrop?.classList.remove('open');
    document.body.classList.remove('modal-open');
}

avatarBtn?.addEventListener('click', toggleAvatarPanel);

avatarSettingsBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    openSettingsModal();
});

settingsModalClose?.addEventListener('click', closeSettingsModal);

settingsModalBackdrop?.addEventListener('click', (e) => {
    if (e.target === settingsModalBackdrop) closeSettingsModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSettingsModal();
});

document.addEventListener('click', (e) => {
    if (!avatarPanel?.contains(e.target) && e.target !== avatarBtn) closeAvatarPanel();
});

// Handle theme buttons inside the settings modal
settingsModalBackdrop?.addEventListener('click', (e) => {
    const opt = e.target.closest('.ap-theme-option');
    if (opt) applyTheme(opt.dataset.theme);
});
