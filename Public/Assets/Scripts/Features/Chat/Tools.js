// ─────────────────────────────────────────────
//  openworld — Public/Assets/Scripts/Features/Chat/Tools.js
//  Defines all available tools the AI can call.
//  These are sent to the AI so it can decide what to invoke.
// ─────────────────────────────────────────────

export const TOOLS = [
  // ── Gmail ────────────────────────────────────────────────────────────
  {
    name: 'gmail_send_email',
    description: 'Send an email via the user\'s connected Gmail account.',
    parameters: {
      to:      { type: 'string',  required: true,  description: 'Recipient email address' },
      subject: { type: 'string',  required: true,  description: 'Email subject line' },
      body:    { type: 'string',  required: true,  description: 'Email body / message content' },
    },
  },
  {
    name: 'gmail_read_inbox',
    description: 'Fetch and summarize the user\'s unread emails from Gmail.',
    parameters: {
      maxResults: { type: 'number', required: false, description: 'Max emails to fetch (default 15)' },
    },
  },
  {
    name: 'gmail_search_emails',
    description: 'Search the user\'s Gmail inbox for emails matching a query.',
    parameters: {
      query:      { type: 'string',  required: true,  description: 'Gmail search query (e.g. "from:boss", "project alpha")' },
      maxResults: { type: 'number',  required: false, description: 'Max results (default 10)' },
    },
  },

  // ── GitHub ────────────────────────────────────────────────────────────
  {
    name: 'github_list_repos',
    description: 'List the user\'s GitHub repositories.',
    parameters: {},
  },
  {
    name: 'github_get_issues',
    description: 'Get open issues for a GitHub repository.',
    parameters: {
      owner: { type: 'string', required: true,  description: 'GitHub username or organization' },
      repo:  { type: 'string', required: true,  description: 'Repository name' },
    },
  },
  {
    name: 'github_get_pull_requests',
    description: 'Get open pull requests for a GitHub repository.',
    parameters: {
      owner: { type: 'string', required: true,  description: 'GitHub username or organization' },
      repo:  { type: 'string', required: true,  description: 'Repository name' },
    },
  },
  {
    name: 'github_get_file',
    description: 'Load the contents of a specific file from a GitHub repository.',
    parameters: {
      owner:    { type: 'string', required: true, description: 'GitHub username or organization' },
      repo:     { type: 'string', required: true, description: 'Repository name' },
      filePath: { type: 'string', required: true, description: 'Path to the file within the repo (e.g. "src/index.js")' },
    },
  },
  {
    name: 'github_get_file_tree',
    description: 'Get the full file/folder structure of a GitHub repository.',
    parameters: {
      owner: { type: 'string', required: true, description: 'GitHub username or organization' },
      repo:  { type: 'string', required: true, description: 'Repository name' },
    },
  },
  {
    name: 'github_get_notifications',
    description: 'Get unread GitHub notifications for the user.',
    parameters: {},
  },
];

/**
 * Build a plain-text description of all tools for injection into a prompt.
 */
export function buildToolsPrompt() {
  return TOOLS.map(tool => {
    const params = Object.entries(tool.parameters).map(([key, p]) =>
      `    - ${key} (${p.type}${p.required ? ', required' : ', optional'}): ${p.description}`
    ).join('\n');

    return [
      `• ${tool.name}`,
      `  Description: ${tool.description}`,
      params ? `  Parameters:\n${params}` : `  Parameters: none`,
    ].join('\n');
  }).join('\n\n');
}
