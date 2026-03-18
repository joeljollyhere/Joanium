import fs from 'fs';
import path from 'path';

// Automation Packages
import * as GmailAPI  from './Gmail.js';
import * as GithubAPI from './Github.js';
import {openSite} from './Site.js';
import {openFolder} from './Folder.js';
import {openTerminalAtPath, openTerminalAndRun} from './Terminal.js';
import {openApp} from './Application.js';
import {sendNotification} from './Notification.js';
import {copyToClipboard} from './Clipboard.js';
import {writeFile} from './File.js';

// Helpers
import {shouldRunNow} from './Scheduling.js';


// ACTION DISPATCHER
// connectorEngine is passed from AutomationEngine._execute()
// so Gmail / GitHub actions can access live credentials.

export async function runAction(action, connectorEngine = null) {
  if (!action?.type) return;

  switch (action.type) {

    // Existing system actions

    case 'open_site':
      return openSite(action.url);

    case 'open_folder':
      await openFolder(action.path);
      if (action.openTerminal)
        await openTerminalAtPath(action.path, action.terminalCommand || '');
      return;

    case 'run_command':
      return openTerminalAndRun(action.command);

    case 'open_app':
      return openApp(action.appPath);

    case 'send_notification':
      return sendNotification(action.title, action.body);

    case 'copy_to_clipboard':
      return copyToClipboard(action.text);

    case 'write_file':
      return writeFile(action.filePath, action.content);

    // Gmail actions

    case 'gmail_send_email': {
      const creds = connectorEngine?.getCredentials('gmail');
      if (!creds?.accessToken) throw new Error('Gmail not connected — connect in Settings → Connectors');
      await GmailAPI.sendEmail(creds, action.to, action.subject, action.body ?? '');
      console.log(`[AutomationEngine] gmail_send_email → ${action.to}`);
      return;
    }

    case 'gmail_get_brief': {
      const creds = connectorEngine?.getCredentials('gmail');
      if (!creds?.accessToken) throw new Error('Gmail not connected');
      const brief = await GmailAPI.getEmailBrief(creds, action.maxResults ?? 10);
      const preview = brief.emails
        .slice(0, 3)
        .map(e => e.subject)
        .filter(Boolean)
        .join(' · ');
      sendNotification(
        `📬 Gmail — ${brief.count} unread`,
        preview || 'No unread emails.',
      );
      return;
    }

    // GitHub actions

    case 'github_open_repo': {
      const owner = action.owner?.trim();
      const repo  = action.repo?.trim();
      if (!owner || !repo) throw new Error('github_open_repo: owner and repo are required');
      return openSite(`https://github.com/${owner}/${repo}`);
    }

    case 'github_check_prs': {
      const creds = connectorEngine?.getCredentials('github');
      if (!creds?.token) throw new Error('GitHub not connected');
      const prs     = await GithubAPI.getPullRequests(creds, action.owner, action.repo);
      const titles  = prs.slice(0, 3).map(p => `• ${p.title}`).join('\n');
      sendNotification(
        `🔀 ${action.owner}/${action.repo} — ${prs.length} open PR${prs.length !== 1 ? 's' : ''}`,
        titles || 'No open pull requests.',
      );
      return;
    }

    case 'github_check_issues': {
      const creds = connectorEngine?.getCredentials('github');
      if (!creds?.token) throw new Error('GitHub not connected');
      const issues = await GithubAPI.getIssues(creds, action.owner, action.repo);
      const titles = issues.slice(0, 3).map(i => `• ${i.title}`).join('\n');
      sendNotification(
        `🐛 ${action.owner}/${action.repo} — ${issues.length} open issue${issues.length !== 1 ? 's' : ''}`,
        titles || 'No open issues.',
      );
      return;
    }

    case 'github_check_notifs': {
      const creds = connectorEngine?.getCredentials('github');
      if (!creds?.token) throw new Error('GitHub not connected');
      const notifs = await GithubAPI.getNotifications(creds);
      const count  = notifs?.length ?? 0;
      sendNotification(
        `🔔 GitHub Notifications`,
        count === 0
          ? 'No unread notifications.'
          : `${count} unread notification${count !== 1 ? 's' : ''}`,
      );
      return;
    }

    default:
      console.warn(`[AutomationEngine] Unknown action type: "${action.type}"`);
  }
}

// AUTOMATION ENGINE CLASS

export class AutomationEngine {
  /**
   * @param {string}           automationsFilePath  Absolute path to Data/Automations.json
   * @param {ConnectorEngine}  connectorEngine      For Gmail / GitHub actions (optional)
   */
  constructor(automationsFilePath, connectorEngine = null) {
    this.filePath        = automationsFilePath;
    this.connectorEngine = connectorEngine;
    this.automations     = [];
    this._ticker         = null;
  }

  // Lifecycle

  start() {
    this._load();
    this._runStartupAutomations();
    this._ticker = setInterval(() => this._checkScheduled(), 60_000);
    console.log('[AutomationEngine] Started —', this.automations.length, 'automation(s)');
  }

  stop() {
    if (this._ticker) { clearInterval(this._ticker); this._ticker = null; }
    console.log('[AutomationEngine] Stopped');
  }

  reload() {
    this._load();
    console.log('[AutomationEngine] Reloaded —', this.automations.length, 'automation(s)');
  }

  // CRUD

  getAll() {
    this._load();
    return this.automations;
  }

  saveAutomation(automation) {
    this._load();
    const idx = this.automations.findIndex(a => a.id === automation.id);
    if (idx >= 0) this.automations[idx] = { ...this.automations[idx], ...automation };
    else          this.automations.push(automation);
    this._persist();
    return automation;
  }

  deleteAutomation(id) {
    this._load();
    this.automations = this.automations.filter(a => a.id !== id);
    this._persist();
  }

  toggleAutomation(id, enabled) {
    this._load();
    const a = this.automations.find(a => a.id === id);
    if (a) { a.enabled = Boolean(enabled); this._persist(); }
  }

  // Private helpers

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw  = fs.readFileSync(this.filePath, 'utf-8');
        const data = JSON.parse(raw);
        this.automations = Array.isArray(data.automations) ? data.automations : [];
      } else {
        this.automations = [];
      }
    } catch (err) {
      console.error('[AutomationEngine] _load error:', err);
      this.automations = [];
    }
  }

  _persist() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        this.filePath,
        JSON.stringify({ automations: this.automations }, null, 2),
        'utf-8',
      );
    } catch (err) {
      console.error('[AutomationEngine] _persist error:', err);
    }
  }

  _runStartupAutomations() {
    const targets = this.automations.filter(
      a => a.enabled && a.trigger?.type === 'on_startup',
    );
    for (const a of targets) this._execute(a);
  }

  _checkScheduled() {
    const now = new Date();
    for (const a of this.automations) {
      if (a.enabled && shouldRunNow(a, now)) this._execute(a);
    }
  }

  async _execute(automation) {
    console.log(`[AutomationEngine] Executing: "${automation.name}"`);
    try {
      for (const action of (automation.actions ?? [])) {
        await runAction(action, this.connectorEngine);
      }
      automation.lastRun = new Date().toISOString();
      this._persist();
    } catch (err) {
      console.error(`[AutomationEngine] Error in "${automation.name}":`, err);
    }
  }
}
