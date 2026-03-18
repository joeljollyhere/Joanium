// ─────────────────────────────────────────────
//  openworld — Public/Assets/Scripts/Features/Chat/ToolExecutor.js
//  Executes a tool call decided by the AI and returns a result string.
// ─────────────────────────────────────────────

/**
 * Execute a single tool call.
 * @param {string} toolName
 * @param {object} params
 * @param {function} onStage  - callback(message) to update the UI during execution
 * @returns {Promise<string>} - a plain-text result to feed back to the AI
 */
export async function executeTool(toolName, params, onStage = () => {}) {
  switch (toolName) {

    /* ── Gmail ── */

    case 'gmail_send_email': {
      const { to, subject, body } = params;
      if (!to || !subject || !body) throw new Error('Missing required params: to, subject, body');
      onStage(`📤 Sending email to **${to}**…`);
      const res = await window.electronAPI?.gmailSend?.(to, subject, body);
      if (!res?.ok) throw new Error(res?.error ?? 'Failed to send email');
      return `Email sent successfully to ${to} with subject "${subject}".`;
    }

    case 'gmail_read_inbox': {
      const maxResults = params.maxResults ?? 15;
      onStage(`📬 Connecting to Gmail…`);
      onStage(`📥 Fetching unread emails…`);
      const res = await window.electronAPI?.gmailGetBrief?.(maxResults);
      if (!res?.ok) throw new Error(res?.error ?? 'Gmail not connected');
      onStage(`📖 Reading ${res.count} email${res.count !== 1 ? 's' : ''}…`);
      if (res.count === 0) return 'Inbox is empty — no unread emails.';
      return `Found ${res.count} unread email(s):\n\n${res.text}`;
    }

    case 'gmail_search_emails': {
      const { query, maxResults = 10 } = params;
      if (!query) throw new Error('Missing required param: query');
      onStage(`🔍 Searching Gmail for **"${query}"**…`);
      const res = await window.electronAPI?.gmailSearch?.(query, maxResults);
      if (!res?.ok) throw new Error(res?.error ?? 'Gmail error');
      if (!res.emails?.length) return `No emails found matching "${query}".`;
      const lines = res.emails.map((e, i) =>
        `${i + 1}. Subject: "${e.subject}" | From: ${e.from}\n   Preview: ${e.snippet}`
      ).join('\n\n');
      return `Found ${res.emails.length} email(s) matching "${query}":\n\n${lines}`;
    }

    /* ── GitHub ── */

    case 'github_list_repos': {
      onStage(`🐙 Connecting to GitHub…`);
      onStage(`📦 Fetching repositories…`);
      const res = await window.electronAPI?.githubGetRepos?.();
      if (!res?.ok) throw new Error(res?.error ?? 'GitHub not connected');
      const lines = res.repos.slice(0, 20).map(r =>
        `- ${r.full_name}: ${r.description || 'No description'} [${r.language || 'unknown'}] ⭐${r.stargazers_count}`
      ).join('\n');
      return `User has ${res.repos.length} repos (showing top 20):\n\n${lines}`;
    }

    case 'github_get_issues': {
      const { owner, repo } = params;
      if (!owner || !repo) throw new Error('Missing required params: owner, repo');
      onStage(`🐛 Fetching issues from **${owner}/${repo}**…`);
      const res = await window.electronAPI?.githubGetIssues?.(owner, repo);
      if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
      if (!res.issues?.length) return `No open issues in ${owner}/${repo}.`;
      const lines = res.issues.map(i => `#${i.number}: ${i.title} (by ${i.user?.login})`).join('\n');
      return `${res.issues.length} open issue(s) in ${owner}/${repo}:\n\n${lines}`;
    }

    case 'github_get_pull_requests': {
      const { owner, repo } = params;
      if (!owner || !repo) throw new Error('Missing required params: owner, repo');
      onStage(`🔀 Fetching pull requests from **${owner}/${repo}**…`);
      const res = await window.electronAPI?.githubGetPRs?.(owner, repo);
      if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
      if (!res.prs?.length) return `No open pull requests in ${owner}/${repo}.`;
      const lines = res.prs.map(p => `#${p.number}: ${p.title} (by ${p.user?.login})`).join('\n');
      return `${res.prs.length} open PR(s) in ${owner}/${repo}:\n\n${lines}`;
    }

    case 'github_get_file': {
      const { owner, repo, filePath } = params;
      if (!owner || !repo || !filePath) throw new Error('Missing required params: owner, repo, filePath');
      onStage(`📂 Loading \`${filePath}\` from **${owner}/${repo}**…`);
      const res = await window.electronAPI?.githubGetFile?.(owner, repo, filePath);
      if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
      const preview = res.content.length > 4000
        ? res.content.slice(0, 4000) + '\n...(truncated)'
        : res.content;
      return `Contents of ${res.path} from ${owner}/${repo}:\n\`\`\`\n${preview}\n\`\`\``;
    }

    case 'github_get_file_tree': {
      const { owner, repo } = params;
      if (!owner || !repo) throw new Error('Missing required params: owner, repo');
      onStage(`🌲 Reading file tree of **${owner}/${repo}**…`);
      const res = await window.electronAPI?.githubGetTree?.(owner, repo);
      if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
      const blobs = res.tree.filter(f => f.type === 'blob');
      const files = blobs.slice(0, 100).map(f => f.path).join('\n');
      return `File tree of ${owner}/${repo} (${blobs.length} files):\n\n${files}`;
    }

    case 'github_get_notifications': {
      onStage(`🔔 Fetching GitHub notifications…`);
      const res = await window.electronAPI?.githubGetNotifications?.();
      if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
      const n = res.notifications ?? [];
      if (!n.length) return 'No unread GitHub notifications.';
      const lines = n.slice(0, 10).map((n2, i) =>
        `${i + 1}. ${n2.subject?.title} in ${n2.repository?.full_name}`
      ).join('\n');
      return `${n.length} unread notification(s):\n\n${lines}`;
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
