export const MAX_JOBS = 5;

export const DATA_SOURCE_TYPES = [
  // ── Email ─────────────────────────────────────────────────────────────────
  { value: 'gmail_inbox',       label: '📧 Gmail - Unread inbox',         group: 'Email' },
  { value: 'gmail_search',      label: '📧 Gmail - Search emails',        group: 'Email' },
  { value: 'gmail_inbox_stats', label: '📧 Gmail - Inbox stats',          group: 'Email' },  // NEW

  // ── GitHub ────────────────────────────────────────────────────────────────
  { value: 'github_notifications', label: '🐙 GitHub - Notifications',    group: 'GitHub' },
  { value: 'github_repos',         label: '🐙 GitHub - All my repos',     group: 'GitHub' },
  { value: 'github_prs',           label: '🐙 GitHub - Pull requests',    group: 'GitHub' },
  { value: 'github_issues',        label: '🐙 GitHub - Issues',           group: 'GitHub' },
  { value: 'github_commits',       label: '🐙 GitHub - Recent commits',   group: 'GitHub' },
  { value: 'github_releases',      label: '🚀 GitHub - Releases',         group: 'GitHub' },  // NEW
  { value: 'github_workflow_runs', label: '⚙️ GitHub - Workflow runs',     group: 'GitHub' },  // NEW
  { value: 'github_repo_stats',    label: '📊 GitHub - Repo stats',       group: 'GitHub' },  // NEW

  // ── Web & Feeds ────────────────────────────────────────────────────────────
  { value: 'rss_feed',      label: '📡 RSS / Atom Feed',              group: 'Web & Feeds' },
  { value: 'reddit_posts',  label: '🔴 Reddit - Subreddit posts',     group: 'Web & Feeds' },
  { value: 'hacker_news',   label: '🔶 Hacker News - Top stories',    group: 'Web & Feeds' },
  { value: 'fetch_url',     label: '🌐 Fetch URL - Any web page',     group: 'Web & Feeds' },

  // ── System & Data ──────────────────────────────────────────────────────────
  { value: 'weather',        label: '🌤️ Weather - Current conditions',  group: 'System & Data' },
  { value: 'crypto_price',   label: '🪙 Crypto - Live prices',          group: 'System & Data' },
  { value: 'system_stats',   label: '🖥️ System Stats - CPU / Memory',   group: 'System & Data' },
  { value: 'read_file',      label: '📄 Read File - Local file',        group: 'System & Data' },

  // ── Other ──────────────────────────────────────────────────────────────────
  { value: 'custom_context', label: '✍️ Custom - Provide context directly', group: 'Other' },
];

export const OUTPUT_TYPES = [
  { value: 'send_email',       label: '📧 Send email via Gmail',    group: 'Messaging' },
  { value: 'send_notification', label: '🔔 Desktop notification',   group: 'Messaging' },
  { value: 'write_file',       label: '📝 Write to a file',         group: 'Files' },
  { value: 'append_to_memory', label: '🧠 Append to AI Memory',     group: 'AI' },
  { value: 'http_webhook',     label: '🌐 HTTP webhook / POST',      group: 'Webhooks' },
  { value: 'github_pr_review', label: '🐙 Post GitHub PR review',   group: 'GitHub' },  // NEW (was already in engine, now surfaced in UI)
];

export const INSTRUCTION_TEMPLATES = {
  gmail_inbox: 'Read these emails. Identify the most important ones needing action today. For each: subject, sender, what action is needed, and urgency. Then briefly list FYI emails.',
  gmail_search: 'Analyze these matching emails. Summarize findings, highlight patterns and urgent items.',
  gmail_inbox_stats: 'Analyze these inbox statistics. Flag anything concerning — large unread counts, inbox overload. Give a brief health assessment and any recommendations.',
  github_notifications: 'Review these GitHub notifications. Group by type (PR reviews needed, mentions, issues). List immediate action items first.',
  github_repos: 'Review my repositories. Identify any that have open PRs, recent issues, or activity needing attention. Summarize what needs my focus.',
  github_prs: 'Analyze these pull requests. For each: what it does, readiness to merge, concerns, who needs to act.',
  github_issues: 'Review these issues. Categorize by priority. Identify blocked, needs-clarification, or closeable items.',
  github_commits: 'Analyze recent commits. Summarize what changed and flag any risky or large changes.',
  github_releases: 'Review these releases. Summarize what shipped, any breaking changes, and whether I need to act on anything.',
  github_workflow_runs: 'Review these CI/CD workflow runs. Identify failures, flaky tests, or slowdowns. Flag anything needing immediate attention.',
  github_repo_stats: 'Analyze this repository\'s stats. Highlight notable changes in stars, forks, or open issues. Note any trends worth acting on.',
  rss_feed: 'Read these feed articles. Identify the most relevant and interesting items. Summarize key developments.',
  reddit_posts: 'Review these posts. Identify trending topics, significant discussions, and anything worth knowing.',
  hacker_news: 'Summarize the most relevant stories. Focus on AI, engineering, and startup news. Give a brief insight for each.',
  fetch_url: 'Read and analyze this content. Extract key information and anything actionable.',
  weather: 'Based on current weather, provide a practical briefing: what to wear, any warnings, how it affects outdoor plans.',
  crypto_price: 'Analyze these prices and 24h changes. Flag significant moves (>5%), note any trends.',
  system_stats: 'Analyze these system stats. Flag any concerning resource usage. Provide a brief health assessment.',
  read_file: 'Analyze this file content. Summarize key information, patterns, and anything actionable.',
  custom_context: 'Analyze the provided information and give a thoughtful, useful response.',
};
