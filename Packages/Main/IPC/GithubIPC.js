import { ipcMain } from 'electron';
import * as GithubAPI from '../../Automation/Integrations/Github.js';

export function register(connectorEngine) {
  function creds() { return connectorEngine.getCredentials('github'); }
  function notConnected() { return { ok: false, error: 'GitHub not connected' }; }

  ipcMain.handle('github-get-repos', async () => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      return { ok: true, repos: await GithubAPI.getRepos(c) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-file', async (_e, owner, repo, filePath) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      return { ok: true, ...(await GithubAPI.getFileContent(c, owner, repo, filePath)) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-tree', async (_e, owner, repo, branch) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      const tree = await GithubAPI.getRepoTree(c, owner, repo, branch);
      return { ok: true, tree: tree?.tree ?? [] };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-issues', async (_e, owner, repo, state = 'open') => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      return { ok: true, issues: await GithubAPI.getIssues(c, owner, repo, state) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-prs', async (_e, owner, repo, state = 'open') => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      return { ok: true, prs: await GithubAPI.getPullRequests(c, owner, repo, state) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-notifications', async () => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      return { ok: true, notifications: await GithubAPI.getNotifications(c) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-search-code', async (_e, owner, repo, query) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      const scope = owner && repo ? `${owner}/${repo}` : '';
      return { ok: true, ...(await GithubAPI.searchCode(c, query, scope)) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-commits', async (_e, owner, repo) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      return { ok: true, commits: await GithubAPI.getCommits(c, owner, repo) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-pr-diff', async (_e, owner, repo, prNumber) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      return { ok: true, diff: await GithubAPI.getPRDiff(c, owner, repo, prNumber) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-pr-details', async (_e, owner, repo, prNumber) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      return { ok: true, pr: await GithubAPI.getPRDetails(c, owner, repo, prNumber) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-create-pr-review', async (_e, owner, repo, prNumber, review) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      const created = await GithubAPI.createPRReview(c, owner, repo, prNumber, review ?? {});
      return { ok: true, ...created };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-pr-checks', async (_e, owner, repo, prNumber) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      return { ok: true, checks: await GithubAPI.getPRChecks(c, owner, repo, prNumber) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-workflow-runs', async (_e, owner, repo, branch = '', event = '', perPage = 20) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      const runs = await GithubAPI.getWorkflowRuns(c, owner, repo, { branch, event, perPage });
      return { ok: true, runs: runs.workflow_runs ?? [], total_count: runs.total_count ?? 0 };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-pr-comments', async (_e, owner, repo, prNumber) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      return { ok: true, comments: await GithubAPI.getPRComments(c, owner, repo, prNumber) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-repo-stats', async (_e, owner, repo) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      return { ok: true, stats: await GithubAPI.getRepoStats(c, owner, repo) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-star-repo', async (_e, owner, repo) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      await GithubAPI.starRepo(c, owner, repo);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-unstar-repo', async (_e, owner, repo) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      await GithubAPI.unstarRepo(c, owner, repo);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-releases', async (_e, owner, repo, perPage = 10) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      return { ok: true, releases: await GithubAPI.getReleases(c, owner, repo, perPage) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-latest-release', async (_e, owner, repo) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      return { ok: true, release: await GithubAPI.getLatestRelease(c, owner, repo) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-create-pr', async (_e, owner, repo, options) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      const pr = await GithubAPI.createPR(c, owner, repo, options ?? {});
      return { ok: true, pr };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-merge-pr', async (_e, owner, repo, prNumber, mergeMethod = 'merge', commitTitle = '') => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      const result = await GithubAPI.mergePR(c, owner, repo, prNumber, mergeMethod, commitTitle);
      return { ok: true, ...result };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-close-pr', async (_e, owner, repo, prNumber) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      const pr = await GithubAPI.closePR(c, owner, repo, prNumber);
      return { ok: true, pr };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-create-issue', async (_e, owner, repo, title, body = '', labels = []) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      const issue = await GithubAPI.createIssue(c, owner, repo, title, body, labels);
      return { ok: true, issue };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-close-issue', async (_e, owner, repo, issueNumber, reason = 'completed') => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      const issue = await GithubAPI.closeIssue(c, owner, repo, issueNumber, reason);
      return { ok: true, issue };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-reopen-issue', async (_e, owner, repo, issueNumber) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      const issue = await GithubAPI.reopenIssue(c, owner, repo, issueNumber);
      return { ok: true, issue };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-comment-issue', async (_e, owner, repo, issueNumber, body) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      const comment = await GithubAPI.addIssueComment(c, owner, repo, issueNumber, body);
      return { ok: true, comment };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-add-labels', async (_e, owner, repo, issueNumber, labels) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      const result = await GithubAPI.addLabels(c, owner, repo, issueNumber, labels ?? []);
      return { ok: true, labels: result };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-add-assignees', async (_e, owner, repo, issueNumber, assignees) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      const result = await GithubAPI.addAssignees(c, owner, repo, issueNumber, assignees ?? []);
      return { ok: true, result };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-mark-notifs-read', async () => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      await GithubAPI.markAllNotificationsRead(c);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-trigger-workflow', async (_e, owner, repo, workflowId, ref = 'main', inputs = {}) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      await GithubAPI.triggerWorkflow(c, owner, repo, workflowId, ref, inputs);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-latest-workflow-run', async (_e, owner, repo, workflowId, branch = '') => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      const run = await GithubAPI.getLatestWorkflowRun(c, owner, repo, workflowId, branch);
      return { ok: true, run };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-create-gist', async (_e, description, files, isPublic = false) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      const gist = await GithubAPI.createGist(c, description, files, isPublic);
      return { ok: true, gist };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-branches', async (_e, owner, repo) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      return { ok: true, branches: await GithubAPI.getBranches(c, owner, repo) };
    } catch (err) { return { ok: false, error: err.message }; }
  });
}
