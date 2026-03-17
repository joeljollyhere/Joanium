// ─────────────────────────────────────────────
//  openworld — app.js
//  UI interactions, chat logic, auto-resize textarea
// ─────────────────────────────────────────────

import { APP_NAME } from './Config.js';

/* ── State ── */
const state = {
  messages: [],
  isTyping: false,
};

/* ── DOM refs ── */
const textarea     = document.getElementById('chat-input');
const sendBtn      = document.getElementById('send-btn');
const welcome      = document.getElementById('welcome');
const chatView     = document.getElementById('chat-view');
const chatMessages = document.getElementById('chat-messages');
const chips        = document.querySelectorAll('.chip');
const sidebarBtns  = document.querySelectorAll('.sidebar-btn[data-view]');

/* ── Auto-resize textarea ── */
function autoResize() {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  updateSendBtn();
}

function updateSendBtn() {
  const hasText = textarea.value.trim().length > 0;
  sendBtn.classList.toggle('ready', hasText);
}

textarea.addEventListener('input', autoResize);

textarea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener('click', sendMessage);

/* ── Chips ── */
chips.forEach(chip => {
  chip.addEventListener('click', () => {
    const prompt = chip.getAttribute('data-prompt');
    textarea.value = prompt;
    autoResize();
    textarea.focus();
  });
});

/* ── Send message ── */
function sendMessage() {
  const text = textarea.value.trim();
  if (!text || state.isTyping) return;

  showChatView();
  appendMessage('user', text);

  textarea.value = '';
  textarea.style.height = 'auto';
  updateSendBtn();

  simulateResponse(text);
}

function showChatView() {
  welcome.style.display = 'none';
  chatView.classList.add('active');
}

/* ── Append message to DOM ── */
function appendMessage(role, content) {
  state.messages.push({ role, content });

  const row = document.createElement('div');
  row.className = `message-row ${role}`;

  if (role === 'user') {
    row.innerHTML = `<div class="bubble">${escapeHtml(content)}</div>`;
  } else {
    row.innerHTML = `
      <div class="assistant-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L8 6H4v4L2 12l2 2v4h4l4 4 4-4h4v-4l2-2-2-2V6h-4L12 2z" stroke-width="1.5"/>
        </svg>
      </div>
      <div class="content"><p>${content}</p></div>`;
  }

  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return row;
}

/* ── Simulated AI response (replace with real API later) ── */
function simulateResponse(userText) {
  state.isTyping = true;

  // Typing indicator row
  const row = document.createElement('div');
  row.className = 'message-row assistant';
  row.id = 'typing-row';
  row.innerHTML = `
    <div class="assistant-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L8 6H4v4L2 12l2 2v4h4l4 4 4-4h4v-4l2-2-2-2V6h-4L12 2z" stroke-width="1.5"/>
      </svg>
    </div>
    <div class="content">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>`;
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  setTimeout(() => {
    row.remove();
    state.isTyping = false;

    const replies = [
      `I'm ${APP_NAME}, your connected world assistant. I heard you — let me help with that.`,
      `Got it. Working on that for you right now.`,
      `Sure thing! Here's what I found for "${escapeHtml(userText.slice(0, 40))}..."`,
      `That's a great question. Let me break it down for you.`,
    ];
    const reply = replies[Math.floor(Math.random() * replies.length)];
    appendMessage('assistant', reply);
  }, 1200 + Math.random() * 800);
}

/* ── Sidebar nav ── */
sidebarBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    sidebarBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Future: handle view switching here
  });
});

/* ── Util ── */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

/* ── Init ── */
document.title = APP_NAME;
console.log(`[${APP_NAME}] UI loaded ✓`);
