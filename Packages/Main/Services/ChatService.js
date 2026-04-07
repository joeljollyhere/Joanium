import fs from 'fs';
import path from 'path';
import {
  directoryExists,
  ensureDir,
  loadJson,
  persistJson,
  scanFiles,
} from '../Core/FileSystem.js';
import Paths from '../Core/Paths.js';
import * as ProjectService from './ProjectService.js';

const INTERNAL_ASSISTANT_TOOL_PATTERNS = [
  /^\s*I\s+(?:used|called|ran|invoked)\s+(?:the\s+)?[A-Za-z0-9_.\-\s/]+\s+tool\b[\s.,;:!?\u2026]*$/i,
  /^\s*Tool result for\b/i,
  /^\s*Internal execution context for the assistant only\b/i,
];
const CHAT_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

function normalizeChatId(chatId) {
  const id = String(chatId ?? '').trim();
  if (!CHAT_ID_RE.test(id) || id.includes('..')) {
    throw new Error('Invalid chat id.');
  }
  return id;
}

function ensureGlobalChatsDir() {
  ensureDir(Paths.CHATS_DIR);
}

function resolveProjectId(chatData, opts = {}) {
  return String(opts.projectId ?? chatData?.projectId ?? '').trim() || null;
}

function chatsDir(projectId = null, createIfMissing = true) {
  if (!projectId) {
    if (createIfMissing) ensureGlobalChatsDir();
    return Paths.CHATS_DIR;
  }

  ProjectService.get(projectId);
  const dir = ProjectService.getProjectChatsDir(projectId);
  if (createIfMissing) ensureDir(dir);
  return dir;
}

function chatPath(chatId, projectId = null) {
  const id = normalizeChatId(chatId);
  return path.join(chatsDir(projectId), `${id}.json`);
}

function isInternalHiddenMessage(message = {}) {
  const role = String(message?.role ?? 'user');
  const content = String(message?.content ?? '').trim();

  if (!content) return false;
  if (role === 'assistant') {
    return INTERNAL_ASSISTANT_TOOL_PATTERNS.some((pattern) => pattern.test(content));
  }
  if (role !== 'user') return false;
  return /^(?:Tool result for|Internal execution context for the assistant only)\b/i.test(content);
}

function sanitizeMessages(messages = []) {
  return (Array.isArray(messages) ? messages : [])
    .map((message) => ({
      role: message?.role ?? 'user',
      content: String(message?.content ?? ''),
      attachments: Array.isArray(message?.attachments) ? message.attachments : [],
    }))
    .filter((message) => !isInternalHiddenMessage(message));
}

function sanitizeChatData(chatData = {}) {
  return {
    ...chatData,
    messages: sanitizeMessages(chatData.messages),
  };
}

function readChatsFromDirectory(dirPath) {
  return scanFiles(dirPath, (entry) => entry.name.endsWith('.json'))
    .map((filePath) => {
      const chat = loadJson(filePath, null);
      return chat ? sanitizeChatData(chat) : null;
    })
    .filter(Boolean);
}

/** Persist a chat object to disk. */
export function save(chatData, opts = {}) {
  const projectId = resolveProjectId(chatData, opts);
  const chatId = normalizeChatId(chatData?.id);
  const payload = {
    ...sanitizeChatData(chatData),
    id: chatId,
    projectId,
  };

  persistJson(chatPath(chatId, projectId), payload);
}

/** Return all chats sorted newest-first. */
export function getAll(opts = {}) {
  const projectId = resolveProjectId(null, opts);
  const dirPath = chatsDir(
    projectId,
    !projectId || directoryExists(ProjectService.getProjectChatsDir(projectId)),
  );
  if (!directoryExists(dirPath)) return [];

  return readChatsFromDirectory(dirPath).sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
  );
}

/** Load a single chat by ID. Throws if not found. */
export function load(chatId, opts = {}) {
  const projectId = resolveProjectId(null, opts);
  const id = normalizeChatId(chatId);
  const chat = loadJson(chatPath(id, projectId), null);

  if (!chat) {
    throw new Error(`Chat "${id}" does not exist.`);
  }

  return sanitizeChatData(chat);
}

/** Delete a chat by ID. */
export function remove(chatId, opts = {}) {
  const projectId = resolveProjectId(null, opts);
  fs.unlinkSync(chatPath(chatId, projectId));
}
