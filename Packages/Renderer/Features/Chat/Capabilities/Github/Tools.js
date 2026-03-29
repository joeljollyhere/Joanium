export const GITHUB_TOOLS = [
  {
    name: 'github_list_repos',
    description: "List the user's GitHub repositories.",
    category: 'github',
    parameters: {},
  },
  {
    name: 'github_get_issues',
    description: 'Get open issues for a GitHub repository.',
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true, description: 'GitHub username or organization' },
      repo: { type: 'string', required: true, description: 'Repository name' },
    },
  },
  {
    name: 'github_get_pull_requests',
    description: 'Get open pull requests for a GitHub repository.',
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true, description: 'GitHub username or organization' },
      repo: { type: 'string', required: true, description: 'Repository name' },
    },
  },
  {
    name: 'github_get_file',
    description: 'Load the contents of a specific file from a GitHub repository.',
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true, description: 'GitHub username or organization' },
      repo: { type: 'string', required: true, description: 'Repository name' },
      filePath: { type: 'string', required: true, description: 'Path to the file within the repo (e.g. "src/index.js")' },
    },
  },
  {
    name: 'github_get_file_tree',
    description: 'Get the full file/folder structure of a GitHub repository.',
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true, description: 'GitHub username or organization' },
      repo: { type: 'string', required: true, description: 'Repository name' },
    },
  },
  {
    name: 'github_get_notifications',
    description: 'Get unread GitHub notifications for the user.',
    category: 'github',
    parameters: {},
  },
  {
    name: 'github_get_commits',
    description: 'Get the most recent commits for a GitHub repository, including commit messages, authors, and timestamps.',
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true, description: 'GitHub username or organization' },
      repo: { type: 'string', required: true, description: 'Repository name' },
    },
  },
  {
    name: 'github_create_issue',
    description: 'Create a new issue in a GitHub repository with a title, optional body, and optional labels.',
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true, description: 'GitHub username or organization' },
      repo: { type: 'string', required: true, description: 'Repository name' },
      title: { type: 'string', required: true, description: 'Issue title' },
      body: { type: 'string', required: false, description: 'Issue body / description (markdown supported)' },
      labels: { type: 'string', required: false, description: 'Comma-separated label names (e.g. "bug,help wanted")' },
    },
  },
  {
    name: 'github_close_issue',
    description: 'Close an existing issue in a GitHub repository.',
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true, description: 'GitHub username or organization' },
      repo: { type: 'string', required: true, description: 'Repository name' },
      issue_number: { type: 'number', required: true, description: 'Issue number to close' },
    },
  },
  {
    name: 'github_reopen_issue',
    description: 'Reopen a previously closed issue in a GitHub repository.',
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true, description: 'GitHub username or organization' },
      repo: { type: 'string', required: true, description: 'Repository name' },
      issue_number: { type: 'number', required: true, description: 'Issue number to reopen' },
    },
  },
  {
    name: 'github_comment_on_issue',
    description: 'Post a comment on an existing GitHub issue or pull request.',
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true, description: 'GitHub username or organization' },
      repo: { type: 'string', required: true, description: 'Repository name' },
      issue_number: { type: 'number', required: true, description: 'Issue or PR number to comment on' },
      body: { type: 'string', required: true, description: 'Comment text (markdown supported)' },
    },
  },
  {
    name: 'github_list_branches',
    description: 'List all branches in a GitHub repository.',
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true, description: 'GitHub username or organization' },
      repo: { type: 'string', required: true, description: 'Repository name' },
    },
  },
  {
    name: 'github_get_releases',
    description: 'Get the latest releases for a GitHub repository, including version tags, release notes, and publish dates.',
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true, description: 'GitHub username or organization' },
      repo: { type: 'string', required: true, description: 'Repository name' },
      count: { type: 'number', required: false, description: 'Number of releases to fetch (default: 5, max: 20)' },
    },
  },
  {
    name: 'github_star_repo',
    description: 'Star or unstar a GitHub repository on behalf of the user.',
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true, description: 'GitHub username or organization' },
      repo: { type: 'string', required: true, description: 'Repository name' },
      action: { type: 'string', required: false, description: '"star" (default) or "unstar"' },
    },
  },
  {
    name: 'github_create_gist',
    description: 'Create a new GitHub Gist with one or more files. Useful for sharing code snippets.',
    category: 'github',
    parameters: {
      description: { type: 'string', required: false, description: 'Gist description' },
      filename: { type: 'string', required: true, description: 'Name of the primary file (e.g. "snippet.js")' },
      content: { type: 'string', required: true, description: 'Content of the primary file' },
      public: { type: 'boolean', required: false, description: 'Set true to make the gist public (default: false / secret)' },
    },
  },
  {
    name: 'github_mark_notifications_read',
    description: "Mark all of the user's GitHub notifications as read.",
    category: 'github',
    parameters: {},
  },
  {
    name: 'github_get_repo_stats',
    description: 'Get detailed statistics for a GitHub repository — stars, forks, watchers, open issues, size, default branch, and primary language.',
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true, description: 'GitHub username or organization' },
      repo: { type: 'string', required: true, description: 'Repository name' },
    },
  },
  {
    name: 'github_create_pull_request',
    description: 'Create a new pull request in a GitHub repository from a head branch into a base branch.',
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true, description: 'GitHub username or organization' },
      repo: { type: 'string', required: true, description: 'Repository name' },
      title: { type: 'string', required: true, description: 'Pull request title' },
      head: { type: 'string', required: true, description: 'Branch containing your changes (e.g. "feature/my-feature")' },
      base: { type: 'string', required: true, description: 'Branch to merge into (e.g. "main")' },
      body: { type: 'string', required: false, description: 'PR description (markdown supported)' },
      draft: { type: 'boolean', required: false, description: 'Set true to open as a draft PR' },
    },
  },
  {
    name: 'github_merge_pull_request',
    description: 'Merge a pull request. Supports merge commit, squash, and rebase strategies.',
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true, description: 'GitHub username or organization' },
      repo: { type: 'string', required: true, description: 'Repository name' },
      pr_number: { type: 'number', required: true, description: 'Pull request number to merge' },
      merge_method: { type: 'string', required: false, description: 'Merge strategy: "merge" (default), "squash", or "rebase"' },
      commit_title: { type: 'string', required: false, description: 'Optional custom commit title for the merge commit' },
    },
  },
  {
    name: 'github_close_pull_request',
    description: 'Close a pull request without merging it.',
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true, description: 'GitHub username or organization' },
      repo: { type: 'string', required: true, description: 'Repository name' },
      pr_number: { type: 'number', required: true, description: 'Pull request number to close' },
    },
  },
  {
    name: 'github_add_labels',
    description: 'Add one or more labels to a GitHub issue or pull request.',
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true, description: 'GitHub username or organization' },
      repo: { type: 'string', required: true, description: 'Repository name' },
      issue_number: { type: 'number', required: true, description: 'Issue or PR number' },
      labels: { type: 'string', required: true, description: 'Comma-separated label names to add (e.g. "bug,priority: high")' },
    },
  },
  {
    name: 'github_add_assignees',
    description: 'Assign one or more GitHub users to an issue or pull request.',
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true, description: 'GitHub username or organization' },
      repo: { type: 'string', required: true, description: 'Repository name' },
      issue_number: { type: 'number', required: true, description: 'Issue or PR number' },
      assignees: { type: 'string', required: true, description: 'Comma-separated GitHub usernames to assign (e.g. "alice,bob")' },
    },
  },
  {
    name: 'github_trigger_workflow',
    description: 'Manually trigger a GitHub Actions workflow via the workflow_dispatch event.',
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true, description: 'GitHub username or organization' },
      repo: { type: 'string', required: true, description: 'Repository name' },
      workflow_id: { type: 'string', required: true, description: 'Workflow file name or ID (e.g. "deploy.yml")' },
      ref: { type: 'string', required: false, description: 'Branch or tag to run the workflow on (default: "main")' },
      inputs: { type: 'string', required: false, description: 'JSON string of workflow inputs (e.g. \'{"env":"staging"}\')' },
    },
  },
  {
    name: 'github_get_latest_workflow_run',
    description: 'Get the status and conclusion of the latest GitHub Actions run for a specific workflow file.',
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true, description: 'GitHub username or organization' },
      repo: { type: 'string', required: true, description: 'Repository name' },
      workflow_id: { type: 'string', required: true, description: 'Workflow file name or ID (e.g. "ci.yml")' },
      branch: { type: 'string', required: false, description: 'Optional branch to filter by' },
    },
  },
  {
    name: 'github_get_latest_release',
    description: "Get only the single latest published release for a repository — tag, name, date, and release notes summary.",
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true, description: 'GitHub username or organization' },
      repo: { type: 'string', required: true, description: 'Repository name' },
    },
  },
  {
    name: 'github_get_notification_count',
    description: "Get a quick count of the user's unread GitHub notifications, grouped by repository.",
    category: 'github',
    parameters: {},
  },
];