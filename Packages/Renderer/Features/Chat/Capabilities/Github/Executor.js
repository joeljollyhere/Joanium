const HANDLED = new Set([
    'github_list_repos', 'github_get_issues', 'github_get_pull_requests',
    'github_get_file', 'github_get_file_tree', 'github_get_notifications',
    'github_get_commits', 'github_create_issue', 'github_close_issue',
    'github_reopen_issue', 'github_comment_on_issue', 'github_list_branches',
    'github_get_releases', 'github_star_repo', 'github_create_gist',
    'github_mark_notifications_read',
    'github_get_repo_stats', 'github_create_pull_request', 'github_merge_pull_request',
    'github_close_pull_request', 'github_add_labels', 'github_add_assignees',
    'github_trigger_workflow', 'github_get_latest_workflow_run', 'github_get_latest_release',
    'github_get_notification_count',
]);

export function handles(toolName) { return HANDLED.has(toolName); }

export async function execute(toolName, params, onStage = () => { }) {
    switch (toolName) {

        case 'github_list_repos': {
            onStage(`[GITHUB] Connecting to GitHub…`);
            onStage(`[GITHUB] Fetching repositories…`);
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
            onStage(`[GITHUB] Fetching issues from ${owner}/${repo}…`);
            const res = await window.electronAPI?.githubGetIssues?.(owner, repo);
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            if (!res.issues?.length) return `No open issues in ${owner}/${repo}.`;
            const lines = res.issues.map(i => `#${i.number}: ${i.title} (by ${i.user?.login})`).join('\n');
            return `${res.issues.length} open issue(s) in ${owner}/${repo}:\n\n${lines}`;
        }

        case 'github_get_pull_requests': {
            const { owner, repo } = params;
            if (!owner || !repo) throw new Error('Missing required params: owner, repo');
            onStage(`[GITHUB] Fetching pull requests from ${owner}/${repo}…`);
            const res = await window.electronAPI?.githubGetPRs?.(owner, repo);
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            if (!res.prs?.length) return `No open pull requests in ${owner}/${repo}.`;
            const lines = res.prs.map(p => `#${p.number}: ${p.title} (by ${p.user?.login})`).join('\n');
            return `${res.prs.length} open PR(s) in ${owner}/${repo}:\n\n${lines}`;
        }

        case 'github_get_file': {
            const { owner, repo, filePath } = params;
            if (!owner || !repo || !filePath) throw new Error('Missing required params: owner, repo, filePath');
            onStage(`[GITHUB] Loading ${filePath} from ${owner}/${repo}…`);
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
            onStage(`[GITHUB] Reading file tree of ${owner}/${repo}…`);
            const res = await window.electronAPI?.githubGetTree?.(owner, repo);
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            const blobs = res.tree.filter(f => f.type === 'blob');
            const files = blobs.slice(0, 100).map(f => f.path).join('\n');
            return `File tree of ${owner}/${repo} (${blobs.length} files):\n\n${files}`;
        }

        case 'github_get_notifications': {
            onStage(`[GITHUB] Fetching notifications…`);
            const res = await window.electronAPI?.githubGetNotifications?.();
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            const n = res.notifications ?? [];
            if (!n.length) return 'No unread GitHub notifications.';
            const lines = n.slice(0, 10).map((n2, i) =>
                `${i + 1}. ${n2.subject?.title} in ${n2.repository?.full_name}`
            ).join('\n');
            return `${n.length} unread notification(s):\n\n${lines}`;
        }

        case 'github_get_commits': {
            const { owner, repo } = params;
            if (!owner || !repo) throw new Error('Missing required params: owner, repo');
            onStage(`[GITHUB] Fetching commits from ${owner}/${repo}…`);
            const res = await window.electronAPI?.githubGetCommits?.(owner, repo);
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            const commits = res.commits ?? [];
            if (!commits.length) return `No commits found in ${owner}/${repo}.`;
            const lines = commits.slice(0, 15).map((c, i) => {
                const sha = c.sha?.slice(0, 7) ?? '???????';
                const msg = (c.commit?.message ?? '').split('\n')[0].slice(0, 80);
                const author = c.commit?.author?.name ?? c.author?.login ?? 'unknown';
                const date = c.commit?.author?.date
                    ? new Date(c.commit.author.date).toLocaleDateString()
                    : '';
                return `${i + 1}. \`${sha}\` ${msg}\n   by ${author}${date ? ` on ${date}` : ''}`;
            }).join('\n\n');
            return `Recent commits in ${owner}/${repo}:\n\n${lines}`;
        }

        case 'github_create_issue': {
            const { owner, repo, title, body = '', labels } = params;
            if (!owner || !repo || !title) throw new Error('Missing required params: owner, repo, title');
            onStage(`[GITHUB] Creating issue in ${owner}/${repo}…`);
            const labelArray = labels
                ? labels.split(',').map(l => l.trim()).filter(Boolean)
                : [];
            const res = await window.electronAPI?.githubCreateIssue?.(owner, repo, title, body, labelArray);
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            const issue = res.issue;
            return [
                `✅ Issue created in ${owner}/${repo}`,
                ``,
                `**#${issue.number}: ${issue.title}**`,
                `URL: ${issue.html_url}`,
                labelArray.length ? `Labels: ${labelArray.join(', ')}` : '',
            ].filter(Boolean).join('\n');
        }

        case 'github_close_issue': {
            const { owner, repo, issue_number } = params;
            if (!owner || !repo || !issue_number) throw new Error('Missing required params: owner, repo, issue_number');
            onStage(`[GITHUB] Closing issue #${issue_number} in ${owner}/${repo}…`);
            const res = await window.electronAPI?.githubCloseIssue?.(owner, repo, Number(issue_number));
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            const issue = res.issue;
            return [
                `✅ Issue #${issue_number} closed in ${owner}/${repo}`,
                `Title: ${issue.title}`,
                `URL: ${issue.html_url}`,
            ].join('\n');
        }

        case 'github_reopen_issue': {
            const { owner, repo, issue_number } = params;
            if (!owner || !repo || !issue_number) throw new Error('Missing required params: owner, repo, issue_number');
            onStage(`[GITHUB] Reopening issue #${issue_number} in ${owner}/${repo}…`);
            const res = await window.electronAPI?.githubReopenIssue?.(owner, repo, Number(issue_number));
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            const issue = res.issue;
            return [
                `✅ Issue #${issue_number} reopened in ${owner}/${repo}`,
                `Title: ${issue.title}`,
                `URL: ${issue.html_url}`,
            ].join('\n');
        }

        case 'github_comment_on_issue': {
            const { owner, repo, issue_number, body } = params;
            if (!owner || !repo || !issue_number || !body) {
                throw new Error('Missing required params: owner, repo, issue_number, body');
            }
            onStage(`[GITHUB] Posting comment on #${issue_number} in ${owner}/${repo}…`);
            const res = await window.electronAPI?.githubCommentIssue?.(owner, repo, Number(issue_number), body);
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            const comment = res.comment;
            return [
                `✅ Comment posted on ${owner}/${repo}#${issue_number}`,
                `URL: ${comment?.html_url ?? `https://github.com/${owner}/${repo}/issues/${issue_number}`}`,
            ].join('\n');
        }

        case 'github_list_branches': {
            const { owner, repo } = params;
            if (!owner || !repo) throw new Error('Missing required params: owner, repo');
            onStage(`[GITHUB] Fetching branches from ${owner}/${repo}…`);
            const res = await window.electronAPI?.githubGetBranches?.(owner, repo);
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            const branches = res.branches ?? [];
            if (!branches.length) return `No branches found in ${owner}/${repo}.`;
            const lines = branches.map((b, i) => {
                const sha = b.commit?.sha?.slice(0, 7) ?? '';
                const protection = b.protected ? ' 🔒' : '';
                return `${i + 1}. \`${b.name}\`${sha ? ` (${sha})` : ''}${protection}`;
            }).join('\n');
            return `${branches.length} branch(es) in ${owner}/${repo}:\n\n${lines}`;
        }

        case 'github_get_releases': {
            const { owner, repo, count = 5 } = params;
            if (!owner || !repo) throw new Error('Missing required params: owner, repo');
            const limit = Math.min(Math.max(1, Number(count) || 5), 20);
            onStage(`[GITHUB] Fetching releases from ${owner}/${repo}…`);
            const res = await window.electronAPI?.githubGetReleases?.(owner, repo, limit);
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            const releases = res.releases ?? [];
            if (!releases.length) return `No releases found in ${owner}/${repo}.`;
            const lines = releases.map((r, i) => {
                const published = r.published_at
                    ? new Date(r.published_at).toLocaleDateString()
                    : 'unknown date';
                const tag = r.tag_name ?? 'untagged';
                const name = r.name || tag;
                const prerelease = r.prerelease ? ' [pre-release]' : '';
                const notes = (r.body ?? '').split('\n')[0].slice(0, 80);
                return [
                    `${i + 1}. **${name}** (${tag})${prerelease} — ${published}`,
                    notes ? `   ${notes}` : '',
                    `   ${r.html_url}`,
                ].filter(Boolean).join('\n');
            }).join('\n\n');
            return `Releases for ${owner}/${repo}:\n\n${lines}`;
        }

        case 'github_star_repo': {
            const { owner, repo, action = 'star' } = params;
            if (!owner || !repo) throw new Error('Missing required params: owner, repo');
            const isUnstar = String(action).toLowerCase() === 'unstar';
            onStage(`[GITHUB] ${isUnstar ? 'Unstarring' : 'Starring'} ${owner}/${repo}…`);
            const res = isUnstar
                ? await window.electronAPI?.githubUnstarRepo?.(owner, repo)
                : await window.electronAPI?.githubStarRepo?.(owner, repo);
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            return `${isUnstar ? '⭐ Unstarred' : '⭐ Starred'} ${owner}/${repo} successfully.`;
        }

        case 'github_create_gist': {
            const { description = '', filename, content, public: isPublic = false } = params;
            if (!filename || !content) throw new Error('Missing required params: filename, content');
            onStage(`[GITHUB] Creating gist "${filename}"…`);
            const files = { [filename]: { content } };
            const res = await window.electronAPI?.githubCreateGist?.(description, files, Boolean(isPublic));
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            const gist = res.gist;
            return [
                `✅ Gist created`,
                ``,
                `**${filename}**`,
                description ? `Description: ${description}` : '',
                `Visibility: ${isPublic ? 'Public' : 'Secret'}`,
                `URL: ${gist?.html_url ?? 'https://gist.github.com'}`,
            ].filter(Boolean).join('\n');
        }

        case 'github_mark_notifications_read': {
            onStage(`[GITHUB] Marking all notifications as read…`);
            const res = await window.electronAPI?.githubMarkNotifsRead?.();
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            return '✅ All GitHub notifications marked as read.';
        }

        case 'github_get_repo_stats': {
            const { owner, repo } = params;
            if (!owner || !repo) throw new Error('Missing required params: owner, repo');
            onStage(`[GITHUB] Fetching stats for ${owner}/${repo}…`);
            const res = await window.electronAPI?.githubGetRepoStats?.(owner, repo);
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            const s = res.stats ?? {};
            const sizeKb = s.size ?? 0;
            const sizeFmt = sizeKb >= 1024
                ? `${(sizeKb / 1024).toFixed(1)} MB`
                : `${sizeKb} KB`;
            return [
                `📊 ${owner}/${repo}`,
                ``,
                `⭐ Stars: ${(s.stargazers_count ?? 0).toLocaleString()}`,
                `🍴 Forks: ${(s.forks_count ?? 0).toLocaleString()}`,
                `👀 Watchers: ${(s.watchers_count ?? 0).toLocaleString()}`,
                `🐛 Open issues: ${(s.open_issues_count ?? 0).toLocaleString()}`,
                `🌿 Default branch: ${s.default_branch ?? 'unknown'}`,
                s.language ? `💻 Primary language: ${s.language}` : '',
                `📦 Size: ${sizeFmt}`,
                s.license?.name ? `📄 License: ${s.license.name}` : '',
                s.description ? `\n${s.description}` : '',
                `\n🔗 ${s.html_url ?? `https://github.com/${owner}/${repo}`}`,
            ].filter(Boolean).join('\n');
        }

        case 'github_create_pull_request': {
            const { owner, repo, title, head, base, body = '', draft = false } = params;
            if (!owner || !repo || !title || !head || !base) {
                throw new Error('Missing required params: owner, repo, title, head, base');
            }
            onStage(`[GITHUB] Creating pull request in ${owner}/${repo}…`);
            const res = await window.electronAPI?.githubCreatePR?.(owner, repo, {
                title, head, base, body, draft: Boolean(draft),
            });
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            const pr = res.pr;
            return [
                `✅ Pull request created in ${owner}/${repo}`,
                ``,
                `**#${pr.number}: ${pr.title}**`,
                `${head} → ${base}`,
                draft ? `Status: Draft` : `Status: Open`,
                `URL: ${pr.html_url}`,
            ].join('\n');
        }

        case 'github_merge_pull_request': {
            const { owner, repo, pr_number, merge_method = 'merge', commit_title = '' } = params;
            if (!owner || !repo || !pr_number) throw new Error('Missing required params: owner, repo, pr_number');
            onStage(`[GITHUB] Merging PR #${pr_number} in ${owner}/${repo}…`);
            const res = await window.electronAPI?.githubMergePR?.(
                owner, repo, Number(pr_number), merge_method, commit_title,
            );
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            return [
                `✅ PR #${pr_number} merged in ${owner}/${repo}`,
                `Strategy: ${merge_method}`,
                res.sha ? `Merge SHA: \`${res.sha.slice(0, 7)}\`` : '',
                res.message ? `Message: ${res.message}` : '',
            ].filter(Boolean).join('\n');
        }

        case 'github_close_pull_request': {
            const { owner, repo, pr_number } = params;
            if (!owner || !repo || !pr_number) throw new Error('Missing required params: owner, repo, pr_number');
            onStage(`[GITHUB] Closing PR #${pr_number} in ${owner}/${repo}…`);
            const res = await window.electronAPI?.githubClosePR?.(owner, repo, Number(pr_number));
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            const pr = res.pr;
            return [
                `✅ PR #${pr_number} closed in ${owner}/${repo}`,
                `Title: ${pr.title}`,
                `URL: ${pr.html_url}`,
            ].join('\n');
        }

        case 'github_add_labels': {
            const { owner, repo, issue_number, labels } = params;
            if (!owner || !repo || !issue_number || !labels) {
                throw new Error('Missing required params: owner, repo, issue_number, labels');
            }
            onStage(`[GITHUB] Adding labels to #${issue_number} in ${owner}/${repo}…`);
            const labelArray = labels.split(',').map(l => l.trim()).filter(Boolean);
            const res = await window.electronAPI?.githubAddLabels?.(owner, repo, Number(issue_number), labelArray);
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            const applied = (res.labels ?? []).map(l => l.name ?? l).join(', ');
            return [
                `✅ Labels added to ${owner}/${repo}#${issue_number}`,
                `Applied: ${applied || labelArray.join(', ')}`,
            ].join('\n');
        }

        case 'github_add_assignees': {
            const { owner, repo, issue_number, assignees } = params;
            if (!owner || !repo || !issue_number || !assignees) {
                throw new Error('Missing required params: owner, repo, issue_number, assignees');
            }
            onStage(`[GITHUB] Adding assignees to #${issue_number} in ${owner}/${repo}…`);
            const assigneeArray = assignees.split(',').map(a => a.trim()).filter(Boolean);
            const res = await window.electronAPI?.githubAddAssignees?.(owner, repo, Number(issue_number), assigneeArray);
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            return [
                `✅ Assignees added to ${owner}/${repo}#${issue_number}`,
                `Assigned: ${assigneeArray.map(a => `@${a}`).join(', ')}`,
            ].join('\n');
        }

        case 'github_trigger_workflow': {
            const { owner, repo, workflow_id, ref = 'main', inputs } = params;
            if (!owner || !repo || !workflow_id) {
                throw new Error('Missing required params: owner, repo, workflow_id');
            }
            onStage(`[GITHUB] Triggering workflow "${workflow_id}" on ${owner}/${repo}@${ref}…`);
            let parsedInputs = {};
            if (inputs) {
                try { parsedInputs = JSON.parse(inputs); } catch { /* ignore malformed */ }
            }
            const res = await window.electronAPI?.githubTriggerWorkflow?.(
                owner, repo, workflow_id, ref, parsedInputs,
            );
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            return [
                `✅ Workflow dispatched`,
                `Workflow: ${workflow_id}`,
                `Repo: ${owner}/${repo}`,
                `Branch/ref: ${ref}`,
                Object.keys(parsedInputs).length
                    ? `Inputs: ${JSON.stringify(parsedInputs)}`
                    : '',
                `\nThe run should appear in the Actions tab shortly.`,
            ].filter(Boolean).join('\n');
        }

        case 'github_get_latest_workflow_run': {
            const { owner, repo, workflow_id, branch = '' } = params;
            if (!owner || !repo || !workflow_id) {
                throw new Error('Missing required params: owner, repo, workflow_id');
            }
            onStage(`[GITHUB] Fetching latest run for "${workflow_id}" in ${owner}/${repo}…`);
            const res = await window.electronAPI?.githubGetLatestWorkflowRun?.(
                owner, repo, workflow_id, branch,
            );
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            const run = res.run;
            if (!run) return `No runs found for workflow "${workflow_id}" in ${owner}/${repo}.`;
            const started = run.created_at
                ? new Date(run.created_at).toLocaleString()
                : 'unknown';
            const conclusion = run.conclusion ?? 'in progress';
            const conclusionEmoji = {
                success: '✅', failure: '❌', cancelled: '⚠️', skipped: '⏭️',
            }[conclusion] ?? '🔄';
            return [
                `${conclusionEmoji} Latest run for \`${workflow_id}\` in ${owner}/${repo}`,
                ``,
                `Run #${run.run_number ?? '?'} — ${run.name ?? workflow_id}`,
                `Status: ${run.status} / Conclusion: ${conclusion}`,
                `Branch: ${run.head_branch ?? (branch || 'unknown')}`
                `Event: ${run.event ?? 'unknown'}`,
                `Started: ${started}`,
                `URL: ${run.html_url ?? `https://github.com/${owner}/${repo}/actions`}`,
            ].join('\n');
        }

        case 'github_get_latest_release': {
            const { owner, repo } = params;
            if (!owner || !repo) throw new Error('Missing required params: owner, repo');
            onStage(`[GITHUB] Fetching latest release for ${owner}/${repo}…`);
            const res = await window.electronAPI?.githubGetLatestRelease?.(owner, repo);
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            const r = res.release;
            if (!r) return `No releases found for ${owner}/${repo}.`;
            const published = r.published_at
                ? new Date(r.published_at).toLocaleDateString()
                : 'unknown date';
            const notes = (r.body ?? '').trim().slice(0, 300);
            return [
                `🏷️ Latest release: **${r.name || r.tag_name}** (${r.tag_name})`,
                `Published: ${published}`,
                r.prerelease ? `Status: Pre-release` : `Status: Stable`,
                notes ? `\nRelease notes:\n${notes}${r.body?.length > 300 ? '\n…(truncated)' : ''}` : '',
                `\nURL: ${r.html_url}`,
            ].filter(Boolean).join('\n');
        }

        case 'github_get_notification_count': {
            onStage(`[GITHUB] Counting unread notifications…`);
            const res = await window.electronAPI?.githubGetNotifications?.();
            if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
            const notifications = res.notifications ?? [];
            if (!notifications.length) return '📭 No unread GitHub notifications.';

            // Group by repo
            const byRepo = {};
            for (const n of notifications) {
                const repoName = n.repository?.full_name ?? 'unknown';
                byRepo[repoName] = (byRepo[repoName] ?? 0) + 1;
            }
            const repoLines = Object.entries(byRepo)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([name, count]) => `  • ${name}: ${count}`);

            return [
                `🔔 You have **${notifications.length}** unread GitHub notification${notifications.length !== 1 ? 's' : ''}`,
                ``,
                `By repository:`,
                ...repoLines,
            ].join('\n');
        }

        default:
            throw new Error(`GithubExecutor: unknown tool "${toolName}"`);
    }
}