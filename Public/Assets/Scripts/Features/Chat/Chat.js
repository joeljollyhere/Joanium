// ─────────────────────────────────────────────
//  openworld — Public/Assets/Scripts/Features/Chat/Chat.js
//  Core chat logic with NATIVE tool calling (agentic loop).
//
//  How it works:
//    1. Send messages + tool definitions to AI
//    2. If AI returns tool_call → execute it → feed result back → loop
//    3. If AI returns text → show it, done
//
//  The AI decides what to call. We just execute and loop.
// ─────────────────────────────────────────────

import { state } from '../../Shared/State.js';
import { render as renderMarkdown } from '../../Shared/Markdown.js';
import { welcome, chatView, chatMessages } from '../../Shared/DOM.js';
import { fetchWithTools } from '../AI/AIProvider.js';
import { reset as resetComposer } from '../Composer/Composer.js';
import { TOOLS } from './Tools.js';
import { executeTool } from './ToolExecutor.js';

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
function generateChatId() {
  const now = new Date();
  const p = v => String(v).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}_${p(now.getHours())}-${p(now.getMinutes())}-${p(now.getSeconds())}`;
}

function normalizeMessage(msg) {
  return {
    role: msg?.role ?? 'user',
    content: String(msg?.content ?? ''),
    attachments: Array.isArray(msg?.attachments)
      ? msg.attachments.filter(a => a?.type === 'image' && typeof a.dataUrl === 'string')
      : [],
  };
}

function buildImageFrame(attachment, className) {
  const frame = document.createElement('div');
  frame.className = className;
  frame.title = attachment.name || 'Pasted image';
  const img = document.createElement('img');
  img.src = attachment.dataUrl;
  img.alt = attachment.name || 'Pasted image';
  img.loading = 'lazy';
  frame.appendChild(img);
  return frame;
}

function appendTextWithLineBreaks(container, text) {
  String(text ?? '').split('\n').forEach((line, i) => {
    if (i > 0) container.appendChild(document.createElement('br'));
    container.appendChild(document.createTextNode(line));
  });
}

function smoothScrollToBottom() {
  chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
}

let _updateSendBtn = () => { };
export function setSendBtnUpdater(fn) { _updateSendBtn = fn; }

/* ══════════════════════════════════════════
   LIVE ASSISTANT BUBBLE
   Creates one row that gets updated in-place
   as the agent works through tool calls.
══════════════════════════════════════════ */
function assistantIcon() {
  return `<div class="assistant-icon">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M12 2L8 6H4v4L2 12l2 2v4h4l4 4 4-4h4v-4l2-2-2-2V6h-4L12 2z" stroke-width="1.5"/>
    </svg>
  </div>`;
}

function createLiveRow() {
  const row = document.createElement('div');
  row.className = 'message-row assistant';
  row.innerHTML = `${assistantIcon()}<div class="content"><div class="agent-log"></div><div class="agent-reply"></div></div>`;
  chatMessages.appendChild(row);
  smoothScrollToBottom();

  const logEl = row.querySelector('.agent-log');
  const replyEl = row.querySelector('.agent-reply');

  return {
    row,
    push(line) {
      const item = document.createElement('div');
      item.className = 'agent-log-item';
      // strip markdown for log lines — keep them plain and small
      item.textContent = line.replace(/[*_`]/g, '').replace(/^[🔧📤📬📥📖🔍📦🌲🐛🔀🔔❌✅]\s*/, '');
      // grab the emoji separately for the icon
      const emojiMatch = line.match(/^([🔧📤📬📥📖🔍📦🌲🐛🔀🔔❌✅])/);
      item.innerHTML = `
        <span class="agent-log-dot"></span>
        <span class="agent-log-text">${emojiMatch ? emojiMatch[1] + ' ' : ''}${item.textContent}</span>
      `;
      logEl.appendChild(item);
      // animate in
      requestAnimationFrame(() => item.classList.add('agent-log-item--in'));
      smoothScrollToBottom();
    },
    set(markdown) {
      // fade out log then show reply
      logEl.style.opacity = '0';
      logEl.style.transition = 'opacity 0.2s ease';
      setTimeout(() => {
        logEl.innerHTML = '';
        logEl.style.display = 'none';
        replyEl.innerHTML = renderMarkdown(markdown);
        smoothScrollToBottom();
      }, 200);
    },
  };
}

/* ══════════════════════════════════════════
   MESSAGE RENDERING
══════════════════════════════════════════ */
export function appendMessage(role, content, addToState = true, scroll = true, attachments = []) {
  const msg = normalizeMessage({ role, content, attachments });
  if (addToState) state.messages.push(msg);

  const row = document.createElement('div');
  row.className = `message-row ${msg.role}`;

  if (msg.role === 'user') {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    if (msg.attachments.length > 0) {
      bubble.classList.add('has-attachments');
      const gallery = document.createElement('div');
      gallery.className = 'bubble-attachments';
      msg.attachments.forEach(a => gallery.appendChild(buildImageFrame(a, 'bubble-attachment')));
      bubble.appendChild(gallery);
    }
    if (msg.content) {
      const tb = document.createElement('div');
      tb.className = 'bubble-text';
      appendTextWithLineBreaks(tb, msg.content);
      bubble.appendChild(tb);
    }
    row.appendChild(bubble);
  } else {
    row.innerHTML = `${assistantIcon()}<div class="content"></div>`;
    row.querySelector('.content').innerHTML = renderMarkdown(msg.content);
  }

  chatMessages.appendChild(row);
  if (scroll) smoothScrollToBottom();
  return row;
}

export function replaceLastAssistant(markdown) {
  const rows = chatMessages.querySelectorAll('.message-row.assistant');
  const last = rows[rows.length - 1];
  if (last) {
    const content = last.querySelector('.content');
    if (content) content.innerHTML = renderMarkdown(markdown);
  } else {
    appendMessage('assistant', markdown, false, true);
  }
}

/* ══════════════════════════════════════════
   CHAT VIEW TRANSITION
══════════════════════════════════════════ */
export function showChatView() {
  if (chatView.classList.contains('active')) return;
  welcome.getAnimations().forEach(a => a.cancel());
  welcome.style.display = 'flex';
  const anim = welcome.animate(
    [{ opacity: 1, transform: 'translateY(0) scale(1)' }, { opacity: 0, transform: 'translateY(-16px) scale(0.97)' }],
    { duration: 280, easing: 'cubic-bezier(0.4,0,1,1)', fill: 'forwards' },
  );
  anim.onfinish = () => { welcome.style.display = 'none'; };
  chatView.classList.add('active');
}

export function restoreWelcome() {
  welcome.getAnimations().forEach(a => a.cancel());
  welcome.style.display = 'flex';
  welcome.style.removeProperty('opacity');
  welcome.style.removeProperty('transform');
  chatView.classList.remove('active');
}

/* ══════════════════════════════════════════
   LEGACY HELPERS (used by library, settings etc.)
══════════════════════════════════════════ */
export async function callAI() {
  state.isTyping = true;
  _updateSendBtn();
  const chatIdAtRequest = state.currentChatId;

  const typingRow = document.createElement('div');
  typingRow.className = 'message-row assistant';
  typingRow.id = 'typing-row';
  typingRow.innerHTML = `${assistantIcon()}<div class="content" style="padding-top:6px">
    <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>
  </div>`;
  chatMessages.appendChild(typingRow);
  smoothScrollToBottom();

  const remove = (cb) => {
    if (!typingRow.isConnected) { state.isTyping = false; _updateSendBtn(); cb?.(); return; }
    typingRow.animate(
      [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.96)' }],
      { duration: 180, easing: 'ease-in', fill: 'forwards' },
    ).onfinish = () => { typingRow.remove(); state.isTyping = false; _updateSendBtn(); cb?.(); };
  };

  if (!state.selectedProvider || !state.selectedModel) {
    remove(() => appendMessage('assistant', 'No AI provider configured. Please add an API key in Settings.'));
    return;
  }

  try {
    const result = await fetchWithTools(state.selectedProvider, state.selectedModel, state.messages, state.systemPrompt, []);
    const reply = result.type === 'text' ? result.text : '(unexpected tool call)';
    remove(() => {
      if (state.currentChatId !== chatIdAtRequest) return;
      appendMessage('assistant', reply);
      saveCurrentChat();
    });
  } catch (err) {
    remove(() => appendMessage('assistant', `API Error: ${err.message}`));
    console.error('[Chat] callAI error:', err);
  }
}

export async function callAIWithContext(contextPrompt) {
  state.isTyping = true;
  _updateSendBtn();
  if (!state.selectedProvider || !state.selectedModel) {
    replaceLastAssistant('No AI provider configured.');
    state.isTyping = false; _updateSendBtn(); return;
  }
  const msgs = [...state.messages.slice(-10), { role: 'user', content: contextPrompt, attachments: [] }];
  try {
    const result = await fetchWithTools(state.selectedProvider, state.selectedModel, msgs, state.systemPrompt, []);
    const reply = result.type === 'text' ? result.text : '(unexpected tool call)';
    replaceLastAssistant(reply);
    state.messages.push({ role: 'assistant', content: reply, attachments: [] });
    saveCurrentChat();
  } catch (err) {
    replaceLastAssistant(`AI error: ${err.message}`);
  } finally {
    state.isTyping = false;
    _updateSendBtn();
  }
}

/* ══════════════════════════════════════════
   THE AGENTIC LOOP  ← the whole point
   AI sees tools → decides to call one → we execute
   → feed result back → AI responds → done.
══════════════════════════════════════════ */
async function agentLoop(messages, live) {
  const loopMessages = [...messages];
  const MAX_TURNS = 5;
  let toolsUsed = false;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    // After a tool has run, pass NO tools — force the model to write
    // a plain natural language response instead of calling another tool
    // or echoing back JSON/pseudo-code like "$mail_sent = True"
    const toolsThisTurn = toolsUsed ? [] : TOOLS;

    const result = await fetchWithTools(
      state.selectedProvider,
      state.selectedModel,
      loopMessages,
      state.systemPrompt,
      toolsThisTurn,
    );

    if (result.type === 'text') {
      // Replace all staging lines with the final clean answer
      live.set(result.text);
      return result.text;
    }

    if (result.type === 'tool_call') {
      const { name, params } = result;
      toolsUsed = true;

      // Show a friendly activity indicator
      live.push(`🔧 _${name.replace(/_/g, ' ')}…_`);

      let toolResult;
      try {
        toolResult = await executeTool(name, params, msg => live.push(msg));
      } catch (err) {
        toolResult = `Error: ${err.message}`;
        live.push(`❌ ${err.message}`);
      }

      // Tell the model what happened — explicitly ask for natural language
      loopMessages.push({
        role: 'assistant',
        content: `I used the ${name} tool.`,
        attachments: [],
      });
      loopMessages.push({
        role: 'user',
        content: `Tool result: ${toolResult}\n\nNow write a short, friendly, natural language reply to the user. No JSON, no code.`,
        attachments: [],
      });

      continue;
    }
  }

  live.set('Done.');
  return 'Done.';
}

/* ══════════════════════════════════════════
   SEND MESSAGE
══════════════════════════════════════════ */
export async function sendMessage({ text, attachments, sendBtnEl }) {
  if ((!text && attachments.length === 0) || state.isTyping) return;

  if (!state.currentChatId) state.currentChatId = generateChatId();

  showChatView();
  appendMessage('user', text, true, true, attachments);
  resetComposer();

  sendBtnEl?.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(0.85)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }],
    { duration: 350, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  );

  if (!state.selectedProvider || !state.selectedModel) {
    appendMessage('assistant', 'No AI provider configured. Please add an API key in Settings.');
    return;
  }

  state.isTyping = true;
  _updateSendBtn();

  const live = createLiveRow();
  live.push('_Thinking…_');

  try {
    const finalReply = await agentLoop(state.messages, live);
    state.messages.push({ role: 'assistant', content: finalReply, attachments: [] });
    saveCurrentChat();
  } catch (err) {
    const msg = `Something went wrong: ${err.message}`;
    live.set(msg);
    state.messages.push({ role: 'assistant', content: msg, attachments: [] });
    console.error('[Chat] sendMessage error:', err);
  } finally {
    state.isTyping = false;
    _updateSendBtn();
  }
}

/* ══════════════════════════════════════════
   CHAT PERSISTENCE
══════════════════════════════════════════ */
export async function saveCurrentChat() {
  if (!state.currentChatId || !state.messages.length) return;
  const first = state.messages.find(m => m.role === 'user');
  const title = first?.content?.trim().slice(0, 70) ||
    (first?.attachments?.length ? 'Image attachment' : 'Untitled');
  try {
    await window.electronAPI?.saveChat({
      id: state.currentChatId,
      title,
      updatedAt: new Date().toISOString(),
      provider: state.selectedProvider?.provider ?? null,
      model: state.selectedModel ?? null,
      messages: state.messages,
    });
  } catch (err) { console.warn('[Chat] Could not save chat:', err); }
}

export function startNewChat(extraCleanup = () => { }) {
  state.messages = [];
  state.currentChatId = null;
  state.isTyping = false;
  document.getElementById('typing-row')?.remove();
  chatMessages.innerHTML = '';
  restoreWelcome();
  resetComposer();
  extraCleanup();
}

export async function loadChat(chatId, { updateModelLabel, buildModelDropdown, notifyModelSelectionChanged }) {
  try {
    const chat = await window.electronAPI?.loadChat(chatId);
    if (!chat) return;
    state.messages = [];
    state.currentChatId = chat.id;
    state.isTyping = false;
    document.getElementById('typing-row')?.remove();
    chatMessages.innerHTML = '';
    resetComposer();
    showChatView();
    const restored = (chat.messages ?? []).map(m => ({
      role: m?.role ?? 'user',
      content: String(m?.content ?? ''),
      attachments: Array.isArray(m?.attachments)
        ? m.attachments.filter(a => a?.type === 'image' && typeof a.dataUrl === 'string')
        : [],
    }));
    restored.forEach(m => appendMessage(m.role, m.content, false, false, m.attachments));
    state.messages = restored;
    smoothScrollToBottom();
    if (chat.provider && chat.model) {
      const provider = state.providers.find(p => p.provider === chat.provider);
      if (provider) {
        state.selectedProvider = provider;
        state.selectedModel = chat.model;
        updateModelLabel();
        buildModelDropdown();
      }
    }
    notifyModelSelectionChanged();
    _updateSendBtn();
  } catch (err) { console.error('[Chat] Load error:', err); }
}