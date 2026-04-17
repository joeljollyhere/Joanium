import { ipcMain } from 'electron';
import { exec } from 'child_process';
import * as ProjectService from '../Services/ProjectService.js';
import { wrapHandler, wrapRead } from './IPCWrapper.js';
export const ipcMeta = { needs: [] };

function runGit(command, workingDir) {
  return new Promise((resolve) => {
    exec(
      command,
      {
        cwd: workingDir,
        timeout: 20000,
        maxBuffer: 128000,
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
      },
      (err, stdout, stderr) => {
        resolve({
          ok: !err,
          stdout: stdout || '',
          stderr: stderr || '',
          exitCode: typeof err?.code === 'number' ? err.code : 0,
        });
      },
    );
  });
}
export function register() {
  (ipcMain.handle(
    'get-projects',
    wrapRead(() => ProjectService.list()),
  ),
    ipcMain.handle(
      'get-project',
      wrapRead((projectId) => ProjectService.get(projectId)),
    ),
    ipcMain.handle(
      'create-project',
      wrapHandler((projectData) => ({ project: ProjectService.create(projectData) })),
    ),
    ipcMain.handle(
      'update-project',
      wrapHandler((projectId, patch) => ({ project: ProjectService.update(projectId, patch) })),
    ),
    ipcMain.handle(
      'delete-project',
      wrapHandler((projectId) => {
        ProjectService.remove(projectId);
      }),
    ),
    ipcMain.handle(
      'validate-project',
      wrapHandler((projectId) => {
        const project = ProjectService.get(projectId);
        return { project: project, folderExists: project.folderExists };
      }),
    ));

  ipcMain.handle('git-branches', async (_e, { workingDir }) => {
    if (!workingDir?.trim()) return { ok: false, error: 'No working directory provided.' };
    const [currentRes, allRes] = await Promise.all([
      runGit('git rev-parse --abbrev-ref HEAD', workingDir),
      runGit('git branch --format=%(refname:short)', workingDir),
    ]);
    if (!currentRes.ok && !allRes.ok) return { ok: false, error: 'Not a git repository.' };
    const current = currentRes.stdout.trim();
    const branches = allRes.stdout
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean);
    return { ok: true, current, branches };
  });

  ipcMain.handle('git-checkout-branch', async (_e, { workingDir, branch }) => {
    if (!workingDir?.trim()) return { ok: false, error: 'No working directory provided.' };
    if (!branch?.trim()) return { ok: false, error: 'No branch name provided.' };
    return runGit(`git checkout "${branch}"`, workingDir);
  });

  ipcMain.handle('git-commit', async (_e, { workingDir, message }) => {
    if (!workingDir?.trim()) return { ok: false, error: 'No working directory provided.' };
    if (!message?.trim()) return { ok: false, error: 'No commit message provided.' };
    const stageRes = await runGit('git add -A', workingDir);
    if (!stageRes.ok) return stageRes;
    const safeMsg = message.replace(/"/g, '\\"');
    return runGit(`git commit -m "${safeMsg}"`, workingDir);
  });

  ipcMain.handle('git-push', async (_e, { workingDir }) => {
    if (!workingDir?.trim()) return { ok: false, error: 'No working directory provided.' };
    return runGit('git push', workingDir);
  });

  ipcMain.handle('git-push-sync', async (_e, { workingDir }) => {
    if (!workingDir?.trim()) return { ok: false, error: 'No working directory provided.' };
    const pullRes = await runGit('git pull', workingDir);
    if (!pullRes.ok) return pullRes;
    return runGit('git push', workingDir);
  });
}
