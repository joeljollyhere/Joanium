import { ipcMain } from 'electron';
import * as GmailAPI from '../../Automation/Integrations/Gmail.js';
import { startGmailOAuthFlow, setConnectorEngine } from '../../Automation/Integrations/Gmail.js';
import { invalidate as invalidateSysPrompt } from '../Services/SystemPromptService.js';

export function register(connectorEngine) {
  // Give Gmail.js a reference so it can persist refreshed tokens automatically
  setConnectorEngine(connectorEngine);

  function creds() { return connectorEngine.getCredentials('gmail'); }
  function notConnected() { return { ok: false, error: 'Gmail not connected' }; }

  // ── OAuth ─────────────────────────────────────────────────────────────────

  ipcMain.handle('gmail-oauth-start', async (_e, clientId, clientSecret) => {
    try {
      if (!clientId?.trim() || !clientSecret?.trim())
        return { ok: false, error: 'Client ID and Client Secret are required' };
      const tokens = await startGmailOAuthFlow(clientId.trim(), clientSecret.trim());
      connectorEngine.saveConnector('gmail', tokens);
      invalidateSysPrompt();
      return { ok: true, email: tokens.email };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  // ── Read ──────────────────────────────────────────────────────────────────

  ipcMain.handle('gmail-get-brief', async (_e, maxResults = 15) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      const brief = await GmailAPI.getEmailBrief(c, maxResults);
      return { ok: true, ...brief };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('gmail-get-unread', async (_e, maxResults = 20) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      return { ok: true, emails: await GmailAPI.getUnreadEmails(c, maxResults) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('gmail-search', async (_e, query, maxResults = 10) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      return { ok: true, emails: await GmailAPI.searchEmails(c, query, maxResults) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('gmail-inbox-stats', async () => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      return { ok: true, stats: await GmailAPI.getInboxStats(c) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('gmail-send', async (_e, to, subject, body, cc = '', bcc = '') => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      await GmailAPI.sendEmail(c, to, subject, body, cc, bcc);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('gmail-reply', async (_e, messageId, replyBody) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      if (!messageId) return { ok: false, error: 'messageId is required' };
      if (!replyBody) return { ok: false, error: 'replyBody is required' };
      await GmailAPI.replyToEmail(c, messageId, replyBody);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('gmail-forward', async (_e, messageId, forwardTo, note = '') => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      if (!messageId) return { ok: false, error: 'messageId is required' };
      if (!forwardTo) return { ok: false, error: 'forwardTo is required' };
      await GmailAPI.forwardEmail(c, messageId, forwardTo, note);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('gmail-create-draft', async (_e, to, subject, body, cc = '') => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      if (!to || !subject) return { ok: false, error: 'to and subject are required' };
      const draft = await GmailAPI.createDraft(c, to, subject, body ?? '', cc);
      return { ok: true, draft };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('gmail-mark-all-read', async () => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      const count = await GmailAPI.markAllRead(c);
      return { ok: true, count };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('gmail-archive-read', async (_e, maxResults = 100) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      const count = await GmailAPI.archiveReadEmails(c, maxResults);
      return { ok: true, count };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('gmail-trash-by-query', async (_e, query, maxResults = 50) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      if (!query) return { ok: false, error: 'query is required' };
      const count = await GmailAPI.trashEmailsByQuery(c, query, maxResults);
      return { ok: true, count };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('gmail-mark-as-read', async (_e, messageId) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      if (!messageId) return { ok: false, error: 'messageId is required' };
      await GmailAPI.markAsRead(c, messageId);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('gmail-mark-as-unread', async (_e, messageId) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      if (!messageId) return { ok: false, error: 'messageId is required' };
      await GmailAPI.markAsUnread(c, messageId);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('gmail-archive-message', async (_e, messageId) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      if (!messageId) return { ok: false, error: 'messageId is required' };
      await GmailAPI.archiveMessage(c, messageId);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('gmail-trash-message', async (_e, messageId) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      if (!messageId) return { ok: false, error: 'messageId is required' };
      await GmailAPI.trashMessage(c, messageId);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('gmail-list-labels', async () => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      return { ok: true, labels: await GmailAPI.listLabels(c) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('gmail-create-label', async (_e, name, colors = {}) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      if (!name) return { ok: false, error: 'label name is required' };
      const label = await GmailAPI.createLabel(c, name, colors);
      return { ok: true, label };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('gmail-get-label-id', async (_e, labelName) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      if (!labelName) return { ok: false, error: 'labelName is required' };
      const id = await GmailAPI.getLabelId(c, labelName);
      return { ok: true, id };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('gmail-modify-message', async (_e, messageId, addLabels = [], removeLabels = []) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      if (!messageId) return { ok: false, error: 'messageId is required' };
      await GmailAPI.modifyMessage(c, messageId, { addLabels, removeLabels });
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });
}
