import { state } from '../../../../System/State.js';
import { fetchWithTools } from '../../../../Features/AI/index.js';
import { buildChatPayload } from '../Data/ChatPersistence.js';

let _memorySyncChain = Promise.resolve();
const _queuedSignatures = new Set();
// Abort controller for the active memory-sync LLM call — cancelled when a new one starts
let _activeMemoryAbort = null;
const _MAX_QUEUED_SIGNATURES = 100;

function buildSnapshotScope(projectId = null) {
  return projectId ? { projectId: projectId } : {};
}

function hasMeaningfulConversation(messages = []) {
  return (Array.isArray(messages) ? messages : []).some(
    (message) =>
      'user' === message?.role &&
      (String(message?.content ?? '').trim() || (message?.attachments?.length ?? 0) > 0),
  );
}

function normalizeForSignature(value = '') {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

function buildMemoryCatalogBlock(entries = []) {
  const fileList = entries.map((entry) => entry.filename).join(', '),
    nonEmptyEntries = entries.filter((entry) => {
      const lines = String(entry.content ?? '')
        .replace(/\r\n/g, '\n')
        .split('\n');
      return (lines[0]?.trim().startsWith('#') && lines.shift(), lines.join('\n').trim());
    }),
    sections = [];
  return (
    fileList && sections.push(`Available files: ${fileList}`),
    nonEmptyEntries.length &&
      sections.push(
        nonEmptyEntries
          .map((entry) =>
            [`FILE: ${entry.filename}`, 'CONTENT:', entry.content?.trim() || '(empty)'].join('\n'),
          )
          .join('\n\n---\n\n'),
      ),
    sections.join('\n\n')
  );
}

function normalizeMemoryEntry(entry) {
  if (!entry || 'object' != typeof entry) return null;
  const filename = String(entry.filename ?? '').trim(),
    content = String(entry.content ?? '').trim();
  return filename && content ? { filename: filename, content: content } : null;
}

async function markSnapshotSynced(snapshot) {
  await window.electronAPI?.invoke?.(
    'mark-chat-personal-memory-synced',
    snapshot.id,
    snapshot.scope ?? {},
  );
}

function waitForUserIdle(pollMs = 500, maxWaitMs = 60000) {
  return new Promise((resolve) => {
    if (!state.isTyping) return resolve();
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += pollMs;
      if (!state.isTyping || elapsed >= maxWaitMs) {
        clearInterval(interval);
        resolve();
      }
    }, pollMs);
  });
}

function resolveProvider(snapshot = {}) {
  const preferredProviderId = String(snapshot.provider ?? '').trim();
  const preferredModelId = String(snapshot.model ?? '').trim();

  if (preferredProviderId && preferredModelId) {
    const provider = state.providers.find(
      (candidate) =>
        candidate.provider === preferredProviderId && candidate.models?.[preferredModelId],
    );
    if (provider) return { provider, modelId: preferredModelId };
  }

  return state.selectedProvider && state.selectedModel
    ? { provider: state.selectedProvider, modelId: state.selectedModel }
    : { provider: null, modelId: null };
}

function buildTranscript(messages = []) {
  return messages
    .map((message) => {
      const role = 'assistant' === message.role ? 'Assistant' : 'User';
      const attachments = Array.isArray(message.attachments)
        ? message.attachments
            .map((attachment) => attachment?.name ?? attachment?.type ?? '')
            .filter(Boolean)
        : [];
      const attachmentLine = attachments.length ? `\nAttachments: ${attachments.join(', ')}` : '';
      return `${role}: ${String(message.content ?? '').trim() || '(no text)'}${attachmentLine}`;
    })
    .join('\n\n');
}

function extractJson(text = '') {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  return -1 === start || -1 === end || end <= start ? null : text.slice(start, end + 1);
}

function normalizePayload(payload = {}) {
  return {
    updates: (Array.isArray(payload.updates) ? payload.updates : [])
      .map(normalizeMemoryEntry)
      .filter(Boolean),
    newFiles: (Array.isArray(payload.newFiles) ? payload.newFiles : [])
      .map(normalizeMemoryEntry)
      .filter(Boolean),
  };
}

function showMemoryIndicator(label = 'Updating memory...') {
  const existing = document.getElementById('memory-learn-indicator');
  if (existing) {
    existing.querySelector('[data-memory-label]')?.replaceChildren(document.createTextNode(label));
    return () => {};
  }
  const el = document.createElement('div');
  el.id = 'memory-learn-indicator';
  el.innerHTML = `\n    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"\n         style="width:12px;height:12px;animation:spin 1.2s linear infinite;flex-shrink:0">\n      <path d="M21 12a9 9 0 11-6.219-8.56" stroke-linecap="round"/>\n    </svg>\n    <span data-memory-label>${label}</span>\n  `;
  el.style.cssText =
    '\n    position:fixed; top:48px; left:calc(var(--sidebar-w, 52px) + 14px); transform:none;\n    display:flex; align-items:center; gap:6px;\n    background:var(--bg-tertiary); border:1px solid var(--border-subtle);\n    border-radius:999px; padding:4px 12px;\n    font-size:11px; font-family:var(--font-ui); color:var(--text-muted);\n    z-index:50; animation:fadeIn 0.2s ease both;\n    pointer-events:none;\n  ';

  if (!document.getElementById('mem-spin-style')) {
    const style = document.createElement('style');
    style.id = 'mem-spin-style';
    style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(style);
  }

  document.body.appendChild(el);
  return () => {
    el.style.transition = 'opacity 0.3s ease';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  };
}

function enqueueSnapshotMemorySync(snapshot, label = 'Updating memory...') {
  if (!snapshot) return Promise.resolve(false);
  const signature = (function (snapshot = {}) {
    const lastMessage = snapshot.messages?.[snapshot.messages.length - 1];
    return [
      snapshot.id,
      snapshot.updatedAt,
      snapshot.messages?.length ?? 0,
      normalizeForSignature(lastMessage?.content ?? ''),
    ].join('::');
  })(snapshot);

  if (_queuedSignatures.has(signature)) return _memorySyncChain;

  // Hard cap — prevent unbounded growth if many chats queue at once
  if (_queuedSignatures.size >= _MAX_QUEUED_SIGNATURES) _queuedSignatures.clear();

  _queuedSignatures.add(signature);
  _memorySyncChain = _memorySyncChain
    .catch(() => {})
    .then(async () => {
      const hideIndicator = showMemoryIndicator(label);
      try {
        const payload = { ...snapshot };
        delete payload.scope;
        delete payload.reason;
        await window.electronAPI?.invoke?.('save-chat', payload, snapshot.scope ?? {});

        const { provider, modelId } = resolveProvider(snapshot);
        if (!provider || !modelId) return false;

        const catalog = (await window.electronAPI?.invoke?.('get-personal-memory-catalog')) ?? [];
        const transcript = buildTranscript(snapshot.messages);

        if (!transcript.trim()) {
          await markSnapshotSynced(snapshot);
          _queuedSignatures.delete(signature);
          return true;
        }

        const prompt = [
          'You maintain a persistent personal-memory library for one user.',
          'Use the completed conversation to decide which personal memory markdown files should change.',
          '',
          'Rules:',
          '- These files are ONLY for personal information.',
          '- Never store repo names, code, bug reports, workspace details, project tasks, file paths, stack traces, or other work/project context.',
          '- Keep only durable personal facts: likes, dislikes, family, friends, relationships, education, career aspirations, values, wellbeing, support preferences, habits, important dates, and communication preferences.',
          '- Do not store one-off troubleshooting requests, temporary work context, or random passing thoughts.',
          '- Do not repeat facts that already exist anywhere in the memory library.',
          '- Prefer updating existing files. Create a new .md file only when the current files are clearly not enough.',
          '- When you update a file, return the FULL final markdown for that file.',
          '- Preserve useful existing content and merge new facts cleanly.',
          '- If nothing should change, return exactly {"updates":[],"newFiles":[]}.',
          '',
          'Return ONLY valid JSON with this shape:',
          '{"updates":[{"filename":"Likes.md","content":"# Likes\\n- ..."}],"newFiles":[{"filename":"Custom.md","content":"# Custom\\n- ..."}]}',
          '',
          'Existing personal memory files:',
          buildMemoryCatalogBlock(catalog),
          '',
          'Completed conversation transcript:',
          transcript,
        ].join('\n');

        // Event-loop yield — lets channel events and other microtasks run
        // before we start a potentially long LLM call
        await new Promise((r) => setTimeout(r, 0));

        // Abort any in-flight memory sync and start a new one
        _activeMemoryAbort?.abort();
        _activeMemoryAbort = new AbortController();
        const signal = _activeMemoryAbort.signal;

        const result = await fetchWithTools(
          provider,
          modelId,
          [{ role: 'user', content: prompt, attachments: [] }],
          'You update a personal memory library. Return only valid JSON.',
          [],
          signal,
        );

        if (result.type !== 'text') throw new Error('Memory sync did not return text.');

        const jsonText = extractJson(result.text ?? '');
        if (!jsonText) throw new Error('Memory sync did not return valid JSON.');

        const updatePayload = normalizePayload(JSON.parse(jsonText));

        if (updatePayload.updates.length || updatePayload.newFiles.length) {
          const response = await window.electronAPI?.invoke?.(
            'apply-personal-memory-updates',
            updatePayload,
          );
          if (response?.ok === false) {
            throw new Error(response.error ?? 'Could not apply personal memory updates.');
          }
        }

        await markSnapshotSynced(snapshot);
        // Prune on success (was previously only pruned on failure)
        _queuedSignatures.delete(signature);
        return true;
      } finally {
        hideIndicator();
      }
    })
    .catch((error) => {
      _queuedSignatures.delete(signature);
      if (error?.name === 'AbortError') throw error;
      console.warn('[Chat] Personal memory sync failed (non-fatal):', error?.message ?? error);
      return false;
    });

  return _memorySyncChain;
}

export function queueCurrentSessionMemorySync(reason = 'session-end') {
  const snapshot = (function (reason = 'session-end') {
    const payload = buildChatPayload({
      chatId: state.currentChatId,
      messages: state.messages,
      provider: state.selectedProvider,
      model: state.selectedModel,
      activeProject: state.activeProject,
      workspacePath: state.workspacePath,
      conversationSummary: state.conversationSummary,
      conversationSummaryMessageCount: state.conversationSummaryMessageCount,
    });
    return payload && hasMeaningfulConversation(payload.messages)
      ? { ...payload, reason, scope: buildSnapshotScope(payload.projectId) }
      : null;
  })(reason);
  return enqueueSnapshotMemorySync(snapshot, 'Updating memory...');
}

async function processBatchedMemorySync(chats) {
  const { provider, modelId } = resolveProvider();
  if (!provider || !modelId) return;

  const catalog = (await window.electronAPI?.invoke?.('get-personal-memory-catalog')) ?? [];

  const combinedTranscripts = chats
    .map((chat, idx) => {
      const transcript = buildTranscript(chat.messages);
      return `--- CONVERSATION ${idx + 1} ---\n${transcript}`;
    })
    .filter((t) => t.trim().length > 0)
    .join('\n\n');

  if (!combinedTranscripts.trim()) return;

  const prompt = [
    'You maintain a persistent personal-memory library for one user.',
    `You are reviewing ${chats.length} completed conversation(s) to decide which personal memory files should change.`,
    '',
    'Rules:',
    '- These files are ONLY for personal information.',
    '- Never store repo names, code, bug reports, workspace details, project tasks, file paths, stack traces, or other work/project context.',
    '- Keep only durable personal facts: likes, dislikes, family, friends, relationships, education, career aspirations, values, wellbeing, support preferences, habits, important dates, and communication preferences.',
    '- Do not store one-off troubleshooting requests, temporary work context, or random passing thoughts.',
    '- Do not repeat facts that already exist anywhere in the memory library.',
    '- Prefer updating existing files. Create a new .md file only when the current files are clearly not enough.',
    '- When you update a file, return the FULL final markdown for that file.',
    '- Preserve useful existing content and merge new facts cleanly.',
    '- If nothing should change, return exactly {"updates":[],"newFiles":[]}.',
    '',
    'Return ONLY valid JSON with this shape:',
    '{"updates":[{"filename":"Likes.md","content":"# Likes\\n- ..."}],"newFiles":[{"filename":"Custom.md","content":"# Custom\\n- ..."}]}',
    '',
    'Existing personal memory files:',
    buildMemoryCatalogBlock(catalog),
    '',
    `Completed conversation transcripts (${chats.length} conversations):`,
    combinedTranscripts,
  ].join('\n');

  await waitForUserIdle();

  const result = await fetchWithTools(
    provider,
    modelId,
    [{ role: 'user', content: prompt, attachments: [] }],
    'You update a personal memory library. Return only valid JSON.',
    [],
  );

  if (result.type !== 'text') return;

  const jsonText = extractJson(result.text ?? '');
  if (!jsonText) return;

  try {
    const payload = normalizePayload(JSON.parse(jsonText));
    if (payload.updates.length || payload.newFiles.length) {
      await window.electronAPI?.invoke?.('apply-personal-memory-updates', payload);
    }
  } catch (e) {
    console.warn('[Chat] Failed to parse personal memory batch payload:', e);
  }
}

export async function flushPendingPersonalMemorySyncs(limit = 10) {
  if (!state.providers.length || (!state.selectedProvider && !state.selectedModel)) return;
  await waitForUserIdle();

  const pendingChats =
    (await window.electronAPI?.invoke?.('get-pending-personal-memory-chats', { limit })) ?? [];

  const meaningful = pendingChats.filter(
    (chat) => chat?.id && hasMeaningfulConversation(chat.messages),
  );

  if (!meaningful.length) return;

  const hideIndicator = showMemoryIndicator('Catching up memory...');
  try {
    await processBatchedMemorySync(meaningful);

    for (const chat of meaningful) {
      const snapshot = {
        ...chat,
        reason: 'pending-chat',
        scope: buildSnapshotScope(chat.projectId ?? null),
      };
      await markSnapshotSynced(snapshot);
    }
  } catch (err) {
    console.error('[Chat] Batch memory sync failed:', err);
  } finally {
    hideIndicator();
  }
}
