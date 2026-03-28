import fs   from 'fs';
import path from 'path';
import { exec } from 'child_process';

// Automation Packages
import * as GmailAPI  from '../Integrations/Gmail.js';
import * as GithubAPI from '../Integrations/Github.js';
import { openSite }                           from '../Actions/Site.js';
import { openFolder }                         from '../Actions/Folder.js';
import { openTerminalAtPath, openTerminalAndRun } from '../Actions/Terminal.js';
import { openApp }                            from '../Actions/Application.js';
import { sendNotification }                   from '../Actions/Notification.js';
import { copyToClipboard }                    from '../Actions/Clipboard.js';
import { writeFile }                          from '../Actions/File.js';

// Helpers
import { shouldRunNow } from '../Scheduling/Scheduling.js';


// ─────────────────────────────────────────────
//  ACTION DISPATCHER
// ─────────────────────────────────────────────

export async function runAction(action, connectorEngine = null) {
  if (!action?.type) return;

  switch (action.type) {
    // System / OS
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
      return;
    }

    case 'move_file': {
      if (!action.sourcePath || !action.destPath) throw new Error('move_file: source and destination paths required');
      const destDir = path.dirname(action.destPath);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      fs.renameSync(action.sourcePath, action.destPath);
      return;
    }

    case 'copy_file': {
      if (!action.sourcePath || !action.destPath) throw new Error('copy_file: source and destination paths required');
      const destDir = path.dirname(action.destPath);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(action.sourcePath, action.destPath);
      return;
    }

    case 'delete_file': {
      if (!action.filePath) throw new Error('delete_file: no file path provided');
      fs.unlinkSync(action.filePath);
      return;
    }

    case 'create_folder': {
      if (!action.path) throw new Error('create_folder: no path provided');
      fs.mkdirSync(action.path, { recursive: true });
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
      return;
    }

    case 'http_request': {
      if (!action.url) throw new Error('http_request: no URL provided');
      const method = (action.method || 'GET').toUpperCase();
      const headers = {};

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
    // Gmail
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

    case 'gmail_reply': {
      const creds = connectorEngine?.getCredentials('gmail');
      if (!creds?.accessToken) throw new Error('Gmail not connected');
      if (!action.messageId) throw new Error('gmail_reply: messageId required');
      if (!action.body)      throw new Error('gmail_reply: body required');
      await GmailAPI.replyToEmail(creds, action.messageId, action.body);
      sendNotification('📤 Reply sent', `Replied to message ${action.messageId}`);
      return;
    }

    case 'gmail_forward': {
      const creds = connectorEngine?.getCredentials('gmail');
      if (!creds?.accessToken) throw new Error('Gmail not connected');
      if (!action.messageId) throw new Error('gmail_forward: messageId required');
      if (!action.forwardTo) throw new Error('gmail_forward: forwardTo required');
      await GmailAPI.forwardEmail(creds, action.messageId, action.forwardTo, action.note ?? '');
      sendNotification('📤 Email forwarded', `Forwarded to ${action.forwardTo}`);
      return;
    }

    case 'gmail_mark_all_read': {
      const creds = connectorEngine?.getCredentials('gmail');
      if (!creds?.accessToken) throw new Error('Gmail not connected');
      const count = await GmailAPI.markAllRead(creds);
      sendNotification(
        count === 0 ? '📭 Already all read!' : `✅ Marked ${count} emails as read`,
        count === 0 ? 'No unread emails found.' : `${count} messages marked as read.`,
      );
      return;
    }

    case 'gmail_archive_read': {
      const creds = connectorEngine?.getCredentials('gmail');
      if (!creds?.accessToken) throw new Error('Gmail not connected');
      const count = await GmailAPI.archiveReadEmails(creds, action.maxResults ?? 100);
      sendNotification(
        count === 0 ? '📭 Inbox already clean' : `🗃️ Archived ${count} emails`,
        count === 0 ? 'No read emails in inbox.' : `Moved ${count} read emails out of inbox.`,
      );
      return;
    }

    case 'gmail_trash_by_query': {
      const creds = connectorEngine?.getCredentials('gmail');
      if (!creds?.accessToken) throw new Error('Gmail not connected');
      if (!action.query) throw new Error('gmail_trash_by_query: query required');
      const count = await GmailAPI.trashEmailsByQuery(creds, action.query, action.maxResults ?? 50);
      sendNotification(
        `🗑️ Trashed ${count} email${count !== 1 ? 's' : ''}`,
        `Query: "${action.query}"`,
      );
      return;
    }

    case 'gmail_create_draft': {
      const creds = connectorEngine?.getCredentials('gmail');
      if (!creds?.accessToken) throw new Error('Gmail not connected');
      if (!action.to || !action.subject) throw new Error('gmail_create_draft: to and subject required');
      await GmailAPI.createDraft(creds, action.to, action.subject, action.body ?? '', action.cc ?? '');
      sendNotification('📝 Draft saved', `To: ${action.to} · Subject: ${action.subject}`);
      return;
    }

    case 'gmail_inbox_stats': {
      const creds = connectorEngine?.getCredentials('gmail');
      if (!creds?.accessToken) throw new Error('Gmail not connected');
      const stats = await GmailAPI.getInboxStats(creds);
      sendNotification(
        `📊 Inbox: ${stats.unreadEstimate} unread`,
        `Inbox: ~${stats.inboxEstimate} msgs · Total: ${stats.totalMessages} · Threads: ${stats.totalThreads}`,
      );
      return;
    }

    case 'gmail_label_emails': {
      const creds = connectorEngine?.getCredentials('gmail');
      if (!creds?.accessToken) throw new Error('Gmail not connected');
      if (!action.query)     throw new Error('gmail_label_emails: query required');
      if (!action.labelName) throw new Error('gmail_label_emails: labelName required');

      const labelId = await GmailAPI.getLabelId(creds, action.labelName);
      if (!labelId) throw new Error(`gmail_label_emails: label "${action.labelName}" not found in Gmail`);

      const emails = await GmailAPI.searchEmails(creds, action.query, action.maxResults ?? 20);
      if (!emails.length) {
        sendNotification('🏷️ No emails to label', `Query: "${action.query}"`);
        return;
      }

      await Promise.all(emails.map(e =>
        GmailAPI.modifyMessage(creds, e.id, { addLabels: [labelId] })
      ));

      sendNotification(
        `🏷️ Labeled ${emails.length} email${emails.length !== 1 ? 's' : ''}`,
        `Label: ${action.labelName} · Query: "${action.query}"`,
      );
      return;
    }

    // Github
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

    case 'github_repo_stats': {
      const creds = connectorEngine?.getCredentials('github');
      if (!creds?.token) throw new Error('GitHub not connected');
      if (!action.owner || !action.repo) throw new Error('github_repo_stats: owner and repo required');
      const stats = await GithubAPI.getRepoStats(creds, action.owner, action.repo);
      sendNotification(
        `📊 ${stats.fullName}`,
        `⭐ ${stats.stars} · 🍴 ${stats.forks} · 🐛 ${stats.openIssues} open issues · ${stats.language}`,
      );
      return;
    }

    case 'github_star_repo': {
      const creds = connectorEngine?.getCredentials('github');
      if (!creds?.token) throw new Error('GitHub not connected');
      if (!action.owner || !action.repo) throw new Error('github_star_repo: owner and repo required');
      await GithubAPI.starRepo(creds, action.owner, action.repo);
      sendNotification(`⭐ Starred ${action.owner}/${action.repo}`, '');
      return;
    }

    case 'github_create_pr': {
      const creds = connectorEngine?.getCredentials('github');
      if (!creds?.token) throw new Error('GitHub not connected');
      if (!action.owner || !action.repo) throw new Error('github_create_pr: owner and repo required');
      if (!action.title || !action.head || !action.base)
        throw new Error('github_create_pr: title, head, and base are required');
      const pr = await GithubAPI.createPR(creds, action.owner, action.repo, {
        title: action.title,
        body:  action.body  ?? '',
        head:  action.head,
        base:  action.base,
        draft: action.draft ?? false,
      });
      sendNotification(
        `🔀 PR created: #${pr.number}`,
        `${pr.title} · ${action.owner}/${action.repo}`,
      );
      return;
    }

    case 'github_merge_pr': {
      const creds = connectorEngine?.getCredentials('github');
      if (!creds?.token) throw new Error('GitHub not connected');
      if (!action.owner || !action.repo) throw new Error('github_merge_pr: owner and repo required');
      if (!action.prNumber) throw new Error('github_merge_pr: prNumber required');
      await GithubAPI.mergePR(
        creds,
        action.owner,
        action.repo,
        action.prNumber,
        action.mergeMethod  ?? 'merge',
        action.commitTitle  ?? '',
      );
      sendNotification(
        `✅ PR #${action.prNumber} merged`,
        `${action.owner}/${action.repo} · ${action.mergeMethod ?? 'merge'}`,
      );
      return;
    }

    case 'github_close_issue': {
      const creds = connectorEngine?.getCredentials('github');
      if (!creds?.token) throw new Error('GitHub not connected');
      if (!action.owner || !action.repo) throw new Error('github_close_issue: owner and repo required');
      if (!action.issueNumber) throw new Error('github_close_issue: issueNumber required');
      await GithubAPI.closeIssue(creds, action.owner, action.repo, action.issueNumber, action.reason ?? 'completed');
      sendNotification(
        `🔒 Issue #${action.issueNumber} closed`,
        `${action.owner}/${action.repo} · ${action.reason ?? 'completed'}`,
      );
      return;
    }

    case 'github_comment_issue': {
      const creds = connectorEngine?.getCredentials('github');
      if (!creds?.token) throw new Error('GitHub not connected');
      if (!action.owner || !action.repo) throw new Error('github_comment_issue: owner and repo required');
      if (!action.issueNumber) throw new Error('github_comment_issue: issueNumber required');
      if (!action.body)        throw new Error('github_comment_issue: body required');
      await GithubAPI.addIssueComment(creds, action.owner, action.repo, action.issueNumber, action.body);
      sendNotification(
        `💬 Comment added to #${action.issueNumber}`,
        `${action.owner}/${action.repo}`,
      );
      return;
    }

    case 'github_add_labels': {
      const creds = connectorEngine?.getCredentials('github');
      if (!creds?.token) throw new Error('GitHub not connected');
      if (!action.owner || !action.repo) throw new Error('github_add_labels: owner and repo required');
      if (!action.issueNumber) throw new Error('github_add_labels: issueNumber required');
      if (!action.labels)      throw new Error('github_add_labels: labels required');
      const labels = String(action.labels).split(',').map(l => l.trim()).filter(Boolean);
      await GithubAPI.addLabels(creds, action.owner, action.repo, action.issueNumber, labels);
      sendNotification(
        `🏷️ Labels added to #${action.issueNumber}`,
        labels.join(', '),
      );
      return;
    }

    case 'github_assign': {
      const creds = connectorEngine?.getCredentials('github');
      if (!creds?.token) throw new Error('GitHub not connected');
      if (!action.owner || !action.repo) throw new Error('github_assign: owner and repo required');
      if (!action.issueNumber) throw new Error('github_assign: issueNumber required');
      if (!action.assignees)   throw new Error('github_assign: assignees required');
      const assignees = String(action.assignees).split(',').map(a => a.trim()).filter(Boolean);
      await GithubAPI.addAssignees(creds, action.owner, action.repo, action.issueNumber, assignees);
      sendNotification(
        `👤 Assigned #${action.issueNumber}`,
        `${assignees.join(', ')} · ${action.owner}/${action.repo}`,
      );
      return;
    }

    case 'github_mark_notifs_read': {
      const creds = connectorEngine?.getCredentials('github');
      if (!creds?.token) throw new Error('GitHub not connected');
      await GithubAPI.markAllNotificationsRead(creds);
      sendNotification('✅ GitHub notifications cleared', 'All notifications marked as read.');
      return;
    }

    case 'github_trigger_workflow': {
      const creds = connectorEngine?.getCredentials('github');
      if (!creds?.token) throw new Error('GitHub not connected');
      if (!action.owner || !action.repo) throw new Error('github_trigger_workflow: owner and repo required');
      if (!action.workflowId) throw new Error('github_trigger_workflow: workflowId required');
      await GithubAPI.triggerWorkflow(
        creds,
        action.owner,
        action.repo,
        action.workflowId,
        action.ref    ?? 'main',
        action.inputs ?? {},
      );
      sendNotification(
        `⚡ Workflow triggered`,
        `${action.workflowId} on ${action.ref ?? 'main'} · ${action.owner}/${action.repo}`,
      );
      return;
    }

    case 'github_workflow_status': {
      const creds = connectorEngine?.getCredentials('github');
      if (!creds?.token) throw new Error('GitHub not connected');
      if (!action.owner || !action.repo) throw new Error('github_workflow_status: owner and repo required');
      if (!action.workflowId) throw new Error('github_workflow_status: workflowId required');
      const run = await GithubAPI.getLatestWorkflowRun(creds, action.owner, action.repo, action.workflowId, action.branch ?? '');
      if (!run) {
        sendNotification(`⚙️ ${action.workflowId}`, 'No runs found.');
        return;
      }
      const statusEmoji = { completed: '✅', in_progress: '🔄', queued: '⏳', failure: '❌' }[run.status] ?? '⚙️';
      const conclusion  = run.conclusion ? ` · ${run.conclusion}` : '';
      sendNotification(
        `${statusEmoji} ${action.workflowId} — ${run.status}${conclusion}`,
        `Branch: ${run.head_branch} · ${action.owner}/${action.repo}`,
      );
      return;
    }

    case 'github_create_gist': {
      const creds = connectorEngine?.getCredentials('github');
      if (!creds?.token) throw new Error('GitHub not connected');
      if (!action.filename) throw new Error('github_create_gist: filename required');
      if (!action.content)  throw new Error('github_create_gist: content required');
      const files = { [action.filename]: { content: action.content } };
      const gist  = await GithubAPI.createGist(creds, action.description ?? '', files, action.isPublic ?? false);
      sendNotification(
        `📋 Gist created`,
        gist.html_url ?? `${action.filename} · ${action.isPublic ? 'public' : 'secret'}`,
      );
      if (action.openInBrowser && gist.html_url) await openSite(gist.html_url);
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
    this._running        = new Set();
  }

  start() {
    this._load();
    this._runStartupAutomations();
    this._ticker = setInterval(() => this._checkScheduled(), 60_000);
  }

  stop() {
    if (this._ticker) { clearInterval(this._ticker); this._ticker = null; }
  }

  reload() {
    this._load();
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

  clearAllHistory() {
    this._load();
    for (const auto of this.automations) {
      auto.history = [];
      auto.lastRun = null;
    }
    this._persist();
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
      if (a.enabled && !this._running.has(a.id) && shouldRunNow(a, now)) this._execute(a);
    }
  }

  async _execute(automation) {
    const automationId = automation.id;
    this._running.add(automationId);

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
    } catch (err) {
      entry.status  = 'error';
      entry.error   = err.message;
      entry.summary = `Error: ${err.message}`;
      console.error(`[AutomationEngine] Error in "${automation.name}":`, err);
    } finally {
      this._running.delete(automationId);
    }

    const live = this.automations.find(a => a.id === automationId);
    if (live) {
      if (!Array.isArray(live.history)) live.history = [];
      live.history.unshift(entry);
      if (live.history.length > 30) live.history = live.history.slice(0, 30);
      live.lastRun = entry.timestamp;
      this._persist();
    } else {
      console.warn(`[AutomationEngine] Automation ${automationId} not found after run — was it deleted?`);
    }
  }
}
