import fs   from 'fs';
import path from 'path';
import { exec } from 'child_process';

// Automation Packages
import * as GmailAPI  from './Gmail.js';
import * as GithubAPI from './Github.js';
import { openSite }                           from './Site.js';
import { openFolder }                         from './Folder.js';
import { openTerminalAtPath, openTerminalAndRun } from './Terminal.js';
import { openApp }                            from './Application.js';
import { sendNotification }                   from './Notification.js';
import { copyToClipboard }                    from './Clipboard.js';
import { writeFile }                          from './File.js';

// Helpers
import { shouldRunNow } from './Scheduling.js';


// ─────────────────────────────────────────────
//  ACTION DISPATCHER
// ─────────────────────────────────────────────

export async function runAction(action, connectorEngine = null) {
  if (!action?.type) return;

  switch (action.type) {

    /* ══════════════════════════════════════════
       SYSTEM / OS ACTIONS
    ══════════════════════════════════════════ */

    case 'open_site':
      return openSite(action.url);

    case 'open_multiple_sites': {
      const urls = String(action.urls ?? '').split('\n').map(u => u.trim()).filter(Boolean);
      for (const url of urls) {
        await openSite(url);
        if (urls.length > 1) await new Promise(r => setTimeout(r, 400));
      }
      return;
    }

    case 'open_folder':
      await openFolder(action.path);
      if (action.openTerminal)
        await openTerminalAtPath(action.path, action.terminalCommand || '');
      return;

    case 'run_command': {
      if (!action.command) throw new Error('run_command: no command provided');
      if (action.silent) {
        await new Promise((resolve, reject) => {
          exec(action.command, (err) => {
            if (action.notifyOnFinish) {
              sendNotification(
                err ? '❌ Command failed' : '✅ Command done',
                action.command.slice(0, 80),
              );
            }
            err ? reject(err) : resolve();
          });
        });
      } else {
        await openTerminalAndRun(action.command);
        if (action.notifyOnFinish) sendNotification('✅ Command launched', action.command.slice(0, 80));
      }
      return;
    }

    case 'run_script': {
      if (!action.scriptPath) throw new Error('run_script: no script path provided');
      const cmd = action.args?.trim()
        ? `${action.scriptPath} ${action.args}`
        : action.scriptPath;
      if (action.silent) {
        await new Promise((resolve, reject) => {
          exec(cmd, (err, stdout, stderr) => {
            if (action.notifyOnFinish) {
              sendNotification(
                err ? '❌ Script failed' : '✅ Script done',
                path.basename(action.scriptPath),
              );
            }
            err ? reject(err) : resolve();
          });
        });
      } else {
        await openTerminalAndRun(cmd);
        if (action.notifyOnFinish) sendNotification('✅ Script launched', path.basename(action.scriptPath));
      }
      return;
    }

    case 'open_app':
      return openApp(action.appPath);

    case 'send_notification':
      return sendNotification(action.title, action.body ?? '', action.clickUrl ?? '');

    case 'copy_to_clipboard':
      return copyToClipboard(action.text);

    case 'write_file': {
      if (!action.filePath) throw new Error('write_file: no file path provided');
      const dir = path.dirname(action.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (action.append) {
        fs.appendFileSync(action.filePath, String(action.content ?? ''), 'utf-8');
      } else {
        fs.writeFileSync(action.filePath, String(action.content ?? ''), 'utf-8');
      }
      console.log(`[AutomationEngine] write_file (${action.append ? 'append' : 'overwrite'}) → ${action.filePath}`);
      return;
    }

    case 'move_file': {
      if (!action.sourcePath || !action.destPath) throw new Error('move_file: source and destination paths required');
      const destDir = path.dirname(action.destPath);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      fs.renameSync(action.sourcePath, action.destPath);
      console.log(`[AutomationEngine] move_file → ${action.sourcePath} → ${action.destPath}`);
      return;
    }

    case 'copy_file': {
      if (!action.sourcePath || !action.destPath) throw new Error('copy_file: source and destination paths required');
      const destDir = path.dirname(action.destPath);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(action.sourcePath, action.destPath);
      console.log(`[AutomationEngine] copy_file → ${action.sourcePath} → ${action.destPath}`);
      return;
    }

    case 'delete_file': {
      if (!action.filePath) throw new Error('delete_file: no file path provided');
      fs.unlinkSync(action.filePath);
      console.log(`[AutomationEngine] delete_file → ${action.filePath}`);
      return;
    }

    case 'create_folder': {
      if (!action.path) throw new Error('create_folder: no path provided');
      fs.mkdirSync(action.path, { recursive: true });
      console.log(`[AutomationEngine] create_folder → ${action.path}`);
      return;
    }

    case 'lock_screen': {
      if (process.platform === 'darwin') {
        exec('pmset displaysleepnow');
      } else if (process.platform === 'win32') {
        exec('rundll32.exe user32.dll,LockWorkStation');
      } else {
        exec('xdg-screensaver lock 2>/dev/null || gnome-screensaver-command -l 2>/dev/null || loginctl lock-session');
      }
      console.log('[AutomationEngine] lock_screen');
      return;
    }

    case 'http_request': {
      if (!action.url) throw new Error('http_request: no URL provided');
      const method = (action.method || 'GET').toUpperCase();
      const headers = {};

      // Parse "Key: Value" headers (one per line)
      if (action.headers) {
        String(action.headers).split('\n').forEach(line => {
          const idx = line.indexOf(':');
          if (idx > 0) {
            const key = line.slice(0, idx).trim();
            const val = line.slice(idx + 1).trim();
            if (key) headers[key] = val;
          }
        });
      }
      if (!headers['Content-Type'] && action.body) headers['Content-Type'] = 'application/json';

      const opts = { method, headers };
      if (!['GET', 'HEAD'].includes(method) && action.body) opts.body = action.body;

      try {
        const res = await fetch(action.url, opts);
        console.log(`[AutomationEngine] http_request → ${method} ${action.url} ${res.status}`);
        if (action.notify) {
          sendNotification(
            `🌐 ${method} ${res.ok ? '✅' : '❌'} ${res.status}`,
            action.url,
          );
        }
      } catch (err) {
        if (action.notify) sendNotification('🌐 HTTP Request Failed', err.message);
        throw err;
      }
      return;
    }

    /* ══════════════════════════════════════════
       GMAIL ACTIONS
    ══════════════════════════════════════════ */

    case 'gmail_send_email': {
      const creds = connectorEngine?.getCredentials('gmail');
      if (!creds?.accessToken) throw new Error('Gmail not connected — connect in Settings → Connectors');
      await GmailAPI.sendEmail(
        creds,
        action.to,
        action.subject,
        action.body ?? '',
        action.cc  ?? '',
        action.bcc ?? '',
      );
      console.log(`[AutomationEngine] gmail_send_email → ${action.to}`);
      return;
    }

    case 'gmail_get_brief': {
      const creds = connectorEngine?.getCredentials('gmail');
      if (!creds?.accessToken) throw new Error('Gmail not connected');
      const brief = await GmailAPI.getEmailBrief(creds, action.maxResults ?? 10);
      const preview = brief.emails
        ? brief.emails.slice(0, 3).map(e => e.subject).filter(Boolean).join(' · ')
        : '';
      sendNotification(
        `📬 Gmail — ${brief.count} unread`,
        preview || 'No unread emails.',
      );
      return;
    }

    case 'gmail_get_unread_count': {
      const creds = connectorEngine?.getCredentials('gmail');
      if (!creds?.accessToken) throw new Error('Gmail not connected');
      const brief = await GmailAPI.getEmailBrief(creds, 100);
      sendNotification(
        `📬 Gmail: ${brief.count} unread email${brief.count !== 1 ? 's' : ''}`,
        brief.count === 0 ? 'Inbox is clear! 🎉' : `You have ${brief.count} unread emails.`,
      );
      return;
    }

    case 'gmail_search_notify': {
      const creds = connectorEngine?.getCredentials('gmail');
      if (!creds?.accessToken) throw new Error('Gmail not connected');
      if (!action.query) throw new Error('gmail_search_notify: no query provided');
      const emails = await GmailAPI.searchEmails(creds, action.query, action.maxResults ?? 5);
      const count = emails.length;
      const subjects = emails.slice(0, 3).map(e => e.subject).filter(Boolean).join(' · ');
      sendNotification(
        `🔍 "${action.query}" — ${count} result${count !== 1 ? 's' : ''}`,
        subjects || 'No matching emails.',
      );
      return;
    }

    /* ══════════════════════════════════════════
       GITHUB ACTIONS
    ══════════════════════════════════════════ */

    case 'github_open_repo': {
      const owner = action.owner?.trim();
      const repo  = action.repo?.trim();
      if (!owner || !repo) throw new Error('github_open_repo: owner and repo are required');
      return openSite(`https://github.com/${owner}/${repo}`);
    }

    case 'github_check_prs': {
      const creds = connectorEngine?.getCredentials('github');
      if (!creds?.token) throw new Error('GitHub not connected');
      const state  = action.state || 'open';
      const prs    = await GithubAPI.getPullRequests(creds, action.owner, action.repo, state);
      const titles = prs.slice(0, 3).map(p => `• ${p.title}`).join('\n');
      sendNotification(
        `🔀 ${action.owner}/${action.repo} — ${prs.length} ${state} PR${prs.length !== 1 ? 's' : ''}`,
        titles || 'No pull requests.',
      );
      return;
    }

    case 'github_check_issues': {
      const creds = connectorEngine?.getCredentials('github');
      if (!creds?.token) throw new Error('GitHub not connected');
      const state  = action.state || 'open';
      const issues = await GithubAPI.getIssues(creds, action.owner, action.repo, state);
      const titles = issues.slice(0, 3).map(i => `• ${i.title}`).join('\n');
      sendNotification(
        `🐛 ${action.owner}/${action.repo} — ${issues.length} ${state} issue${issues.length !== 1 ? 's' : ''}`,
        titles || 'No issues.',
      );
      return;
    }

    case 'github_check_commits': {
      const creds   = connectorEngine?.getCredentials('github');
      if (!creds?.token) throw new Error('GitHub not connected');
      const commits = await GithubAPI.getCommits(creds, action.owner, action.repo, action.maxResults ?? 5);
      const msgs    = commits.slice(0, 3).map(c => `• ${c.commit.message.split('\n')[0]}`).join('\n');
      sendNotification(
        `📝 ${action.owner}/${action.repo} — ${commits.length} recent commit${commits.length !== 1 ? 's' : ''}`,
        msgs || 'No commits found.',
      );
      return;
    }

    case 'github_check_releases': {
      const creds   = connectorEngine?.getCredentials('github');
      if (!creds?.token) throw new Error('GitHub not connected');
      const release = await GithubAPI.getLatestRelease(creds, action.owner, action.repo);
      const publishedAt = release.published_at
        ? new Date(release.published_at).toLocaleDateString()
        : '';
      sendNotification(
        `🚀 ${action.owner}/${action.repo} — ${release.tag_name}`,
        (release.name || release.tag_name) + (publishedAt ? ` · ${publishedAt}` : ''),
      );
      return;
    }

    case 'github_check_notifs': {
      const creds  = connectorEngine?.getCredentials('github');
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

    case 'github_create_issue': {
      const creds  = connectorEngine?.getCredentials('github');
      if (!creds?.token) throw new Error('GitHub not connected');
      if (!action.issueTitle) throw new Error('github_create_issue: issue title required');
      const labels = action.labels
        ? String(action.labels).split(',').map(l => l.trim()).filter(Boolean)
        : [];
      const issue = await GithubAPI.createIssue(
        creds,
        action.owner,
        action.repo,
        action.issueTitle,
        action.issueBody ?? '',
        labels,
      );
      sendNotification(
        `✅ Issue created: #${issue.number}`,
        `${issue.title} — ${action.owner}/${action.repo}`,
      );
      return;
    }

    default:
      console.warn(`[AutomationEngine] Unknown action type: "${action.type}"`);
  }
}


// ─────────────────────────────────────────────
//  AUTOMATION ENGINE CLASS
// ─────────────────────────────────────────────

export class AutomationEngine {
  constructor(automationsFilePath, connectorEngine = null) {
    this.filePath        = automationsFilePath;
    this.connectorEngine = connectorEngine;
    this.automations     = [];
    this._ticker         = null;
  }

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

  /**
   * Clear all run history AND lastRun from every automation on disk.
   * Called by the Events page "Clear" button.
   */
  clearAllHistory() {
    this._load();
    for (const auto of this.automations) {
      auto.history = [];
      auto.lastRun = null;
    }
    this._persist();
    console.log('[AutomationEngine] All automation history cleared.');
  }

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

    const entry = {
      timestamp: new Date().toISOString(),
      status:    'success',
      summary:   '',
      error:     null,
    };

    try {
      const actionTypes = [];
      for (const action of (automation.actions ?? [])) {
        await runAction(action, this.connectorEngine);
        if (action.type) actionTypes.push(action.type);
      }
      entry.summary = actionTypes.length
        ? `Ran: ${actionTypes.join(', ')}`
        : 'Automation executed (no actions)';
      automation.lastRun = entry.timestamp;
    } catch (err) {
      entry.status  = 'error';
      entry.error   = err.message;
      entry.summary = `Error: ${err.message}`;
      console.error(`[AutomationEngine] Error in "${automation.name}":`, err);
    }

    // Persist history
    if (!Array.isArray(automation.history)) automation.history = [];
    automation.history.unshift(entry);
    if (automation.history.length > 30) automation.history = automation.history.slice(0, 30);
    this._persist();
  }
}
