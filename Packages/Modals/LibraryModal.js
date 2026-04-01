import { state } from '../System/State.js';
import { escapeHtml, timeAgo } from '../System/Utils.js';
import { createModal } from '../System/ModalFactory.js';

function buildHTML() {
  return /* html */`
    <div id="library-modal-backdrop">
      <div id="library-panel" role="dialog" aria-modal="true"
           aria-labelledby="library-modal-title">

        <div class="settings-modal-header">
          <div class="settings-modal-copy">
            <h2 id="library-modal-title">Revisit your chats</h2>
          </div>
          <button class="settings-modal-close" id="library-close"
                  type="button" aria-label="Close library">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12"
                    stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/>
            </svg>
          </button>
        </div>

        <div class="settings-modal-body library-modal-body">
          <div class="library-search-shell">
            <div class="lp-search-wrap">
              <svg class="lp-search-icon" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" aria-hidden="true">
                <circle cx="11" cy="11" r="7"/>
                <path d="M16.5 16.5L21 21" stroke-linecap="round"/>
              </svg>
              <input type="text" id="library-search"
                     placeholder="Search chats…"
                     autocomplete="off" spellcheck="false"/>
            </div>
          </div>
          <div class="library-list-shell">
            <div id="chat-list" class="lp-list"></div>
          </div>
        </div>

      </div>
    </div>
  `;
}

function currentChatScope() {
  return state.activeProject ? { projectId: state.activeProject.id } : {};
}

export function initLibraryModal({ onChatSelect = () => {} } = {}) {
  const searchInput = () => document.getElementById('library-search');
  const chatListEl = () => document.getElementById('chat-list');
  const titleEl = () => document.getElementById('library-modal-title');

  function syncHeader() {
    const title = titleEl();
    if (!title) return;
    title.textContent = state.activeProject
      ? `${state.activeProject.name} chats`
      : 'Revisit your chats';
  }

  function renderChatList(chats, filter = '') {
    const list = chatListEl();
    if (!list) return;
    const query = filter.toLowerCase().trim();
    const filtered = query
      ? chats.filter(c => (c.title || '').toLowerCase().includes(query))
      : chats;

    if (!filtered.length) {
      list.innerHTML = `<div class="lp-empty">${
        query
          ? 'No matching chats'
          : state.activeProject
            ? 'No chats for this project yet.<br>Start a conversation in this workspace.'
            : 'No chats yet.<br>Start a conversation!'
      }</div>`;
      return;
    }

    list.innerHTML = '';
    filtered.forEach(chat => {
      const item = document.createElement('div');
      item.className = 'lp-item';
      item.dataset.id = escapeHtml(chat.id);

      const info = document.createElement('div');
      info.className = 'lp-item-info';
      info.innerHTML = `
        <div class="lp-item-title">${escapeHtml(chat.title || 'Untitled chat')}</div>
        <div class="chat-time">${timeAgo(new Date(chat.updatedAt))}</div>`;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'lp-delete-btn';
      deleteBtn.title = 'Delete chat';
      deleteBtn.setAttribute('aria-label', 'Delete chat');
      deleteBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;

      deleteBtn.addEventListener('click', async e => {
        e.stopPropagation();
        await window.electronAPI?.deleteChat(chat.id, currentChatScope());
        await refreshChatList();
      });

      item.append(info, deleteBtn);
      list.appendChild(item);
    });
  }

  async function refreshChatList() {
    const list = chatListEl();
    try {
      syncHeader();
      const chats = (await window.electronAPI?.getChats(currentChatScope())) ?? [];
      renderChatList(chats, searchInput()?.value ?? '');
      return chats;
    } catch {
      if (list) list.innerHTML = '<div class="lp-empty">Could not load chats</div>';
      return [];
    }
  }

  const modal = createModal({
    backdropId: 'library-modal-backdrop',
    html: buildHTML(),
    closeBtnSelector: '#library-close',
    onInit(backdrop) {
      searchInput()?.addEventListener('input', async () => {
        const chats = (await window.electronAPI?.getChats(currentChatScope())) ?? [];
        renderChatList(chats, searchInput()?.value ?? '');
      });

      const chatList = chatListEl();
      chatList?.addEventListener('click', e => {
        const item = e.target.closest('.lp-item');
        if (item && !e.target.closest('.lp-delete-btn')) {
          onChatSelect(item.dataset.id);
          modal.close();
        }
      });

      window.addEventListener('ow:project-changed', () => {
        syncHeader();
        if (modal.isOpen()) refreshChatList();
      });
    },
  });

  async function open() {
    syncHeader();
    document.querySelector('[data-view="library"]')?.classList.add('active');
    modal.open();
    await refreshChatList();
    requestAnimationFrame(() => searchInput()?.focus());
  }

  function close() {
    document.querySelector('[data-view="library"]')?.classList.remove('active');
    modal.close();
  }

  return { open, close, isOpen: modal.isOpen };
}
