// Composer
export const textarea            = document.getElementById('chat-input');
export const sendBtn             = document.getElementById('send-btn');
export const attachmentBtn       = document.getElementById('attachment-btn');
export const folderBtn           = document.getElementById('folder-btn');
export const composerAttachments = document.getElementById('composer-attachments');
export const composerHint        = document.getElementById('composer-hint');

// Chat view
export const welcome      = document.getElementById('welcome');
export const chatView     = document.getElementById('chat-view');
export const chatMessages = document.getElementById('chat-messages');
export const chips        = document.querySelectorAll('.chip');
export const projectContextBar    = document.getElementById('project-context-bar');
export const projectContextTitle  = document.getElementById('project-context-title');
export const projectContextPath   = document.getElementById('project-context-path');
export const projectContextInfo   = document.getElementById('project-context-info');
export const projectOpenFolderBtn = document.getElementById('project-open-folder-btn');
export const projectExitBtn       = document.getElementById('project-exit-btn');

// Sidebar
export const sidebarBtns  = document.querySelectorAll('.sidebar-btn[data-view]');
export const themeBtn     = document.getElementById('theme-toggle-btn');
export const themePanel   = document.getElementById('theme-panel');
export const themeOptions = document.querySelectorAll('.theme-option');

// Model selector
export const modelSelectorBtn = document.getElementById('model-selector-btn');
export const modelDropdown    = document.getElementById('model-dropdown');
export const modelLabel       = document.getElementById('model-label');

// Chat library
export const libraryBackdrop = document.getElementById('library-modal-backdrop');
export const libraryPanel    = document.getElementById('library-panel');
export const libraryClose    = document.getElementById('library-close');
export const librarySearch   = document.getElementById('library-search');
export const chatList        = document.getElementById('chat-list');

// Avatar panel
export const avatarBtn         = document.getElementById('sidebar-avatar-btn');
export const avatarPanel       = document.getElementById('avatar-panel');
export const avatarPanelName   = document.getElementById('avatar-panel-name');
export const avatarPanelBadge  = document.getElementById('avatar-panel-badge');
export const avatarSettingsBtn = document.getElementById('avatar-settings-btn');

// Settings modal
export const settingsModalBackdrop = document.getElementById('settings-modal-backdrop');
export const settingsModal         = document.getElementById('settings-modal');
export const settingsModalClose    = document.getElementById('settings-modal-close');

// Keep body.modal-open in sync with whether any modal is open.
// Call after opening or closing any overlay.
export const syncModalOpenState = () => {
  const hasOpen = Boolean(
    document.querySelector('#settings-modal-backdrop.open, #library-modal-backdrop.open, #projects-modal-backdrop.open, #global-confirm-backdrop.open, #edit-project-backdrop.open'),
  );
  document.body.classList.toggle('modal-open', hasOpen);
};
