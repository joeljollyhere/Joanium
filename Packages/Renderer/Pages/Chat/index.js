import { state } from '../../Shared/Core/State.js';
import { initDOM } from '../../Shared/Core/DOM.js';
import {
  textarea, sendBtn, chips,
  modelDropdown, modelSelectorBtn,
  projectOpenFolderBtn, projectExitBtn,
} from '../../Shared/Core/DOM.js';

import {
  init as initModelSelector,
  loadProviders,
  updateModelLabel,
  buildModelDropdown,
  notifyModelSelectionChanged,
} from '../../Features/ModelSelector/index.js';
import {
  init as initComposer,
  syncCapabilities,
  addAttachments,
  syncWorkspacePickerVisibility,
} from '../../Features/Composer/index.js';
import {
  sendMessage, startNewChat, loadChat,
  appendMessage, showChatView,
  setSendBtnUpdater, stopGeneration, initChatUI,
} from '../../Features/Chat/index.js';
import { initTerminalObserver } from '../../Features/Chat/UI/TerminalComponent.js';

import { getChatHTML, ensureDropOverlay, getDropOverlay } from './Templates/ChatTemplate.js';
import { createEnhanceFeature } from './Features/ChatEnhance.js';
import { createBrowserPreviewFeature } from './Features/BrowserPreview.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
function getWelcomeTitleText() {
  const rawName = String(state.userName ?? '').trim();
  const firstName = rawName.split(/\s+/)[0];
  const name = firstName || '';

  const hour = new Date().getHours();

  const timeGreetings = hour >= 5 && hour < 12
    ? [
        `Good Morning${name ? `, ${name}` : ''} ☀️`,
        `Rise and shine${name ? `, ${name}` : ''}!`,
        `Morning${name ? `, ${name}` : ''}! Ready to get things done?`,
      ]
    : hour >= 12 && hour < 17
    ? [
        `Good Afternoon${name ? `, ${name}` : ''} 🌤️`,
        `Hey${name ? ` ${name}` : ''}! Hope your day's going well.`,
        `Afternoon${name ? `, ${name}` : ''}! What are we building today?`,
      ]
    : hour >= 17 && hour < 21
    ? [
        `Good Evening${name ? `, ${name}` : ''} 🌇`,
        `Evening${name ? `, ${name}` : ''}! Wrapping up or just getting started?`,
        `Hey${name ? ` ${name}` : ''}! How was your day?`,
      ]
    : [
        `Burning the midnight oil${name ? `, ${name}` : ''}? 🌙`,
        `Up late${name ? `, ${name}` : ''}? Let's make it count.`,
        `Good night${name ? `, ${name}` : ''} — or morning? 🌌`,
      ];

  const randomGreetings = name
    ? [
        `How's it going, ${name}?`,
        `What's on your mind, ${name}?`,
        `Hey ${name}! What can I help with?`,
        `Welcome back, ${name} 👋`,
        `Great to see you, ${name}!`,
        `What are we working on today, ${name}?`,
        `How's your day treating you, ${name}?`,
      ]
    : [
        `What can I help you with?`,
        `What's on your mind?`,
        `Hey! How can I help?`,
        `Welcome back 👋`,
        `What are we working on today?`,
      ];

  const allGreetings = [...timeGreetings, ...randomGreetings];
  return allGreetings[Math.floor(Math.random() * allGreetings.length)];
}

function syncWelcomeTitle() {
  const welcomeTitle = document.querySelector('.welcome-title');
  if (welcomeTitle) welcomeTitle.textContent = getWelcomeTitleText();
}

const SUBTITLES = [
  'Ask me anything.',
  'Let\'s build something great.',
  'Your ideas, supercharged.',
  'Think it. Type it. Done.',
  'What\'s the plan today?',
  'Ready when you are.',
  'Drop a thought, I\'ll run with it.',
  'Let\'s get into it.',
  'Bring your hardest problems.',
  'Zero judgment. All help.',
  'Code, write, explore — let\'s go.',
  'Fast answers. Real results.',
];

function syncWelcomeSubtitle() {
  const el = document.getElementById('welcome-subtitle');
  if (el) el.textContent = SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)];
}

function restoreChatFromState() {
  if (!state.messages.length) return;
  showChatView();
  state.messages.forEach(message => {
    appendMessage(message.role, message.content, false, false, message.attachments ?? []);
  });
}

function syncProjectUI() {
  const project = state.activeProject;
  const bar = document.getElementById('project-context-bar');
  if (!bar) return;
  bar.hidden = !project;
  const ti = document.getElementById('project-context-title');
  const pa = document.getElementById('project-context-path');
  const ta = document.getElementById('chat-input');
  if (project) {
    if (ti) ti.textContent = project.name;
    if (pa) pa.textContent = project.rootPath;
    if (ta) ta.placeholder = `Message ${project.name}`;
  } else {
    if (ta) ta.placeholder = 'How can I help you today?';
  }
  syncWorkspacePickerVisibility?.();
}

// ── mount ────────────────────────────────────────────────────────────────────
export function mount(outlet, { settings, navigate }) {
  outlet.innerHTML = getChatHTML();

  // CRITICAL: initDOM() must be called after HTML is injected.
  initDOM();
  syncWelcomeTitle();
  syncWelcomeSubtitle();

  const APP_NAME = 'Evelina';
  document.title = APP_NAME;

  syncProjectUI();
  initModelSelector();
  initTerminalObserver();
  initChatUI();

  // ── Send button ──────────────────────────────────────────────────────────
  const SEND_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="15" height="15"><path d="M12 19V5M5 12l7-7 7 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>`;
  const STOP_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><rect x="5" y="5" width="14" height="14" rx="3"/></svg>`;

  function updateSendBtn() {
    if (!sendBtn) return;
    if (state.isTyping) {
      sendBtn.innerHTML = STOP_ICON;
      sendBtn.classList.add('ready', 'is-stop');
      sendBtn.disabled = false;
      sendBtn.title = 'Stop generating';
      return;
    }
    sendBtn.innerHTML = SEND_ICON;
    sendBtn.classList.remove('is-stop');
    sendBtn.title = 'Send';
    const hasText  = textarea?.value.trim().length > 0;
    const hasAtt   = state.composerAttachments.length > 0;
    const hasUnsup = state.composerAttachments.some(a => a.type === 'image') &&
                     !state.selectedProvider?.models?.[state.selectedModel]?.inputs?.image;
    const ready = (hasText || hasAtt) && !state.isTyping && !hasUnsup;
    sendBtn.classList.toggle('ready', ready);
    sendBtn.disabled = !ready;
  }
  setSendBtnUpdater(updateSendBtn);

  // ── Prompt chips ──────────────────────────────────────────────────────────
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      if (!textarea) return;
      textarea.value = chip.getAttribute('data-prompt');
      textarea.dispatchEvent(new Event('input'));
      textarea.focus();
    });
  });

  // ── Composer ──────────────────────────────────────────────────────────────
  initComposer(() => {
    if (state.isTyping) { stopGeneration(); return; }
    const text        = textarea?.value.trim() ?? '';
    const attachments = state.composerAttachments.map(a => ({ ...a }));
    sendMessage({ text, attachments, sendBtnEl: sendBtn });
  });

  // ── Project folder / exit ────────────────────────────────────────────────
  projectOpenFolderBtn?.addEventListener('click', async () => {
    if (!state.activeProject?.rootPath) return;
    await window.electronAPI?.openFolderOS?.({ dirPath: state.activeProject.rootPath });
  });
  projectExitBtn?.addEventListener('click', () => {
    state.activeProject = null;
    state.workspacePath = null;
    syncProjectUI();
    startNewChat();
    window.dispatchEvent(new CustomEvent('ow:project-changed', { detail: { project: null } }));
  });

  // ── Model dropdown outside-click ─────────────────────────────────────────
  const onDocClick = e => {
    if (modelDropdown && !modelDropdown.contains(e.target) && !modelSelectorBtn?.contains(e.target)) {
      modelDropdown.classList.remove('open');
    }
  };
  document.addEventListener('click', onDocClick);

  // ── System prompt / profile refresh ──────────────────────────────────────
  async function refreshSystemPrompt() {
    try { state.systemPrompt = await window.electronAPI?.getSystemPrompt?.() ?? ''; }
    catch { state.systemPrompt = ''; }
  }
  const onSettingsSaved      = () => refreshSystemPrompt();
  const onUserProfileUpdated = () => syncWelcomeTitle();
  window.addEventListener('ow:settings-saved', onSettingsSaved);
  window.addEventListener('ow:user-profile-updated', onUserProfileUpdated);

  // ── Enhance button ────────────────────────────────────────────────────────
  const enhanceBtn = document.getElementById('enhance-btn');
  const enhanceFeature = createEnhanceFeature({ textarea, enhanceBtn, state });
  const browserPreviewFeature = createBrowserPreviewFeature();

  // ── Drag-and-drop ─────────────────────────────────────────────────────────
  ensureDropOverlay();
  let dragCounter = 0;
  const onDragOver  = e => { e.preventDefault(); e.stopPropagation(); };
  const onDragEnter = e => {
    e.preventDefault(); e.stopPropagation();
    const overlay = getDropOverlay();
    if (++dragCounter === 1 && overlay) { overlay.style.opacity = '1'; overlay.style.transform = 'scale(1)'; }
  };
  const onDragLeave = e => {
    e.preventDefault(); e.stopPropagation();
    const overlay = getDropOverlay();
    if (--dragCounter === 0 && overlay) { overlay.style.opacity = '0'; overlay.style.transform = 'scale(1.02)'; }
  };
  const onDrop = async e => {
    e.preventDefault(); e.stopPropagation();
    dragCounter = 0;
    const overlay = getDropOverlay();
    if (overlay) { overlay.style.opacity = '0'; overlay.style.transform = 'scale(1.02)'; }
    if (e.dataTransfer.files?.length) await addAttachments(Array.from(e.dataTransfer.files));
  };
  document.addEventListener('dragover', onDragOver);
  document.addEventListener('dragenter', onDragEnter);
  document.addEventListener('dragleave', onDragLeave);
  document.addEventListener('drop', onDrop);

  // ── Load providers, then show initial content ─────────────────────────────
  loadProviders().then(async () => {
    syncCapabilities();
    await refreshSystemPrompt();

    const pendingId      = window._pendingChatId;
    const shouldStartFresh = window._startFreshChat === true;
    window._pendingChatId   = null;
    window._startFreshChat  = false;

    if (pendingId) {
      await loadChat(pendingId, { updateModelLabel, buildModelDropdown, notifyModelSelectionChanged });
      return;
    }
    if (shouldStartFresh) { startNewChat(); return; }
    if (state.messages.length > 0) restoreChatFromState();
  });

  // ── Cleanup ───────────────────────────────────────────────────────────────
  return function unmount() {
    document.removeEventListener('click', onDocClick);
    document.removeEventListener('dragover', onDragOver);
    document.removeEventListener('dragenter', onDragEnter);
    document.removeEventListener('dragleave', onDragLeave);
    document.removeEventListener('drop', onDrop);
    window.removeEventListener('ow:settings-saved', onSettingsSaved);
    window.removeEventListener('ow:user-profile-updated', onUserProfileUpdated);
    enhanceFeature.cleanup();
    browserPreviewFeature.cleanup();
    stopGeneration();
    const overlay = getDropOverlay();
    if (overlay) overlay.style.opacity = '0';
  };
}
