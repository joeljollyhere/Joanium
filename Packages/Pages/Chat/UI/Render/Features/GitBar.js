let _workingDir = null,
  _pollTimer = null,
  _isDirty = false,
  _currentBranch = '',
  _pendingAction = null;
const POLL_MS = 15000;
const $ = (id) => document.getElementById(id);

function parseGitStatus(stdout) {
  const lines = (stdout || '').split('\n');
  const m = lines[0]?.match(/^## (?:No commits yet on )?(.+?)(?:\.\.\.|\s|$)/);
  return { branch: m?.[1]?.trim() || '', dirty: lines.slice(1).some((l) => l.trim()) };
}
async function gitCall(ch, args = {}) {
  return window.electronAPI?.invoke?.(ch, { workingDir: _workingDir, ...args });
}
function showToast(msg, err = false) {
  const t = Object.assign(document.createElement('div'), {
    className: `pcb-toast${err ? ' pcb-toast-error' : ''}`,
    textContent: msg,
  });
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('pcb-toast-show'));
  setTimeout(() => {
    t.classList.remove('pcb-toast-show');
    setTimeout(() => t.remove(), 300);
  }, 3000);
}
function updatePrimaryBtn() {
  const b = $('pcb-git-action-btn');
  if (!b) return;
  b.textContent = _isDirty ? 'Commit' : 'Push';
  b.dataset.action = _isDirty ? 'commit' : 'push';
}
function applyStatusDot(branch, dirty) {
  const d = $('pcb-status-dot');
  if (!d) return;
  d.classList.toggle('is-dirty', dirty);
  d.classList.toggle('is-clean', !dirty && !!branch);
}
async function refreshStatus() {
  if (!_workingDir) return;
  const res = await gitCall('git-status');
  if (!res?.ok) return;
  const { branch, dirty } = parseGitStatus(res.stdout);
  if (branch) {
    _currentBranch = branch;
    const l = $('pcb-branch-label');
    if (l) l.textContent = branch;
  }
  _isDirty = dirty;
  applyStatusDot(_currentBranch, dirty);
  updatePrimaryBtn();
}
function buildActionMenu() {
  const d = $('pcb-action-dropdown');
  if (!d) return;
  const opts = _isDirty
    ? [
        ['commit', 'Commit'],
        ['commit-push', 'Commit & Push'],
        ['push', 'Push'],
        ['push-sync', 'Push & Sync'],
      ]
    : [
        ['push', 'Push'],
        ['push-sync', 'Push & Sync'],
      ];
  d.innerHTML = opts
    .map(
      ([a, l]) =>
        `<button class="pcb-dropdown-item" data-action="${a}" type="button">${l}</button>`,
    )
    .join('');
}
function closeDropdowns() {
  const b = $('pcb-branch-dropdown'),
    a = $('pcb-action-dropdown');
  if (b) b.hidden = true;
  if (a) a.hidden = true;
}
function openBranchDropdown() {
  const d = $('pcb-branch-dropdown');
  if (!d) return;
  if (!d.hidden) {
    d.hidden = true;
    return;
  }
  d.innerHTML = '<div class="pcb-dropdown-loading">Loading…</div>';
  d.hidden = false;
  gitCall('git-branches').then((res) => {
    if (d.hidden) return;
    const branches = res?.branches || [];
    d.innerHTML = branches.length
      ? branches
          .map(
            (b) =>
              `<button class="pcb-dropdown-item${b === _currentBranch ? ' is-active' : ''}" data-branch="${b}" type="button">${b}</button>`,
          )
          .join('')
      : '<div class="pcb-dropdown-empty">No branches found</div>';
  });
}
async function executeAction(action) {
  if (action === 'commit' || action === 'commit-push') {
    openCommitPopover(action);
    return;
  }
  const res = await (action === 'push-sync'
    ? (async () => {
        const p = await gitCall('git-push-sync');
        return p;
      })()
    : gitCall('git-push'));
  res?.ok
    ? showToast(action === 'push-sync' ? 'Synced' : 'Pushed')
    : showToast(res?.stderr || 'Failed', true);
  await refreshStatus();
}
function openCommitPopover(action) {
  _pendingAction = action;
  const p = $('pcb-commit-popover');
  if (!p) return;
  p.hidden = false;
  $('pcb-commit-msg')?.focus();
  const c = $('pcb-commit-confirm');
  if (c) c.textContent = action === 'commit-push' ? 'Commit & Push' : 'Commit';
}
function closeCommitPopover() {
  const p = $('pcb-commit-popover');
  if (p) p.hidden = true;
  const m = $('pcb-commit-msg');
  if (m) m.value = '';
  _pendingAction = null;
}
async function performCommit() {
  const msg = $('pcb-commit-msg')?.value.trim();
  if (!msg) {
    $('pcb-commit-msg')?.focus();
    return;
  }
  const res = await gitCall('git-commit', { message: msg });
  if (!res?.ok) {
    showToast(res?.stderr || 'Commit failed', true);
    return;
  }
  showToast('Committed');
  if (_pendingAction === 'commit-push') {
    const pr = await gitCall('git-push');
    pr?.ok ? showToast('Pushed') : showToast(pr?.stderr || 'Push failed', true);
  }
  closeCommitPopover();
  await refreshStatus();
}
function onDocClick(e) {
  const bd = $('pcb-branch-dropdown'),
    ad = $('pcb-action-dropdown');
  if (bd && !bd.hidden && !$('pcb-branch-btn')?.contains(e.target) && !bd.contains(e.target))
    bd.hidden = true;
  if (ad && !ad.hidden && !$('pcb-git-action-toggle')?.contains(e.target) && !ad.contains(e.target))
    ad.hidden = true;
}

export function createGitBar() {
  async function init(workingDir) {
    _workingDir = workingDir;
    if (!workingDir) {
      const r = $('pcb-git-row');
      if (r) r.hidden = true;
      return;
    }
    const res = await gitCall('git-status');
    const gitRow = $('pcb-git-row');
    if (!res?.ok || res.exitCode !== 0 || res.stderr?.includes('not a git')) {
      if (gitRow) gitRow.hidden = true;
      return;
    }
    if (gitRow) gitRow.hidden = false;
    const { branch, dirty } = parseGitStatus(res.stdout);
    _currentBranch = branch;
    _isDirty = dirty;
    const l = $('pcb-branch-label');
    if (l) l.textContent = branch || 'main';
    applyStatusDot(branch, dirty);
    updatePrimaryBtn();
    buildActionMenu();
    _pollTimer = setInterval(refreshStatus, POLL_MS);
    $('pcb-branch-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const a = $('pcb-action-dropdown');
      if (a) a.hidden = true;
      openBranchDropdown();
    });
    $('pcb-branch-dropdown')?.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-branch]');
      if (b) {
        $('pcb-branch-dropdown').hidden = true;
        const r = await gitCall('git-checkout-branch', { branch: b.dataset.branch });
        r?.ok
          ? showToast(`Switched to ${b.dataset.branch}`)
          : showToast(r?.stderr || 'Checkout failed', true);
        await refreshStatus();
      }
    });
    $('pcb-git-action-btn')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      closeDropdowns();
      await executeAction(e.currentTarget.dataset.action || 'push');
    });
    $('pcb-git-action-toggle')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const b = $('pcb-branch-dropdown');
      if (b) b.hidden = true;
      buildActionMenu();
      const a = $('pcb-action-dropdown');
      if (a) a.hidden = !a.hidden;
    });
    $('pcb-action-dropdown')?.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-action]');
      if (b) {
        $('pcb-action-dropdown').hidden = true;
        await executeAction(b.dataset.action);
      }
    });
    $('pcb-commit-cancel')?.addEventListener('click', closeCommitPopover);
    $('pcb-commit-confirm')?.addEventListener('click', performCommit);
    document.addEventListener('click', onDocClick);
  }
  function updateWorkingDir(workingDir) {
    if (_pollTimer) {
      clearInterval(_pollTimer);
      _pollTimer = null;
    }
    closeCommitPopover();
    closeDropdowns();
    init(workingDir);
  }
  function cleanup() {
    if (_pollTimer) {
      clearInterval(_pollTimer);
      _pollTimer = null;
    }
    document.removeEventListener('click', onDocClick);
    closeCommitPopover();
    _workingDir = null;
  }
  return { init, updateWorkingDir, cleanup };
}
