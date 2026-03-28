export const ACTION_META = {
  // ── System ──────────────────────────────────────────────────────────────
  open_site:            { label: '🌐 Open website',             fields: ['url'],                              group: 'System' },
  open_multiple_sites:  { label: '🌐 Open multiple websites',   fields: ['urls'],                             group: 'System' },
  open_folder:          { label: '📁 Open folder',              fields: ['path'],                             group: 'System' },
  run_command:          { label: '⚡ Run command',               fields: ['command'],                          group: 'System' },
  run_script:           { label: '📜 Run script file',          fields: ['scriptPath', 'args'],               group: 'System' },
  open_app:             { label: '🚀 Open app',                 fields: ['appPath'],                          group: 'System' },
  send_notification:    { label: '🔔 Send notification',        fields: ['notifTitle', 'notifBody'],           group: 'System' },
  copy_to_clipboard:    { label: '📋 Copy to clipboard',        fields: ['text'],                             group: 'System' },
  write_file:           { label: '📝 Write to file',            fields: ['filePath', 'content'],              group: 'System' },
  move_file:            { label: '📦 Move / rename file',       fields: ['sourcePath', 'destPath'],           group: 'System' },
  copy_file:            { label: '🗂️ Copy file',                fields: ['sourcePath', 'destPath'],           group: 'System' },
  delete_file:          { label: '🗑️ Delete file',              fields: ['filePath'],                         group: 'System' },
  create_folder:        { label: '📂 Create folder',            fields: ['path'],                             group: 'System' },
  lock_screen:          { label: '🔒 Lock screen',              fields: [],                                   group: 'System' },
  http_request:         { label: '🌍 HTTP request / webhook',   fields: ['url', 'httpMethod'],                group: 'System' },

  // ── Gmail ────────────────────────────────────────────────────────────────
  gmail_send_email:     { label: '📧 Send email',               fields: ['to', 'subject', 'gmailBody'],       group: 'Gmail' },
  gmail_get_brief:      { label: '📧 Email brief (notif)',      fields: ['maxResults'],                       group: 'Gmail' },
  gmail_get_unread_count: { label: '📧 Unread count notif',     fields: [],                                   group: 'Gmail' },
  gmail_search_notify:  { label: '📧 Search & notify',          fields: ['query', 'maxResults'],              group: 'Gmail' },
  gmail_reply:          { label: '↩️ Reply to email',           fields: ['messageId', 'gmailBody'],           group: 'Gmail' },
  gmail_forward:        { label: '📤 Forward email',            fields: ['messageId', 'forwardTo'],           group: 'Gmail' },
  gmail_create_draft:   { label: '📝 Create draft',             fields: ['to', 'subject', 'gmailBody'],       group: 'Gmail' },
  gmail_mark_all_read:  { label: '✅ Mark all as read',         fields: [],                                   group: 'Gmail' },
  gmail_archive_read:   { label: '🗃️ Archive read emails',      fields: ['maxResults'],                       group: 'Gmail' },
  gmail_trash_by_query: { label: '🗑️ Trash emails by query',    fields: ['query', 'maxResults'],              group: 'Gmail' },
  gmail_inbox_stats:    { label: '📊 Inbox stats (notif)',      fields: [],                                   group: 'Gmail' },
  gmail_label_emails:   { label: '🏷️ Label emails by query',    fields: ['query', 'labelName', 'maxResults'], group: 'Gmail' },

  // ── GitHub ───────────────────────────────────────────────────────────────
  github_open_repo:         { label: '🐙 Open repo in browser',     fields: ['owner', 'repo'],                                   group: 'GitHub' },
  github_check_prs:         { label: '🐙 Check pull requests',      fields: ['owner', 'repo'],                                   group: 'GitHub' },
  github_check_issues:      { label: '🐙 Check issues',             fields: ['owner', 'repo'],                                   group: 'GitHub' },
  github_check_commits:     { label: '🐙 Check recent commits',     fields: ['owner', 'repo', 'maxResults'],                     group: 'GitHub' },
  github_check_releases:    { label: '🐙 Check latest release',     fields: ['owner', 'repo'],                                   group: 'GitHub' },
  github_check_notifs:      { label: '🐙 GitHub notifications',     fields: [],                                                  group: 'GitHub' },
  github_create_issue:      { label: '🐙 Create issue',             fields: ['owner', 'repo', 'issueTitle', 'issueBody', 'labels'], group: 'GitHub' },
  github_repo_stats:        { label: '📊 Repo stats (notif)',       fields: ['owner', 'repo'],                                   group: 'GitHub' },
  github_star_repo:         { label: '⭐ Star repository',           fields: ['owner', 'repo'],                                   group: 'GitHub' },
  github_create_pr:         { label: '🔀 Create pull request',      fields: ['owner', 'repo', 'prTitle', 'prHead', 'prBase'],    group: 'GitHub' },
  github_merge_pr:          { label: '✅ Merge pull request',        fields: ['owner', 'repo', 'prNumber'],                      group: 'GitHub' },
  github_close_issue:       { label: '🔒 Close issue',              fields: ['owner', 'repo', 'issueNumber'],                    group: 'GitHub' },
  github_comment_issue:     { label: '💬 Comment on issue / PR',    fields: ['owner', 'repo', 'issueNumber', 'issueBody'],       group: 'GitHub' },
  github_add_labels:        { label: '🏷️ Add labels to issue / PR', fields: ['owner', 'repo', 'issueNumber', 'labels'],          group: 'GitHub' },
  github_assign:            { label: '👤 Assign issue / PR',         fields: ['owner', 'repo', 'issueNumber', 'assignees'],       group: 'GitHub' },
  github_mark_notifs_read:  { label: '✅ Mark all notifs read',      fields: [],                                                  group: 'GitHub' },
  github_trigger_workflow:  { label: '⚡ Trigger workflow',           fields: ['owner', 'repo', 'workflowId', 'workflowRef'],     group: 'GitHub' },
  github_workflow_status:   { label: '🔄 Workflow run status',       fields: ['owner', 'repo', 'workflowId'],                    group: 'GitHub' },
  github_create_gist:       { label: '📋 Create Gist',              fields: ['gistFilename', 'content'],                         group: 'GitHub' },
};

export const FIELD_META = {
  // System
  url:            { placeholder: 'https://example.com',                      textarea: false },
  urls:           { placeholder: 'https://example.com\nhttps://github.com\none per line…', textarea: true },
  path:           { placeholder: '/Users/you/Documents or C:\\Users\\you',    textarea: false },
  command:        { placeholder: 'npm run build',                             textarea: false },
  scriptPath:     { placeholder: '/Users/you/scripts/backup.sh  or  script.py', textarea: false },
  args:           { placeholder: '--verbose --output /tmp (optional)',         textarea: false },
  appPath:        { placeholder: '/Applications/VS Code.app  or  C:\\...\\code.exe', textarea: false },
  notifTitle:     { placeholder: 'Notification title',                        textarea: false },
  notifBody:      { placeholder: 'Notification body (optional)',               textarea: false },
  text:           { placeholder: 'Text to copy to clipboard…',                textarea: false },
  filePath:       { placeholder: '/Users/you/Desktop/output.txt',             textarea: false },
  content:        { placeholder: 'File content…',                             textarea: true  },
  sourcePath:     { placeholder: '/Users/you/file.txt',                       textarea: false },
  destPath:       { placeholder: '/Users/you/moved/file.txt',                 textarea: false },
  httpMethod:     { type: 'select', options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'], textarea: false },
  httpHeaders:    { placeholder: 'Content-Type: application/json\nAuthorization: Bearer …', textarea: true },
  httpBody:       { placeholder: '{"key": "value"}  or  form=data&key=val',  textarea: true  },
  clickUrl:       { placeholder: 'https://open-this.com on notification click (optional)', textarea: false },
  terminalCommand: { placeholder: 'npm run dev  (leave blank to just open terminal)', textarea: false },

  // Gmail
  to:             { placeholder: 'recipient@example.com',                     textarea: false },
  cc:             { placeholder: 'cc@example.com, cc2@example.com (optional)', textarea: false },
  bcc:            { placeholder: 'bcc@example.com (optional)',                 textarea: false },
  subject:        { placeholder: 'Email subject',                              textarea: false },
  gmailBody:      { placeholder: 'Email body…',                               textarea: true  },
  maxResults:     { placeholder: '10',                                         textarea: false },
  query:          { placeholder: 'from:boss OR subject:urgent',               textarea: false },
  messageId:      { placeholder: 'Gmail message ID (from search results)',     textarea: false },
  forwardTo:      { placeholder: 'forward@example.com',                       textarea: false },
  labelName:      { placeholder: 'Label name (must exist in Gmail)',           textarea: false },

  // GitHub — shared
  owner:          { placeholder: 'github-username or org',                    textarea: false },
  repo:           { placeholder: 'repository-name',                           textarea: false },
  issueTitle:     { placeholder: 'Bug: something broke in v2.1',              textarea: false },
  issueBody:      { placeholder: 'Steps to reproduce…',                       textarea: true  },
  issueNumber:    { placeholder: 'e.g. 42',                                   textarea: false },
  labels:         { placeholder: 'bug, enhancement (comma-separated)',        textarea: false },
  assignees:      { placeholder: 'alice, bob (comma-separated usernames)',     textarea: false },

  // GitHub — PR
  prTitle:        { placeholder: 'feat: add new feature',                     textarea: false },
  prHead:         { placeholder: 'feature-branch (source branch)',            textarea: false },
  prBase:         { placeholder: 'main (target branch)',                      textarea: false },
  prNumber:       { placeholder: 'e.g. 12',                                   textarea: false },
  mergeMethod:    { type: 'select', options: ['merge', 'squash', 'rebase'],   textarea: false },

  // GitHub — workflow
  workflowId:     { placeholder: 'ci.yml or numeric workflow ID',             textarea: false },
  workflowRef:    { placeholder: 'main (branch or tag)',                      textarea: false },

  // GitHub — gist
  gistFilename:   { placeholder: 'snippet.js',                                textarea: false },
};

export const FIELD_LABELS = {
  // System
  url: 'URL', urls: 'URLs (one per line)', path: 'Folder path',
  command: 'Command', scriptPath: 'Script path', args: 'Arguments',
  appPath: 'App path', notifTitle: 'Title', notifBody: 'Body',
  text: 'Text', filePath: 'File path', content: 'Content',
  sourcePath: 'Source path', destPath: 'Destination path',
  httpMethod: 'Method', httpHeaders: 'Headers', httpBody: 'Request body',
  clickUrl: 'Open URL on click', terminalCommand: 'Then run (optional)',

  // Gmail
  to: 'To', cc: 'CC', bcc: 'BCC', subject: 'Subject', gmailBody: 'Body',
  maxResults: 'Max results', query: 'Search query',
  messageId: 'Message ID', forwardTo: 'Forward to', labelName: 'Label name',

  // GitHub
  owner: 'Owner / org', repo: 'Repository',
  issueTitle: 'Issue title', issueBody: 'Body', issueNumber: 'Issue / PR number',
  labels: 'Labels (comma-separated)', assignees: 'Assignees (comma-separated)',
  prTitle: 'PR title', prHead: 'Head branch', prBase: 'Base branch',
  prNumber: 'PR number', mergeMethod: 'Merge method',
  workflowId: 'Workflow file or ID', workflowRef: 'Ref (branch/tag)',
  gistFilename: 'Filename', content: 'Content',
};
